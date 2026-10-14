# SocialBot

Coletor de posts do Instagram para o mandato do Deputado Federal Delegado Bruno Lima. Encontra, filtra e classifica posts relevantes usando a Instagram Graph API e Claude AI.

## Variáveis de ambiente (.env.local)

- `ANTHROPIC_API_KEY` — chave da API Anthropic
- `MONGODB_URI` — string de conexão MongoDB
- `META_TOKEN` — token de acesso da Meta (Instagram Graph API)
- `IG_USER_ID` — ID do usuário Instagram Business
- `MOCK` — `1` para modo de teste (não chama a Meta)

## Como rodar

```bash
npm install

# 1. Importar fontes para o banco
npm run fontes:add

# 2. Verificar quais fontes estão acessíveis
npm run fontes:verificar

# 3. Coletar e classificar posts
npm run coletar

# Testes
npm test
```

## Modo MOCK

Com `MOCK=1`, o coletor usa posts de exemplo fixos em vez de chamar a Instagram API. O Claude é chamado normalmente para classificar.
