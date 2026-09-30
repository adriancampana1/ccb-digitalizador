# Digitalizador CCB — Web

Aplicação interna para organizar e digitalizar documentos por sala. Migração do app React Native `adriancampana1/digitalizador-app`, preservando os contratos observados no commit `84a30260f7eab631888c739e36755119665510d7`.

## Executar

Requer Node 24 (veja `.nvmrc`) e npm.

```bash
npm ci
cp .env.example .env
npm run dev
```

Abra o endereço exibido pelo Vite. Neste ambiente de desenvolvimento restrito, use `npm run dev -- --host 127.0.0.1` caso a enumeração de interfaces de rede não esteja disponível.

### Demonstração

Defina `VITE_DEMO=true` no `.env` e reinicie o Vite. Qualquer telefone de 10 a 13 dígitos e senha não vazia acessa a conta fictícia Ana. Existem duas salas sintéticas, com papéis Master/Membro e provedores diferentes. A faixa de demonstração permanece visível. Arquivos ficam em memória, não são enviados a serviços externos, e mudanças desaparecem ao recarregar. Não insira dados reais.

A demonstração só é ativada por essa configuração explícita. Falhas na API real não ativam dados fictícios.

### API real

Defina `VITE_DEMO=false` e `VITE_API_URL` com a base HTTPS da API. As variáveis `VITE_*` são públicas: nunca coloque tokens ou segredos nelas. O fluxo de login obtém o token da API; a sessão é mantida na aba. A senha não é persistida pelo app.

A configuração opcional `VITE_IMPORTED_DOCUMENT_TYPE` deve ficar vazia até confirmar o valor de `documentType` aceito pelo backend para PDFs existentes. Capturas usam `scanned`. A interface bloqueia importação real de PDF sem esse contrato.

## Recursos

- Login/cadastro, sessão por aba, perfil e logout.
- Salas, entrada por código, criação conforme permissão e provedores dinâmicos.
- Conexão por credenciais ou início de OAuth; sucesso confirmado pelo status da sala.
- Documentos paginados, busca, download autenticado, miniaturas e exclusão.
- Pastas com navegação, criação, renomeação, exclusão e escolha do destino.
- Câmera, importação de JPG/PNG, múltiplas páginas e revisão manual dos quatro cantos.
- OpenCV em worker local: detecção de bordas, correção de perspectiva, rotação, escala de cinza e contraste.
- PDF multipágina ou JPEG por página, download local e envio ao provedor da sala.
- Preservação do lote e destino em falhas; nenhum reenvio automático. Em timeout, conferir documentos antes de enviar novamente.

Até 20 páginas, 20 MB por imagem, 60 megapixels antes da decodificação, maior lado normalizado em 3000 px e PDF importado até 25 MB. MB = 1.000.000 bytes. HEIC não é aceito. Imagens normalizadas, edições e PDFs importados ficam somente na memória; fechar a aba, sair da conta ou confirmar a troca de sala descarta o lote. Não há OCR local nem modo offline. A busca por conteúdo depende do backend.

Se o navegador não suportar o worker/OffscreenCanvas ou o motor falhar, o lote permanece disponível e o usuário pode escolher explicitamente as imagens originais normalizadas, sem correções. Não há processamento pesado de fallback na thread da interface.

## Validação

```bash
npm run typecheck
npm run lint
npm test -- --run
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright usa uma API simulada explicitamente configurada. O teste de processamento carrega o OpenCV real, com papel e marcas sintéticas. Os testes não comprovam integração com o backend, câmera física, qualidade de documentos reais ou compatibilidade com Safari. Veja `docs/validation/`.

O workflow `.github/workflows/ci.yml` executa os mesmos gates no GitHub. As permissões de escrita da integração foram atualizadas em 30/09/2026. Consulte o GitHub Actions para o resultado das verificações remotas.

## Build e hospedagem

`npm run build` gera `dist/`. O pré-dev e o pré-build copiam a distribuição OpenCV fixada no lockfile e gera seu aviso com hash SHA-256. O arquivo gerado `public/vendor/opencv/opencv.js` não é versionado. O motor é carregado somente quando usado; JS e WebAssembly são servidos pela própria aplicação, sem CDN. As fontes também são locais.

Sirva `dist/` em HTTPS, com fallback das rotas da SPA para `index.html`. O build atual assume a raiz do domínio. Disponibilize `/scanner-worker.js`, `/vendor/opencv/opencv.js`, `/assets/` e `/licenses/`. Não redirecione esses arquivos para HTML. A câmera só funciona em contexto seguro (HTTPS ou localhost).

CORS, cabeçalhos de download e callback OAuth exigem configuração do backend: detalhes em `docs/validation/backend.md`. Não há publicação automática.

## Organização

`src/features/` separa autenticação, salas, documentos, pastas e scanner. `shared/api` centraliza transporte e contexto imutável. Consultas são particionadas por identidade de sessão e sala, sem token nas chaves. `public/scanner-worker.js` processa uma fila sequencial e libera matrizes ao terminar cada operação. O frontend não substitui a autorização do servidor.

Identidade visual em `DESIGN.md`, tokens em `src/shared/theme/`. A logo CCB foi preservada do app original. Fontes Lexend Deca sob OFL e OpenCV sob Apache-2.0: avisos em `public/licenses/` e `public/vendor/opencv/NOTICE.txt`.
