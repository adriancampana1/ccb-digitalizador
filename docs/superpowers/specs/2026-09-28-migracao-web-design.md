# Migração do Digitalizador CCB para web

Data: 28/09/2026
Status: especificação escrita para revisão; decisões gerais aprovadas, implementação ainda não iniciada.
Destino: adriancampana1/ccb-digitalizador
Origem analisada: adriancampana1/digitalizador-app, commit 84a30260f7eab631888c739e36755119665510d7.

## 1. Objetivo e decisões aprovadas

Migrar o aplicativo React Native para uma aplicação web interna da CCB, preservando os fluxos conhecidos e a identidade institucional. A interface será modernizada com componentes discretos, menos sombras, espaçamento consistente e hierarquia clara.

Decisões aprovadas pelo usuário:
- React + TypeScript + Vite.
- Uso em celular e computador, com atenção prioritária à captura no celular.
- Azul institucional, logo CCB, fundo claro e tipografia atual.
- Navegação adaptada: ações acessíveis no celular e navegação lateral no computador.
- Preservação de autenticação, salas, provedores, pastas, documentos, busca e permissões.
- Scanner completo: câmera, múltiplas páginas, recorte, perspectiva, revisão e PDF.
- Avançar sem o código do backend, usando os contratos observados no app.

As decisões detalhadas abaixo compõem a proposta submetida nesta revisão.

## 2. Alternativas e arquitetura escolhida

| Abordagem | Benefício | Custo ou limitação |
| --- | --- | --- |
| React web + Vite, escolhida | Reaproveita TypeScript, contratos e lógica; permite interface própria para navegador | Scanner, armazenamento da sessão e integrações nativas precisam ser adaptados |
| React Native Web | Maior reaproveitamento de componentes | As dependências nativas do scanner e a experiência desktop ainda exigiriam substituições |
| Aplicação com renderização no servidor | Útil quando há conteúdo público e necessidades de servidor próprias | Introduz uma camada não necessária ao escopo interno atual |

Aplicação cliente com rotas protegidas. Backend existente continua responsável por autenticação, autorização, salas, persistência, provedores e busca.

Organização proposta:
- app: composição de providers, rotas e estrutura responsiva.
- features/auth: login, cadastro e sessão.
- features/rooms: salas, papel, conexão e seleção de contexto.
- features/documents: listagem, busca, envio, download e exclusão.
- features/folders: árvore, navegação e manutenção de pastas.
- features/scanner: câmera, páginas, editor, processamento e exportação.
- shared/api: transporte, contratos e normalização de erros.
- shared/ui e shared/theme: componentes semânticos e tokens.

React Query para estado remoto e cache; Zustand para sessão, sala ativa e estado de interface compartilhado. Estado local de formulário permanece nos componentes. React Router para navegação. Axios centraliza JSON, multipart e download binário. pdf-lib gera PDF. O processamento geométrico usa um adaptador para OpenCV.js carregado apenas ao abrir o scanner.

Versões compatíveis serão fixadas no lockfile durante a implementação. Não copiar dependências nativas ou todo o projeto original.

## 3. Escopo funcional

### Autenticação

Login por telefone e senha. Cadastro com código, nome, telefone e senha. Validação local acessível e erros devolvidos pela API.
Token em memória com restauração por sessionStorage na mesma sessão da aba; não persistir senha. Se o armazenamento do navegador estiver indisponível, usar apenas memória. sessionStorage não equivale ao SecureStore e continua acessível a JavaScript da origem.
401 limpa sessão, sala, caches e páginas em memória; 403 apresenta falta de permissão, sem tratar como logout.
Não implementar refresh token sem contrato conhecido.

### Salas e provedores

Listar, criar e entrar por código. Exibir papel, conexão, provedor, conta conectada e pasta base quando presentes.
Formulários de credenciais são derivados de GET /providers, respeitando campos obrigatórios, secretos e provedores disponíveis.
Credenciais são transitórias no formulário, não entram em URLs, logs ou armazenamento persistente.
MASTER vê as ações administrativas conhecidas; MEMBER não recebe essas ações na interface.
Não inferir autorização apenas do papel salvo no navegador.

Sala OAuth pendente/desconectada direciona à conexão; conexão por credenciais usa o contrato existente de atualização.
A seleção da sala não pode ocorrer silenciosamente durante captura ou envio. A primeira sala utilizável pode ser escolhida após login quando não há escolha válida; sem sala utilizável, abrir a lista de salas.

### Documentos e pastas

Preservar recentes, listagem paginada, busca com debounce, navegação por pasta, criação/renomeação/exclusão de pasta, miniaturas, abertura do original, download e exclusão de documento conforme papel.
O provedor é derivado da sala, inclusive no seletor de pastas e no envio; remover a suposição de SharePoint fixo.
Download usa o mesmo contexto autenticado e X-Room-Id das demais operações de documento.
Atualizar as consultas afetadas após mutações. Erro não pode aparecer como lista vazia.
A busca permanece delegada à API; não implementar OCR ou um índice paralelo no frontend.

## 4. Scanner web completo

Fluxo: capturar ou importar imagens → revisar páginas → corrigir → escolher nome, formato e pasta → confirmar destino → enviar.

- Iniciar câmera por ação explícita, solicitar câmera traseira como preferência e permitir escolha quando houver alternativas.
- Tratar ausência de câmera, permissão negada, câmera ocupada e contexto inseguro com mensagem e alternativa de selecionar arquivo.
- Capturar várias páginas; manter originais disponíveis em memória para reedição.
- Detectar contorno após a captura e sugerir quatro cantos. O usuário sempre pode ajustar manualmente; a detecção não deve cortar silenciosamente informação.
- Corrigir perspectiva a partir dos quatro cantos; impedir quadriláteros cruzados ou degenerados.
- Revisar imagem com zoom, girar, refazer captura, remover e reordenar páginas. Incluir botões de reordenação e ajuste de cantos utilizáveis por teclado.
- Oferecer imagem colorida e ajuste de contraste/tons de cinza com prévia reversível.
- PDF reúne as páginas revisadas na ordem escolhida; JPEG envia um arquivo por página, com nomes coerentes.
- Permitir envio de PDF existente como arquivo, sem prometer edição de suas páginas.
- Encerrar tracks da câmera ao sair, trocar dispositivo ou encerrar sessão.
- Processar páginas sequencialmente, reutilizar buffers e liberar objetos OpenCV e URLs temporárias.
- Executar detecção em resolução reduzida e aplicar coordenadas proporcionais ao original limitado para processamento. Limite inicial proposto: 20 páginas por lote, imagens de até 20 MB, maior lado processado de até 3000 px; PDF importado de até 25 MB. Esses limites são do cliente e não comprovam limites do servidor.
- Ao atingir limite, explicar e oferecer envio em lotes, sem descartar páginas anteriores.

OpenCV será servido como recurso versionado da aplicação, sem depender de CDN em tempo de execução. Trabalho pesado deve ocorrer em worker quando compatível com o build escolhido.
Falha ao carregar o processador deve ser explícita: permitir preservar/exportar originais, mas não anunciar que o scanner completo está funcionando.

A detecção automática precisa ser validada em documentos reais e cenários de luz/fundo variados. A existência das operações matemáticas não comprova qualidade equivalente ao scanner nativo. Ajuste manual é parte permanente do fluxo.
Não incluir captura automática contínua, OCR local, sincronização offline ou persistência de rascunhos sensíveis nesta versão.

## 5. Sala, concorrência e recuperação de falhas

Cada operação captura userId e roomId no início. O identificador explícito viaja até o transporte; não consultar uma sala global mutável depois do processamento de um PDF.
Cache remoto inclui usuário e sala. Cancelar consultas e remover dados anteriores ao trocar conta/sala; respostas tardias não podem atualizar o contexto novo.
Durante captura, mostrar a sala e pedir descarte antes de mudar. Durante envio, bloquear troca de sala e repetição do botão.
Em falha de envio, preservar lote e destino para recuperação. Não repetir POST automaticamente: timeout pode ocorrer depois de o servidor salvar. Orientar conferir a listagem antes de repetir quando o resultado for incerto.
Em falha de carregamento de salas, oferecer nova tentativa; não selecionar outro destino como efeito colateral.
Não persistir imagens em cache de service worker ou armazenamento do navegador.

## 6. Contratos existentes

| Operação | Método e caminho |
| --- | --- |
| Login / cadastro | POST /auth/login; POST /auth/register |
| Listar / criar sala | GET /rooms; POST /rooms |
| Entrar / consultar sala | POST /rooms/join; GET /rooms/{id} |
| Credenciais / catálogo | PUT /rooms/{id}/credentials; GET /providers |
| Iniciar OAuth | GET /rooms/{id}/storage/oauth/url |
| Listar / enviar documento | GET /document; POST /document |
| Buscar | GET /document/search?searchText=... |
| Download / exclusão | GET /document/{id}/download; DELETE /document/{id} |
| Atualizar miniatura | POST /document/{id}/thumbnail/refresh |
| Pastas | GET /folders; POST /folders; PATCH /folders/{id}; DELETE /folders/{id} |

Multipart: files, title opcional, storageProvider, documentType e folderPath opcional. Para captura, documentType=scanned. Importações preservam um contrato isolado e precisam de validação de valores aceitos antes de serem consideradas integradas.
Listagem paginada observada: content, page, size, totalElements, totalPages e last.
Não modificar endpoints ou pressupor métodos adicionais.

## 7. Dependências do ambiente de backend

Desenvolvimento e testes de contrato usam fixtures sintéticas em modo explícito de demonstração. Modo real jamais converte falha em resposta simulada.

Para integração real, confirmar:
- URL da API via configuração de ambiente pública, sem segredos no build.
- HTTPS e CORS para a origem web, incluindo Authorization, X-Room-Id, Content-Type e métodos usados.
- Exposição de Content-Disposition para preservar o nome dos downloads.
- Autorização de usuário/sala/documento no servidor e disponibilidade dos provedores.
- Tamanho de upload, processamento, limites e semântica de erros.
- OAuth com retorno HTTPS aceito e permitido pelo servidor/provedor.

OAuth nativo retorna por deep link. A web não deve inventar um redirect_uri ou contornar a validação do servidor.
Abrir a autorização por gesto do usuário, consultar novamente o estado da sala ao retornar e só anunciar conexão após CONNECTED.
Se a URL existente só admitir retorno nativo, mostrar a incompatibilidade e registrar o ajuste externo necessário; integração OAuth permanece pendente até que o retorno web seja configurado.
Não colocar tokens em query strings nem aceitar mensagens de janela sem validar origem e contexto.

## 8. Direção visual e experiência

Manter Lexend Deca e azul #003D5C como referências do original, com fundo claro e logo existente.
Componentes web semânticos, foco visível, ícones coerentes e uso moderado de cor. Evitar gradientes, grandes blocos decorativos, sombras pesadas e cartões redundantes.
A sala ativa aparece no cabeçalho de documentos/pastas e no scanner, inclusive na confirmação final.

Celular: navegação inferior compacta para documentos, pastas e conta; ação de digitalizar destacada e acessível. Scanner ocupa a tela, com revisão e ações claras.
Computador: navegação lateral compacta com seletor de sala; conteúdo aproveita a largura para listas de documentos com colunas e pastas com hierarquia.
O conteúdo e os nomes das ações permanecem consistentes entre tamanhos. Telas de formulário substituem sequências desnecessárias de modais.
Estados explícitos: carregando, vazio, sem resultado, erro recuperável, sem permissão, sala desconectada e envio em andamento.
Feedback de sucesso só após confirmação; o backend é a autoridade do estado remoto.

Meta de acessibilidade: contraste AA, navegação por teclado, zoom de 200%, rótulos de campos, foco recuperado após diálogos e alvos de toque de pelo menos 44 px.
Mockups/dados de demonstração usam documentos fictícios identificados; não incluir arquivos administrativos reais.

## 9. Hospedagem e operação

Build estático com HTTPS e fallback para rotas da SPA, independente de fornecedor.
Sem SSR, backend intermediário, PWA offline ou service worker nesta primeira versão.
Documentar variáveis, comando de build e requisitos do servidor. Publicação e configuração de domínio ficam fora desta etapa de especificação.
Não armazenar credenciais de provedor em variáveis VITE_*.

## 10. Validação e critérios de aceite

A entrega é dividida em frontend verificado com contratos simulados e integração real verificada. Uma condição não implica a outra.

- Login, cadastro, logout e expiração exercitados; dados de conta/sala anterior não reaparecem.
- Operações por sala enviam contexto explícito, incluindo download e upload.
- Troca de sala durante requisições e resposta tardia não misturam documentos.
- Provedor do envio coincide com o da sala; destino é visível antes de confirmar.
- Câmera, importação, correção, reordenação, JPEG e PDF preservam ordem e conteúdo revisados.
- Permissão negada, cancelamento, erro de processamento e erro de rede têm recuperação visível.
- Não há reenvio automático de upload incerto.
- Formulários e navegação funcionam por teclado e toque.
- Layouts revisados em celular e desktop, incluindo largura estreita e zoom.
- Typecheck, build e testes focados em contratos, isolamento de salas e processamento. Fluxos de navegador com API simulada; depois smoke test com API real.
- Validar câmera e memória em Android/Chrome e iPhone/Safari reais; validar navegação em Chrome/Edge desktop. Se aparelhos não estiverem disponíveis, registrar essa validação como pendente, sem alegar equivalência nativa.
- Ausência de backend impede declarar migração de ponta a ponta concluída.

## 11. Sequência de implementação proposta

1. Fundação web, tokens, componentes, rotas e transporte.
2. Autenticação, salas e estados de conexão.
3. Documentos, pastas e busca com isolamento por sala.
4. Scanner, editor, PDF/JPEG e envio com recuperação.
5. Revisão responsiva/acessível, CI e documentação de operação.
6. Integração real e validação em aparelhos quando os ambientes estiverem disponíveis.

Esta sequência é orientativa. O plano executável será escrito após a revisão desta especificação.

## 12. Base consultada e revisão

- Código original: https://github.com/adriancampana1/digitalizador-app/tree/84a30260f7eab631888c739e36755119665510d7
- Vite: https://vite.dev/guide/
- Câmera no navegador: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
- Perspectiva em OpenCV.js: https://docs.opencv.org/4.13.0/dd/d52/tutorial_js_geometric_transformations.html
- CORS: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS
- Sessão da aba: https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage

Autorrevisão: escopo e responsabilidades separados; contratos observados distintos de dependências externas; limitações do scanner e OAuth explícitas; nenhuma alteração ao backend incluída.

