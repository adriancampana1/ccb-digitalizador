# Digitalizador CCB Web Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a versão web do Digitalizador CCB com os fluxos existentes, interface moderna e scanner completo, distinguindo testes simulados de integração real.

**Architecture:** SPA React organizada por funcionalidades, transporte centralizado e contexto explícito de sessão/sala. Processamento de imagens local, carregado sob demanda, com páginas mantidas em memória. API existente permanece responsável pelos dados e autorizações.

**Tech Stack:** React, TypeScript, Vite, React Router, TanStack Query, Zustand, Axios, pdf-lib, OpenCV.js; Vitest, Testing Library, Playwright e MSW para validação.

**Spec:** `docs/superpowers/specs/2026-09-28-migracao-web-design.md`, aprovada em 28/09/2026.

## Global Constraints

- Destino: `adriancampana1/ccb-digitalizador`; origem: `adriancampana1/digitalizador-app@84a30260f7eab631888c739e36755119665510d7`.
- Azul `#003D5C`, Lexend Deca, logo CCB, fundo claro; componentes discretos, sem gradientes e sombras pesadas.
- Alvos de toque de pelo menos 44 px, contraste AA, teclado, foco visível e zoom de 200%.
- Limites iniciais: 20 páginas; 20 MB por imagem; 3000 px no maior lado processado; 25 MB por PDF importado. Definir MB como 1.000.000 bytes.
- Originais de páginas em memória; sem service worker, rascunhos persistidos, OCR local ou sincronização offline.
- Não repetir POST automaticamente; falha incerta preserva lote e orienta consultar documentos antes de repetir.
- Provedor e destino vêm da sala capturada no início da operação; nunca fixar SharePoint.
- Headers de operações por sala: Authorization e X-Room-Id, incluindo download.
- OAuth depende de retorno HTTPS configurado pelo servidor; não inventar endpoints nem redirect_uri.
- Modo demo explicitamente indicado; falha de API real nunca ativa dados fictícios.
- Build estático, HTTPS e fallback de rotas; nenhuma publicação automática prevista.
- Credenciais e tokens nunca aparecem em logs, URLs, fixtures reais ou variáveis públicas VITE_*.
- Permissão GitHub de escrita bloqueada por 403. Não repetir tentativas até alteração da conexão; preservar trabalho e registrar commits locais quando houver checkout autorizado.
- Implementação visual usa Impeccable. A aprovação da arquitetura não substitui a decisão visual de tela; no início da execução, apresentar a composição mobile/desktop pelo fluxo da skill, herdando a identidade aprovada.
- Executar verificações focadas por tarefa e gates de CI; evitar rodadas redundantes. Não afirmar câmera real ou backend validado a partir de mocks.

## Refinamentos dos contratos

`AuthResponse` observado contém accessToken, name, phone, canCreateRooms, createdAt e updatedAt, mas não declara userId.
Usar `sessionId` opaco, criado no login/restauração validada, para particionar cache e rejeitar respostas antigas. Não decodificar JWT para inventar um identificador.
Uma nova autenticação sempre gera nova identidade local, mesmo para o mesmo telefone. O valor só identifica a sessão do cliente.
Respeitar `canCreateRooms` na interface de criação. MASTER/MEMBER continua sendo papel por sala.

Raiz de pasta: `ROOT_FOLDER_PATH = ''`. Não enviar `root`, substituir vazio por barra ou concatenar a pasta base manualmente. Preservar caminhos retornados pela API.

## Review Focus

1. Troca rápida de conta/sala durante uma consulta ou montagem de PDF: resposta antiga não aparece no novo contexto (tarefas 2, 3 e 9).
2. Permissão de câmera negada, câmera perdida e imagem incompatível: erro recuperável, tracks encerradas e lote preservado (tarefa 6).
3. Papel de baixo contraste ou quadrilátero inválido: revisão manual disponível; conteúdo não é cortado silenciosamente (tarefas 7 e 8).
4. Timeout após o servidor receber upload: nenhum reenvio automático, destino e páginas preservados (tarefa 9).
5. Backend OAuth com retorno apenas nativo e cabeçalhos CORS ausentes: diagnóstico honesto, sem falso sucesso (tarefas 4, 5 e 10).

## Estrutura e responsabilidades

Arquivos abaixo são novos, salvo indicação de modificação. Extensões .test ficam ao lado do módulo; testes de navegador em e2e/.
- `src/app/`: bootstrap, rotas, QueryClient, estrutura responsiva e transições de contexto.
- `src/shared/api/`: contratos, cliente, erros e contexto imutável.
- `src/shared/ui/`: Button, Field, Dialog, Status, EmptyState, Pagination e Toast.
- `src/shared/theme/`: tokens.css e globals.css.
- `src/features/auth/`: contrato, API, sessão e páginas públicas.
- `src/features/rooms/`: catálogo, salas, permissões, formulários e conexão.
- `src/features/documents/`: API, consultas, listagem, busca e download.
- `src/features/folders/`: API, consultas, navegação e seleção.
- `src/features/scanner/`: tipos, limites, câmera, lote, processamento, edição, exportação e envio.
- `src/test/`: setup e fixtures sintéticas; `src/demo/`: ativação explícita dos mocks.
- `docs/validation/`: resultados, pendências externas e matriz de aparelhos.

## Tipos compartilhados

Definir em `src/shared/api/context.ts`:
`Session = { sessionId: string; accessToken: string; name: string; phone: string; canCreateRooms: boolean }`.
`RequestContext = Readonly<{ sessionId: string; accessToken: string; roomId?: string }>`.
`RoomContext = RequestContext & Readonly<{ roomId: string; storageProvider: string }>`.
Token não integra queryKey; usar `['session', sessionId, 'room', roomId, ...suffix]`.

Em `src/shared/api/contracts.ts`, portar somente os contratos observados de Room, ProviderMetadata, CreateRoomPayload, DocumentResponse, FolderOption e PagedResponse<T>. Provedor é string extensível. AuthResponse fica em auth/types.ts.
`ApiError = { kind: 'http' | 'network' | 'timeout' | 'cancelled'; status?: number; message: string }`.

Em scanner/types.ts:
`Point = { x: number; y: number }`; `Quad = [Point, Point, Point, Point]`, sentido horário, iniciando no canto superior esquerdo.
`PageEdit = { corners: Quad; rotation: 0 | 90 | 180 | 270; mode: 'color' | 'grayscale'; contrast: number }`.
`ScanPage = { id: string; source: Blob; width: number; height: number; edit: PageEdit }`.
`ScanBatch = { context: RoomContext; pages: ScanPage[]; phase: 'editing' | 'processing' | 'uploading' | 'uncertain' }`.
`OutputFormat = 'pdf' | 'jpeg'`.
Nenhum módulo de processamento importa stores, React ou API.

---

### Task 1: Fundação executável e estrutura visual

**Files:** package.json, package-lock.json, index.html, vite.config.ts, tsconfig.json, tsconfig.app.json, tsconfig.node.json, eslint.config.js, .gitignore, .env.example; src/main.tsx; src/app/{App,AppShell,Router}.tsx; src/app/queryClient.ts; src/shared/theme/{tokens,globals}.css; src/shared/ui/{Button,Field,Dialog,Status,EmptyState,Pagination,Toast}.tsx; public/assets/logo-ccb.png; public/fonts/; src/test/setup.ts; e2e/shell.spec.ts; playwright.config.ts; .github/workflows/ci.yml; DESIGN.md e .impeccable/design.json.

**Interfaces:** `AppShell({children}: {children: ReactNode})`; `createQueryClient(): QueryClient`. Scripts: dev, build, typecheck, lint, test, test:e2e. Rotas: /login, /register, /documents, /folders, /scan, /rooms, /rooms/new, /rooms/join, /rooms/:roomId, /profile.
- [ ] Ler as skills de execução e isolamento; verificar estado do repositório antes de criar checkout/branch. Não tratar a pasta local de documentos como checkout Git.
- [ ] Fixar versões compatíveis e Node LTS suportado pelo Vite escolhido; criar lockfile e configuração mínima, incluindo Vitest/Playwright. Registrar versão em .nvmrc e engines.
- [ ] Aplicar a composição visual acordada pelo fluxo Impeccable, usando a logo original e fontes locais com licenças; não substituir por marca inventada.
- [ ] Implementar estrutura responsiva e componentes semânticos; formulários usam labels, diálogos restauram foco e navegação tem estado atual.
- [ ] Criar teste de comportamento em e2e/shell.spec.ts: `await expect(page.getByRole('navigation', {name: 'Principal'})).toBeVisible()`; navegar por Tab e verificar foco visível, sem testar valores de CSS um a um.
- [ ] Verificar `npm run typecheck && npm run build` e `npx playwright test e2e/shell.spec.ts`: saída 0. CI executa typecheck, lint, testes e build desde a primeira tarefa.
- [ ] Commit: `feat: inicia estrutura web e identidade do Digitalizador CCB`.

### Task 2: Transporte, sessão e autenticação

**Files:** src/shared/api/{context,contracts,client,error}.ts; src/features/auth/{types,authApi,sessionStore,sessionStorage}.ts; src/features/auth/{LoginPage,RegisterPage,RequireSession}.tsx; src/app/sessionLifecycle.ts; src/demo/{start,handlers}.ts; src/test/fixtures.ts; src/features/auth/sessionStore.test.ts; src/shared/api/client.test.ts.

**Interfaces:** `request<T>(context: RequestContext | null, config: AxiosRequestConfig): Promise<T>`; `login(input: {phone:string;password:string}): Promise<AuthResponse>`; `register(input: {phone:string;password:string;name:string;accessCode:string}): Promise<AuthResponse>`; `installSession(response:AuthResponse):Session`; `clearSession():void`; `registerSessionCleanup(cleanup:()=>void):()=>void`.
- [ ] Testes: armazenamento que lança SecurityError mantém sessão em memória; nova autenticação gera sessionId diferente; 403 preserva sessão; 401 da sessão corrente limpa tudo; 401 tardio de sessão anterior não desloga a nova.
  Assertivas: `expect(after.sessionId).not.toBe(before.sessionId)`; `expect(currentSession).toEqual(newSession)` após 401 antigo; `expect(cleanup).toHaveBeenCalledOnce()` para 401 corrente.
- [ ] Rodar `npx vitest run src/features/auth/sessionStore.test.ts src/shared/api/client.test.ts`; confirmar falhas dos comportamentos ainda ausentes.
- [ ] Implementar transporte com AbortSignal, timeout, erros tipados e contexto explícito; deixar navegador definir boundary multipart. Nenhum retry para mutações.
- [ ] Implementar restauração validada de sessão, cadastro/login, logout e limpeza de QueryClient. Callbacks de recursos futuros usam registerSessionCleanup.
- [ ] Modo demo exige flag explícita e identificação permanente na tela; fixtures de duas contas/salas distintas e provedor não SharePoint. Configuração real ausente gera erro de configuração, não demo.
- [ ] Reexecutar os testes focados; resultado esperado PASS. Commit: `feat: adiciona autenticação e transporte com isolamento de sessão`.

### Task 3: Salas, contexto e permissões

**Files:** src/features/rooms/{roomApi,roomStore,roomQueries,permissions}.ts; src/features/rooms/{RoomListPage,RoomDetailPage,JoinRoomPage,RoomSwitcher}.tsx; src/app/contextLifecycle.ts; src/features/rooms/roomStore.test.ts; e2e/room-context.spec.ts.

**Interfaces:** `listRooms(ctx:RequestContext, signal?:AbortSignal):Promise<Room[]>`; `getRoom(ctx:RequestContext,id:string):Promise<Room>`; `joinRoom(ctx:RequestContext,accessCode:string):Promise<Room>`; `captureRoomContext():RoomContext`; `switchRoom(room:Room):Promise<void>`; `registerRoomTransitionGuard(guard:()=>Promise<boolean>):()=>void`.
- [ ] Testar resposta atrasada da sala A após troca para B; dados de A não entram em B. Testar falha de listagem sem fallback silencioso e sala OAuth pendente sem entrada operacional.
  Assertivas: `expect(activeRoomId).toBe('B')`; `expect(screen.queryByText('Documento da sala A')).not.toBeInTheDocument()`; `expect(roomQueries).not.toHaveBeenCalled()` sem contexto válido.
- [ ] Rodar `npx vitest run src/features/rooms/roomStore.test.ts`; confirmar falhas.
- [ ] Implementar seleção persistida por sessão, validação da sala restaurada, cancelamento e remoção de cache. O contextLifecycle consulta os guards antes de trocar.
- [ ] Mostrar sala, papel e status legível; criação usa canCreateRooms, administração usa role. Ocultar credenciais/código para MEMBER conforme contrato.
- [ ] Rodar testes focados e `npx playwright test e2e/room-context.spec.ts`; PASS. Commit: `feat: implementa salas e contexto explícito das operações`.

### Task 4: Criação de salas e conexão de provedores

**Files:** src/features/rooms/{providerApi,providerQueries,oauth}.ts; src/features/rooms/{CreateRoomPage,ProviderFields,CredentialsForm}.tsx; src/features/rooms/oauth.test.ts; e2e/providers.spec.ts.

**Interfaces:** `listProviders(ctx:RequestContext):Promise<ProviderMetadata[]>`; `createRoom(ctx:RequestContext,payload:CreateRoomPayload):Promise<Room>`; `updateCredentials(ctx:RequestContext,roomId:string,credentials:Record<string,string>):Promise<void>`; `getOAuthUrl(ctx:RequestContext,roomId:string):Promise<{authorizationUrl:string}>`; `connectProvider(ctx:RequestContext,roomId:string):Promise<'connected'|'pending'|'unsupported'|'cancelled'>`.
- [ ] Testar campos dinâmicos obrigatórios/secretos, provedor indisponível não selecionável e ausência de privilégio de criação. OAuth não anuncia sucesso quando callback parece bom mas GET /rooms/{id} ainda retorna PENDING.
  Assertivas: `expect(result).toBe('pending')`; `expect(successToast).not.toHaveBeenCalled()`; `expect(payload.credentials).toBeUndefined()` para OAUTH.
- [ ] Rodar `npx vitest run src/features/rooms/oauth.test.ts`; confirmar falha.
- [ ] Implementar formulários derivados do catálogo e reconexão por credenciais para MASTER; limpar segredos ao sair.
- [ ] Abrir janela síncrona ao clique para evitar bloqueio de popup e depois atribuir URL validada HTTPS; consulta após retorno/foco determina sucesso. Não depender de postMessage. Retorno nativo incompatível produz estado unsupported quando detectável e orientação; nunca inventar parâmetro de retorno.
- [ ] Rodar teste focado e `npx playwright test e2e/providers.spec.ts`; PASS. Commit: `feat: adiciona configuração de salas e conexão de provedores`.

### Task 5: Documentos, pastas, busca e download

**Files:** src/features/documents/{documentApi,documentQueries,download}.ts; src/features/documents/{DocumentsPage,DocumentList,DocumentActions,SearchField}.tsx; src/features/folders/{folderApi,folderQueries,paths}.ts; src/features/folders/{FoldersPage,FolderPicker,FolderActions}.tsx; src/features/auth/ProfilePage.tsx; src/features/documents/documentApi.test.ts; src/features/folders/paths.test.ts; e2e/documents.spec.ts.

**Interfaces:** `listDocuments(ctx:RoomContext,params:{page:number;size:number;folderPath?:string},signal?:AbortSignal):Promise<PagedResponse<DocumentResponse>>`; `searchDocuments(ctx:RoomContext,searchText:string,signal?:AbortSignal):Promise<DocumentResponse[]>`; `downloadDocument(ctx:RoomContext,id:string,fallbackName:string):Promise<void>`; `deleteDocument(ctx:RoomContext,id:string):Promise<void>`; `refreshThumbnail(ctx:RoomContext,id:string):Promise<DocumentResponse>`; `listFolders(ctx:RoomContext,folderPath:string):Promise<FolderOption[]>`; `createFolder(ctx:RoomContext,parentPath:string,folderName:string):Promise<void>`; `renameFolder(ctx:RoomContext,itemId:string,newName:string):Promise<void>`; `deleteFolder(ctx:RoomContext,itemId:string):Promise<void>`.
- [ ] Testar headers do download; raiz vazia; caminhos acentuados preservados; nome UTF-8 de Content-Disposition, fallback quando header ausente; revogação de blob URL após uso; 500 exibido como erro.
  Assertivas: `expect(headers['X-Room-Id']).toBe('B')`; `expect(params.folderPath).toBe('')`; `expect(filename).toBe('Ata da reunião.pdf')`.
- [ ] Rodar `npx vitest run src/features/documents/documentApi.test.ts src/features/folders/paths.test.ts`; confirmar falhas.
- [ ] Implementar APIs, recentes de 10 itens, listagem paginada, busca debounce de 300 ms, breadcrumb, seletor de pasta e ações de manutenção. Confirmar exclusões e invalidar somente consultas relacionadas.
- [ ] Downloads usam Blob do transporte central; abrir original só em http/https, nova aba com proteção de opener. URLs de miniaturas indisponíveis mostram fallback com ação de atualizar.
- [ ] Implementar perfil com dados conhecidos e logout; estados sem sala e desconectada impedem operações de storage.
- [ ] Rodar testes focados e `npx playwright test e2e/documents.spec.ts`; PASS. Commit: `feat: migra documentos pastas busca e downloads`.

### Task 6: Captura, importação e lote de páginas

**Files:** src/features/scanner/{types,limits,camera,importImage,batchStore}.ts; src/features/scanner/{ScannerPage,CameraView,PageStrip}.tsx; src/features/scanner/camera.test.ts; src/features/scanner/batchStore.test.ts; e2e/capture.spec.ts.

**Interfaces:** `startCamera(deviceId?:string):Promise<MediaStream>`; `stopCamera(stream:MediaStream):void`; `captureFrame(video:HTMLVideoElement):Promise<Blob>`; `importImage(file:Blob):Promise<ScanPage>`; `createBatch(ctx:RoomContext):ScanBatch`; `addPage(batch:ScanBatch,page:ScanPage):ScanBatch`; `disposeBatch():void`.
- [ ] Testar 20 páginas aceitas, 21ª rejeitada sem alterar lote; 20.000.001 bytes rejeitados antes da decodificação; tipo/arquivo inválido não entra no lote; permissão negada exibe importação; todas as tracks param no cleanup.
  Assertivas: `expect(batch.pages).toHaveLength(20)`; `expect(stop).toHaveBeenCalledOnce()`; `expect(decode).not.toHaveBeenCalled()` acima do limite.
- [ ] Rodar `npx vitest run src/features/scanner/camera.test.ts src/features/scanner/batchStore.test.ts`; confirmar falhas.
- [ ] Implementar início por gesto, preferência traseira, seleção de dispositivo e estados de erro. Captura ocorre só com dimensões válidas; tratar interrupção de stream.
- [ ] Implementar importação sequencial com orientação normalizada e limites de decodificação; arquivos incompatíveis têm orientação clara, sem travar lote. PDF segue fluxo separado de envio, não vira ScanPage.
- [ ] Registrar cleanup de sessão e guard de sala; confirmar descarte na saída com páginas. Sem persistir imagens.
- [ ] Rodar testes e `npx playwright test e2e/capture.spec.ts` com câmera simulada; registrar que isso não valida hardware. Commit: `feat: adiciona câmera e lote de digitalização web`.

### Task 7: Motor de detecção e correção de imagem

**Files:** src/features/scanner/processing/{engine,opencvLoader,opencvAdapter,geometry,filters}.ts; src/features/scanner/processing/scanner.worker.ts; public/vendor/opencv/; scripts/prepare-opencv.mjs; src/features/scanner/processing/geometry.test.ts; e2e/image-processing.spec.ts; src/test/images/.

**Interfaces:** `detectCorners(source:Blob):Promise<Quad|null>`; `validateQuad(quad:Quad,width:number,height:number):boolean`; `renderPage(page:ScanPage):Promise<Blob>`; `disposeEngine():void`. Quad usa coordenadas do original normalizado; output máximo 3000 px no maior lado.
- [ ] Testar quadrilátero cruzado/degenerado rejeitado, reescala correta das coordenadas e dimensões máximas; fixture sintética com marcas nos quatro cantos preservadas após warp.
  Assertivas: `expect(validateQuad(crossed,100,100)).toBe(false)`; `expect(Math.max(width,height)).toBeLessThanOrEqual(3000)`; conferir cores/marcas nos cantos esperados com tolerância.
- [ ] Rodar teste geométrico e teste de navegador com processador real; falhas devem demonstrar ausência do comportamento, não uma expectativa simulada do próprio algoritmo.
- [ ] Fixar distribuição OpenCV.js compatível, origem, licença e hash; copiar JS/WASM necessários para assets locais via script reproduzível. Runtime não acessa CDN.
- [ ] Implementar worker com IDs de requisição, fila sequencial, timeout e descarte explícito de buffers/matrizes. Se worker incompatível, registrar fallback limitado e manter UI responsiva, sem fila paralela.
- [ ] Detectar contorno quadrilateral em cópia reduzida; baixa confiança retorna null. Aplicar homografia ao original limitado e filtros reversíveis; preservar original.
- [ ] Rodar `npx vitest run src/features/scanner/processing/geometry.test.ts` e `npx playwright test e2e/image-processing.spec.ts`; PASS. Commit: `feat: implementa detecção e correção de perspectiva local`.

### Task 8: Editor acessível e exportação

**Files:** src/features/scanner/{PageEditor,CornerEditor,ReviewPages}.tsx; src/features/scanner/{edits,export,fileNames}.ts; src/features/scanner/export.test.ts; e2e/editor.spec.ts.

**Interfaces:** `buildFiles(pages:ScanPage[],name:string,format:OutputFormat,onProgress?:(completed:number,total:number)=>void):Promise<File[]>`; `sanitizeFileName(name:string):string`. Recebe renderPage da tarefa 7. Contraste neutro 1, intervalo 0,5–2; controles mostram valores e permitem reset.
- [ ] Testar PDF com quantidade e ordem corretas via pdf-lib; JPEG numerado; nomes com espaços/acentos e caracteres proibidos; editar/girar/resetar sem alterar source.
  Assertivas: `expect(pdf.getPageCount()).toBe(2)`; `expect(files.map(f=>f.name)).toEqual(['Ata-1.jpg','Ata-2.jpg'])`; `expect(page.source).toBe(original)`.
- [ ] Rodar `npx vitest run src/features/scanner/export.test.ts`; confirmar falhas.
- [ ] Implementar ajuste dos quatro cantos com toque e teclado, zoom, rotação, filtros, reset e comparação. Reordenar por botões além de arraste; remover/refazer página explicitamente.
- [ ] Processar páginas sequencialmente e criar PDF/JPEG; mostrar progresso. Se motor falhar, manter originais e oferecer exportação identificada como original, sem alegar correção.
- [ ] Rodar teste de exportação e `npx playwright test e2e/editor.spec.ts`; PASS. Commit: `feat: adiciona revisão de páginas e exportação PDF JPEG`.

### Task 9: Envio seguro e recuperação

**Files:** src/features/scanner/{upload,uploadMachine}.ts; src/features/scanner/{SaveDocumentPage,ImportPdfPage}.tsx; src/features/scanner/upload.test.ts; e2e/upload.spec.ts; modificar src/features/documents/documentApi.ts.

**Interfaces:** `uploadDocuments(ctx:RoomContext,input:{files:File[];title?:string;documentType:string;folderPath?:string},signal?:AbortSignal):Promise<DocumentResponse[]>`; `submitBatch(batch:ScanBatch,input:{name:string;format:OutputFormat;folderPath:string}):Promise<'success'|'failed'|'uncertain'>`.
- [ ] Testar sala capturada preservada após processamento assíncrono; provedor não SharePoint; timeout faz exatamente um POST; erro mantém páginas; clique duplo não duplica; 401 limpa lote.
  Assertivas: `expect(post).toHaveBeenCalledTimes(1)`; `expect(payload.get('storageProvider')).toBe('google_drive')`; `expect(result).toBe('uncertain')`; `expect(batch.pages).toHaveLength(2)`.
- [ ] Rodar `npx vitest run src/features/scanner/upload.test.ts`; confirmar falhas.
- [ ] Implementar nome, formato, pasta e resumo de sala/destino antes de enviar. Derivar provider do contexto; revalidar sessão/sala antes de iniciar POST e ignorar resultado após invalidação de sessão.
- [ ] Implementar máquina de estados: editing → processing → uploading → success/failed/uncertain; bloqueio de troca durante envio e botão único. Falha incerta orienta conferir documentos e requer nova ação consciente.
- [ ] PDF existente valida até 25.000.000 bytes e assinatura/tipo antes do envio; conservar bytes. documentType de captura é scanned. Para PDF importado, usar parâmetro de contrato explícito sem valor inventado: modo real fica desabilitado até valor aceito confirmado; demo tem fixture identificada.
- [ ] Em sucesso, limpar lote e invalidar cache da sala original. Falha de refetch posterior não converte upload bem-sucedido em erro de envio.
- [ ] Rodar teste focado e `npx playwright test e2e/upload.spec.ts`; PASS. Commit: `feat: integra envio por sala e recuperação de falhas`.

### Task 10: Integração, revisão visual e entrega

**Files:** e2e/{journey,accessibility}.spec.ts; README.md; docs/validation/{frontend,backend,devices}.md; modificar .github/workflows/ci.yml e DESIGN.md/.impeccable/design.json conforme execução.
**Interfaces:** comandos reprodutíveis `npm ci`, `npm run dev`, `npm run typecheck`, `npm run lint`, `npm test -- --run`, `npm run test:e2e`, `npm run build`.
- [ ] Criar jornada com duas salas: login → selecionar sala → capturar/importar imagem → revisar → enviar → localizar → baixar → sair. Assertivas incluem ausência de documento de outra sala e nome do arquivo correto.
- [ ] Validar teclado, zoom e contraste; capturar mobile 390 px, estreito 320 px e desktop 1440 px. Fazer uma rodada visual conjunta, corrigir em lote e confirmar uma vez conforme Impeccable.
- [ ] Executar detector Impeccable uma vez nos arquivos alterados e revisão independente final conforme o método escolhido. Registrar evidência e corrigir achados materiais.
- [ ] Rodar gates completos de CI uma vez no estado candidato à entrega; logs determinam resultado. Se push continuar bloqueado, registrar CI não executado e manter os comandos/validações disponíveis sem afirmar aprovação remota.
- [ ] Documentar URL da API, HTTPS, SPA fallback, CORS e Content-Disposition, canCreateRooms, documentType de importação e retorno OAuth. Mostrar erros de configuração de modo real; não contorná-los com demo.
- [ ] Com ambiente disponível, validar contratos reais, duas salas, autorização, CORS, upload/download e OAuth. Sem ambiente, marcar cada caso como pendente externo.
- [ ] Registrar teste real Android/Chrome e iPhone/Safari para câmera, memória e qualidade; sem aparelhos, manter pendente. Dados sintéticos não comprovam OCR ou qualidade em papéis reais.
- [ ] Revisar limpeza de recursos, dependências/lockfile, licenças e instruções. Commit: `test: valida fluxos web e documenta integração e operação`.

## Sequência e execução

Tarefas 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10. As interfaces são compartilhadas e a revisão final deve atravessar autenticação, salas e scanner.
Recomendação: execução direta nesta conversa, com commits por tarefa e uma revisão independente ao final. Fluxo por subagentes é alternativa se o usuário preferir revisão independente a cada tarefa.
Antes de iniciar código, o usuário revisa este plano e escolhe o método. O bloqueio de escrita GitHub não impede desenvolvimento local autorizado, mas impede afirmar sincronização ou CI remoto.

## Autorrevisão do plano

Cobertura: arquitetura/visual (1), sessão (2), salas (3–4), documentos/pastas (5), scanner (6–8), envio/contexto (9), operação e validação (10).
Os cinco riscos de Review Focus têm testes nas tarefas indicadas.
Identidade de sessão substitui a dependência de userId não declarado; raiz de pastas preserva o contrato observado.
Integração externa, documentType de importação e aparelhos reais são gates registrados, não funcionalidades simuladas apresentadas como concluídas.
Nenhuma tarefa modifica o backend, publica site ou habilita acesso público.

