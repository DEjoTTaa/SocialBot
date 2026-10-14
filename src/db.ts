import { MongoClient, type Db, type Collection } from "mongodb";
import { MONGODB_URI } from "./config.js";

let client: MongoClient;
let db: Db;

export interface Fonte {
  username: string;
  parceiro: boolean;
  ativo: boolean;
  falhas_seguidas: number;
  motivo_desativacao?: string;
  seguidores?: number;
  ultima_coleta?: Date;
}

export interface Classificacao {
  categoria: string;
  nota: number;
  motivo: string;
  urgente: boolean;
  tom: string;
}

export interface Post {
  _id: string;
  permalink: string;
  fonte: string;
  parceiro: boolean;
  tipo: string;
  legenda: string;
  media_url: string;
  thumbnail_url: string;
  data_post: Date;
  curtidas: number;
  comentarios: number;
  seguidores_fonte: number;
  status: "filtrado" | "pendente" | "erro";
  classificacao?: Classificacao;
  coletado_em: Date;
  enviado_telegram: boolean;
}

export async function conectar(): Promise<Db> {
  if (db) return db;
  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db("socialbot");

  const fontes = db.collection<Fonte>("fontes");
  await fontes.createIndex({ username: 1 }, { unique: true });

  const posts = db.collection<Post>("posts");
  await posts.createIndex({ status: 1, "classificacao.nota": -1 });
  await posts.createIndex({ data_post: -1 });

  return db;
}

export function colFontes(): Collection<Fonte> {
  return db.collection<Fonte>("fontes");
}

export function colPosts(): Collection<Post> {
  return db.collection<Post>("posts");
}

export async function desconectar(): Promise<void> {
  if (client) await client.close();
}
