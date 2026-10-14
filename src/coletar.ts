import { MOCK } from "./config.js";
import { conectar, colFontes, colPosts, desconectar, type Post } from "./db.js";
import { buscarPosts, sleep, type MediaItem } from "./meta.js";
import { filtrar } from "./filtro.js";
import { classificar, baixarImagem } from "./classificador.js";
import { mockFontes } from "./mock.js";

const CUSTO_INPUT = 0.1 / 1_000_000;
const CUSTO_OUTPUT = 0.5 / 1_000_000;
const CUSTO_CACHE_READ = CUSTO_INPUT * 0.1;

interface Resumo {
  perfisLidos: number;
  perfisComErro: number;
  perfisDesativados: number;
  postNovos: number;
  filtrados: number;
  classificados: number;
  erros: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  top5: {
    perfil: string;
    nota: number;
    categoria: string;
    permalink: string;
  }[];
}

async function coletarMock(): Promise<
  { fonte: string; parceiro: boolean; seguidores: number; posts: MediaItem[] }[]
> {
  return mockFontes.map((f) => ({
    fonte: f.username,
    parceiro: f.parceiro,
    seguidores: f.seguidores,
    posts: f.posts,
  }));
}

async function main() {
  await conectar();
  const fontes = colFontes();
  const posts = colPosts();

  const resumo: Resumo = {
    perfisLidos: 0,
    perfisComErro: 0,
    perfisDesativados: 0,
    postNovos: 0,
    filtrados: 0,
    classificados: 0,
    erros: 0,
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    top5: [],
  };

  let dadosFontes: {
    fonte: string;
    parceiro: boolean;
    seguidores: number;
    posts: MediaItem[];
  }[];

  if (MOCK) {
    console.log("🧪 Modo MOCK ativado\n");
    dadosFontes = await coletarMock();
  } else {
    const fontesAtivas = await fontes.find({ ativo: true }).toArray();
    dadosFontes = [];

    for (const fonte of fontesAtivas) {
      try {
        const result = await buscarPosts(fonte.username);
        await fontes.updateOne(
          { username: fonte.username },
          {
            $set: {
              falhas_seguidas: 0,
              seguidores: result.seguidores,
              ultima_coleta: new Date(),
            },
          }
        );
        dadosFontes.push({
          fonte: fonte.username,
          parceiro: fonte.parceiro,
          seguidores: result.seguidores,
          posts: result.posts,
        });
        resumo.perfisLidos++;
        await sleep(1000);
      } catch (err: any) {
        resumo.perfisComErro++;
        const novasFalhas = (fonte.falhas_seguidas ?? 0) + 1;
        const update: Record<string, any> = {
          falhas_seguidas: novasFalhas,
        };
        if (novasFalhas >= 3) {
          update.ativo = false;
          update.motivo_desativacao = err.message ?? "Erro desconhecido";
          resumo.perfisDesativados++;
          console.log(`  ❌ ${fonte.username} desativado: ${err.message}`);
        }
        await fontes.updateOne(
          { username: fonte.username },
          { $set: update }
        );
      }
    }
  }

  if (MOCK) {
    resumo.perfisLidos = dadosFontes.length;
  }

  const limite48h = Date.now() - 48 * 3600_000;
  const todosClassificados: Post[] = [];

  for (const df of dadosFontes) {
    console.log(`📷 ${df.fonte} (${df.seguidores.toLocaleString("pt-BR")} seg)`);

    for (const media of df.posts) {
      try {
        // Ignorar posts > 48h
        const dataPost = new Date(media.timestamp);
        if (dataPost.getTime() < limite48h) continue;

        // Ignorar duplicados
        const existe = await posts.findOne({ _id: media.id });
        if (existe) continue;

        resumo.postNovos++;
        const legenda = media.caption ?? "";
        const ehParceiro = df.parceiro;

        // Filtro grátis
        if (!ehParceiro && !filtrar(legenda)) {
          const doc: Post = {
            _id: media.id,
            permalink: media.permalink,
            fonte: df.fonte,
            parceiro: ehParceiro,
            tipo: media.media_type,
            legenda,
            media_url: media.media_url ?? "",
            thumbnail_url: media.thumbnail_url ?? "",
            data_post: dataPost,
            curtidas: media.like_count,
            comentarios: media.comments_count,
            seguidores_fonte: df.seguidores,
            status: "filtrado",
            coletado_em: new Date(),
            enviado_telegram: false,
          };
          await posts.insertOne(doc as any);
          resumo.filtrados++;
          console.log(`  ⬜ Filtrado: ${legenda.slice(0, 60)}...`);
          continue;
        }

        // Classificar com Claude
        const horas = Math.round(
          (Date.now() - dataPost.getTime()) / 3600_000
        );

        // Baixar imagem
        let imagemBase64: string | undefined;
        let imagemMediaType: string | undefined;
        const imageUrl =
          media.media_type === "VIDEO" || media.media_type === "REELS"
            ? media.thumbnail_url
            : media.media_url;
        if (imageUrl) {
          const img = await baixarImagem(imageUrl);
          if (img) {
            imagemBase64 = img.base64;
            imagemMediaType = img.mediaType;
          }
        }

        try {
          const { classificacao, usage } = await classificar({
            perfil: df.fonte,
            seguidores: df.seguidores,
            parceiro: ehParceiro,
            legenda,
            tipo: media.media_type,
            curtidas: media.like_count,
            comentarios: media.comments_count,
            horas,
            imagemBase64,
            imagemMediaType,
          });

          resumo.inputTokens += usage.input_tokens;
          resumo.outputTokens += usage.output_tokens;
          resumo.cacheReadTokens +=
            (usage as any).cache_read_input_tokens ?? 0;

          const doc: Post = {
            _id: media.id,
            permalink: media.permalink,
            fonte: df.fonte,
            parceiro: ehParceiro,
            tipo: media.media_type,
            legenda,
            media_url: media.media_url ?? "",
            thumbnail_url: media.thumbnail_url ?? "",
            data_post: dataPost,
            curtidas: media.like_count,
            comentarios: media.comments_count,
            seguidores_fonte: df.seguidores,
            status: "pendente",
            classificacao,
            coletado_em: new Date(),
            enviado_telegram: false,
          };
          await posts.insertOne(doc as any);
          resumo.classificados++;
          todosClassificados.push(doc);

          const emoji =
            classificacao.nota >= 7
              ? "🟢"
              : classificacao.nota >= 4
                ? "🟡"
                : "⚪";
          console.log(
            `  ${emoji} [${classificacao.nota}] ${classificacao.categoria}: ${legenda.slice(0, 50)}...`
          );
        } catch (err: any) {
          const doc: Post = {
            _id: media.id,
            permalink: media.permalink,
            fonte: df.fonte,
            parceiro: ehParceiro,
            tipo: media.media_type,
            legenda,
            media_url: media.media_url ?? "",
            thumbnail_url: media.thumbnail_url ?? "",
            data_post: dataPost,
            curtidas: media.like_count,
            comentarios: media.comments_count,
            seguidores_fonte: df.seguidores,
            status: "erro",
            coletado_em: new Date(),
            enviado_telegram: false,
          };
          await posts.insertOne(doc as any);
          resumo.erros++;
          console.log(`  ❗ Erro ao classificar: ${err.message}`);
        }
      } catch (err: any) {
        resumo.erros++;
        console.log(`  ❗ Erro no post ${media.id}: ${err.message}`);
      }
    }
  }

  // Top 5
  resumo.top5 = todosClassificados
    .filter((p) => p.classificacao)
    .sort((a, b) => (b.classificacao!.nota - a.classificacao!.nota))
    .slice(0, 5)
    .map((p) => ({
      perfil: p.fonte,
      nota: p.classificacao!.nota,
      categoria: p.classificacao!.categoria,
      permalink: p.permalink,
    }));

  // Resumo final
  const custoInput = resumo.inputTokens * CUSTO_INPUT;
  const custoCache = resumo.cacheReadTokens * CUSTO_CACHE_READ;
  const custoOutput = resumo.outputTokens * CUSTO_OUTPUT;
  const custoTotal = custoInput + custoCache + custoOutput;

  console.log("\n" + "=".repeat(60));
  console.log("📊 RESUMO DA COLETA");
  console.log("=".repeat(60));
  console.log(`Perfis lidos:          ${resumo.perfisLidos}`);
  console.log(`Perfis com erro:       ${resumo.perfisComErro}`);
  console.log(`Perfis desativados:    ${resumo.perfisDesativados}`);
  console.log(`Posts novos:           ${resumo.postNovos}`);
  console.log(`Filtrados:             ${resumo.filtrados}`);
  console.log(`Classificados:         ${resumo.classificados}`);
  console.log(`Erros:                 ${resumo.erros}`);
  console.log("---");
  console.log(
    `Tokens entrada:        ${resumo.inputTokens.toLocaleString("pt-BR")} (cache: ${resumo.cacheReadTokens.toLocaleString("pt-BR")})`
  );
  console.log(
    `Tokens saída:          ${resumo.outputTokens.toLocaleString("pt-BR")}`
  );
  console.log(`Custo estimado:        US$ ${custoTotal.toFixed(4)}`);

  if (resumo.top5.length > 0) {
    console.log("\n🏆 Top 5:");
    for (const t of resumo.top5) {
      console.log(
        `  [${t.nota}] ${t.categoria.padEnd(20)} @${t.perfil.padEnd(20)} ${t.permalink}`
      );
    }
  }

  await desconectar();
}

main().catch((err) => {
  console.error("Erro fatal:", err.message);
  process.exit(1);
});
