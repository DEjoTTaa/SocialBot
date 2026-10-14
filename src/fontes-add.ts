import { readFileSync } from "fs";
import { resolve } from "path";
import { conectar, colFontes, desconectar } from "./db.js";

interface FontesJson {
  perfis: string[];
  parceiros: string[];
}

async function main() {
  const caminho = resolve(import.meta.dirname, "..", "fontes.json");
  const dados: FontesJson = JSON.parse(readFileSync(caminho, "utf-8"));
  const parceirosSet = new Set(dados.parceiros);

  await conectar();
  const col = colFontes();

  let inseridos = 0;
  let atualizados = 0;
  let ignorados = 0;

  for (const username of dados.perfis) {
    const parceiro = parceirosSet.has(username);
    const result = await col.updateOne(
      { username },
      {
        $set: { parceiro },
        $setOnInsert: {
          ativo: true,
          falhas_seguidas: 0,
        },
      },
      { upsert: true }
    );
    if (result.upsertedCount) inseridos++;
    else if (result.modifiedCount) atualizados++;
    else ignorados++;
  }

  console.log(
    `Fontes: ${inseridos} inseridas, ${atualizados} atualizadas, ${ignorados} sem alteração.`
  );
  console.log(`Total de perfis no arquivo: ${dados.perfis.length}`);
  console.log(`Parceiros: ${dados.parceiros.join(", ")}`);

  await desconectar();
}

main().catch((err) => {
  console.error("Erro:", err.message);
  process.exit(1);
});
