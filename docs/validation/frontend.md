# Validação do frontend

## Resultado da execução

Estado candidato validado localmente em 29/09/2026. Backend não acessado; nenhuma publicação ou execução de CI remoto.

| Gate | Resultado observado |
|---|---|
| TypeScript (`npm run typecheck`) | PASS |
| ESLint (`npm run lint`) | PASS |
| Vitest (`npm test -- --run`) | 36 testes PASS, em 14 arquivos |
| Build (`npm run build`) | PASS, com OpenCV local preparado no pré-build |
| Playwright (`npm run test:e2e`) | 14 testes PASS |
| Detector visual Impeccable | Executado uma vez, nenhum achado |

Chromium headless foi executado neste ambiente pelo binário da dependência @sparticuz/chromium, via `CHROMIUM_PATH`. O CI usa a instalação normal do Playwright. A indisponibilidade inicial do download de Chromium e da enumeração de interfaces do host foi resolvida sem alterar os fluxos do produto; o servidor de testes escuta em 127.0.0.1.

## Cobertura observada

- Login, foco por teclado e separação entre sessão atual e respostas antigas; 401/403.
- Separação de salas e provedores, sala removida sem escolha silenciosa de outro destino.
- Campos dinâmicos de credenciais e conexão OAuth ainda pendente sem falso sucesso.
- Busca, navegação e manutenção de pastas; download autenticado e nomes de arquivos.
- Câmera negada; captura com vídeo sintético e encerramento das tracks; enumeração de dispositivos que falha.
- Limites de páginas, bytes, formato e dimensões antes da decodificação.
- Worker OpenCV real: detecção e correção de perspectiva com quatro marcas coloridas preservadas.
- Revisão, rotação, reordenação e download PDF; PDF multipágina/JPEG em testes unitários.
- Resultado atrasado de detecção não ressuscita página removida.
- Jornada importar → enviar → localizar → baixar → mudar sala → sair.
- PDF existente mantém bytes idênticos após navegação e envio na demonstração.
- Timeout produz um único POST e preserva páginas, nome, pasta e aviso de incerteza, inclusive após download local.
- Interface capturada em 1440, 390 e 320 px; ausência de overflow horizontal a 320 px, cantos por teclado e foco devolvido após fechar diálogo.

Capturas em `screenshots/`. São evidências do modo de demonstração, com dados fictícios. Não equivalem a uma auditoria formal de acessibilidade, teste de zoom real, teste de navegador móvel ou homologação do backend.

## Revisões independentes

A revisão de código apontou quatro problemas materiais: callback de detecção com lote antigo; download apagando estado incerto; atualização de salas trocando destino sem guard; falha na enumeração mantendo câmera ligada e escondida. Todos foram reproduzidos, corrigidos e tiveram testes focados verdes. O revisor conferiu as correções e não identificou regressões materiais decorrentes delas. A condição final de recuperação de sala removida também passou em navegador.

A revisão visual pediu dois ajustes: controle de arquivo localizado em português e controles de cor/zoom com tokens da aplicação. Após recaptura, ambos foram classificados como resolvidos, com disposition `ship` no escopo desses ajustes. A revisão foi baseada em PRODUCT.md, DESIGN.md, tokens e capturas; não havia comp aprovado ou QUALITY BAR externo. A primeira tentativa de revisão de código falhou por limite de uso; a segunda foi concluída normalmente.

## Pendências externas

Veja `backend.md` e `devices.md`: API real, CORS, autorização do servidor, OAuth web, tipo de PDF importado, câmeras físicas, Safari/Firefox, memória e legibilidade em documentos reais. O GitHub recusou escrita (403); commits locais não representam push, PR ou CI remoto.
