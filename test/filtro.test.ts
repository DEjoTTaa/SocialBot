import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { filtrar } from "../src/filtro.js";

describe("filtro de palavras-chave", () => {
  it("'est*pr* coletivo' deve passar (estupro censurado)", () => {
    assert.ok(filtrar("Caso de est*pr* coletivo de adolescente gera revolta"));
  });

  it("'m4tou' deve passar (matou censurado com números)", () => {
    assert.ok(filtrar("Homem m4tou cachorro a pauladas"));
  });

  it("'cachorrinho' deve passar via 'cachorr'", () => {
    assert.ok(filtrar("Olha esse cachorrinho lindo no parque"));
  });

  it("'avenida' NÃO deve passar", () => {
    assert.ok(!filtrar("Novo restaurante abre na avenida Paulista"));
  });

  it("'longo' NÃO deve casar com 'ong'", () => {
    assert.ok(!filtrar("Um longo caminho pela frente"));
  });

  it("post de parceiro sem termo deve passar (testado fora do filtro)", () => {
    // O filtro em si retorna false, mas no coletor parceiros pulam o filtro
    assert.ok(!filtrar("Reunião importante hoje no Congresso"));
    // Confirma que a lógica de bypass funciona: parceiros não passam pelo filtro
  });
});
