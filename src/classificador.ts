import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { resolve } from "path";
import { ANTHROPIC_API_KEY, ANTHROPIC_WORKSPACE_ID } from "./config.js";
import type { Classificacao } from "./db.js";

const client = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
  ...(ANTHROPIC_WORKSPACE_ID && {
    defaultHeaders: { "anthropic-workspace-id": ANTHROPIC_WORKSPACE_ID },
  }),
});

const systemPrompt = readFileSync(
  resolve(import.meta.dirname, "..", "prompts", "classificador.md"),
  "utf-8"
);

const CATEGORIAS = [
  "seguranca_mulher",
  "crueldade_animal",
  "seguranca_publica",
  "parceiro",
  "final_feliz",
  "boa_acao_animal",
  "luto_pet",
  "humor_animal",
  "morte_famoso",
  "irrelevante",
] as const;

const TONS = [
  "indignado",
  "solidario",
  "celebracao",
  "descontraido",
  "informativo",
  "nenhum",
] as const;

const classificarTool: Anthropic.Messages.Tool = {
  name: "classificar",
  description: "Classifica o post do Instagram",
  input_schema: {
    type: "object" as const,
    properties: {
      categoria: { type: "string", enum: [...CATEGORIAS] },
      nota: { type: "integer", minimum: 0, maximum: 10 },
      motivo: { type: "string" },
      urgente: { type: "boolean" },
      tom: { type: "string", enum: [...TONS] },
    },
    required: ["categoria", "nota", "motivo", "urgente", "tom"],
  },
};

interface PostParaClassificar {
  perfil: string;
  seguidores: number;
  parceiro: boolean;
  legenda: string;
  tipo: string;
  curtidas: number;
  comentarios: number;
  horas: number;
  imagemBase64?: string;
  imagemMediaType?: string;
}

async function baixarImagem(
  url: string
): Promise<{ base64: string; mediaType: string } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    return { base64: buffer.toString("base64"), mediaType: contentType };
  } catch {
    return null;
  }
}

export async function classificar(
  post: PostParaClassificar
): Promise<{ classificacao: Classificacao; usage: Anthropic.Messages.Usage }> {
  const textoPost = [
    `Perfil: @${post.perfil} (${post.seguidores.toLocaleString("pt-BR")} seguidores${post.parceiro ? ", parceiro do mandato" : ""})`,
    `Legenda: ${post.legenda || "(sem legenda)"}`,
    `Tipo: ${post.tipo} | Curtidas: ${post.curtidas} | Comentários: ${post.comentarios} | Horas desde publicação: ${post.horas}`,
  ].join("\n");

  const userContent: Anthropic.Messages.ContentBlockParam[] = [
    { type: "text", text: textoPost },
  ];

  if (post.imagemBase64 && post.imagemMediaType) {
    userContent.unshift({
      type: "image",
      source: {
        type: "base64",
        media_type: post.imagemMediaType as
          | "image/jpeg"
          | "image/png"
          | "image/gif"
          | "image/webp",
        data: post.imagemBase64,
      },
    });
  }

  let tentativas = 0;
  const maxTentativas = 3;

  while (true) {
    tentativas++;
    try {
      const response = await client.messages.create({
        model: "claude-haiku-5-5",
        max_tokens: 300,
        system: [
          {
            type: "text",
            text: systemPrompt,
            cache_control: { type: "ephemeral" },
          },
        ],
        tools: [classificarTool],
        tool_choice: { type: "tool", name: "classificar" },
        messages: [{ role: "user", content: userContent }],
      });

      const toolBlock = response.content.find(
        (b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use"
      );

      if (!toolBlock) throw new Error("Claude não retornou tool_use");

      const input = toolBlock.input as Record<string, unknown>;
      return {
        classificacao: {
          categoria: input.categoria as string,
          nota: input.nota as number,
          motivo: input.motivo as string,
          urgente: input.urgente as boolean,
          tom: input.tom as string,
        },
        usage: response.usage,
      };
    } catch (err: any) {
      const status = err?.status ?? err?.statusCode;
      if (
        tentativas < maxTentativas &&
        (status === 429 || (status >= 500 && status < 600))
      ) {
        const wait = tentativas * 2000;
        console.log(
          `  ⏳ Retry ${tentativas}/${maxTentativas} em ${wait / 1000}s (HTTP ${status})`
        );
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw err;
    }
  }
}

export { baixarImagem };
