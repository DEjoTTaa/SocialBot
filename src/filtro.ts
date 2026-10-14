import { readFileSync } from "fs";
import { resolve } from "path";

interface PalavrasChave {
  _como_usar: string[];
  [categoria: string]: string[];
}

const caminho = resolve(import.meta.dirname, "..", "palavras-chave.json");
const dados: PalavrasChave = JSON.parse(readFileSync(caminho, "utf-8"));

const termos: string[] = [];
for (const [chave, lista] of Object.entries(dados)) {
  if (chave === "_como_usar") continue;
  termos.push(...lista);
}

const CENSURA: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
};

function removerAcentos(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function desfazerCensura(texto: string): string {
  return texto.replace(/[013457@]/g, (ch) => CENSURA[ch] ?? ch);
}

export function normalizar(texto: string): string {
  return desfazerCensura(removerAcentos(texto.toLowerCase()));
}

const SEP = /[\s.,;!?:()\[\]{}"'\/\-]/;

function isSep(ch: string): boolean {
  return SEP.test(ch);
}

// Character-by-character match where '*' in the text acts as a single-char wildcard
function matchAt(text: string, pos: number, term: string): boolean {
  for (let i = 0; i < term.length; i++) {
    if (pos + i >= text.length) return false;
    const tc = text[pos + i];
    const kc = term[i];
    if (tc === "*") continue; // wildcard in caption text
    if (tc !== kc) return false;
  }
  return true;
}

const termosNorm = termos.map((t) => normalizar(t));

export function filtrar(legenda: string): boolean {
  const norm = normalizar(legenda);

  for (const termo of termosNorm) {
    if (termo.includes(" ")) {
      // Multi-word expression: match anywhere in text
      for (let i = 0; i <= norm.length - termo.length; i++) {
        if (matchAt(norm, i, termo)) return true;
      }
    } else {
      // Single-word: match at start of a word
      if (matchAt(norm, 0, termo)) return true;
      for (let i = 1; i < norm.length; i++) {
        if (isSep(norm[i - 1]) && !isSep(norm[i])) {
          if (matchAt(norm, i, termo)) return true;
        }
      }
    }
  }

  return false;
}
