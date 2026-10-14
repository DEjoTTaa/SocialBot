import { conectar, colFontes, desconectar, type Fonte } from "./db.js";
import { buscarSeguidores } from "./meta.js";

async function main() {
  await conectar();
  const col = colFontes();

  const fontes = await col.find({ ativo: true }).toArray();
  console.log(`Verificando ${fontes.length} fontes ativas...\n`);

  const resultados: { perfil: string; status: string; motivo: string }[] = [];

  for (const fonte of fontes) {
    try {
      const { seguidores } = await buscarSeguidores(fonte.username);
      await col.updateOne(
        { username: fonte.username },
        { $set: { seguidores } }
      );
      resultados.push({
        perfil: fonte.username,
        status: "ok",
        motivo: `${seguidores.toLocaleString("pt-BR")} seguidores`,
      });
    } catch (err: any) {
      const motivo = err.message ?? "Erro desconhecido";
      await col.updateOne(
        { username: fonte.username },
        { $set: { ativo: false, motivo_desativacao: motivo } }
      );
      resultados.push({ perfil: fonte.username, status: "erro", motivo });
    }
  }

  // Imprimir tabela
  const maxPerfil = Math.max(
    6,
    ...resultados.map((r) => r.perfil.length)
  );
  const maxMotivo = Math.max(
    6,
    ...resultados.map((r) => r.motivo.length)
  );

  const header = `${"Perfil".padEnd(maxPerfil)} | Status | Motivo`;
  console.log(header);
  console.log("-".repeat(header.length));

  for (const r of resultados) {
    const status = r.status === "ok" ? " ok  " : "erro ";
    console.log(`${r.perfil.padEnd(maxPerfil)} | ${status} | ${r.motivo}`);
  }

  const ok = resultados.filter((r) => r.status === "ok").length;
  const erros = resultados.filter((r) => r.status === "erro").length;
  console.log(`\nResultado: ${ok} ok, ${erros} desativados.`);

  await desconectar();
}

main().catch((err) => {
  console.error("Erro:", err.message);
  process.exit(1);
});
