# Integração externa — pendente

O backend foi excluído do escopo por solicitação do usuário. Nenhuma chamada autenticada real foi validada. Os contratos foram portados do cliente React Native, sem inventar rotas ou parâmetros OAuth.

| Validação necessária | Critério |
|---|---|
| URL e HTTPS | Configurar VITE_API_URL e servir o frontend em HTTPS |
| CORS | Permitir a origem web e headers Authorization, X-Room-Id e Content-Type; métodos GET, POST, PUT, DELETE e OPTIONS usados pelo cliente |
| Download | Expor Content-Disposition via Access-Control-Expose-Headers; conferir tipo, bytes e nome UTF-8 |
| Autenticação | Confirmar respostas, 401/403, canCreateRooms e política de expiração |
| Salas | Confirmar status, papéis e conexão para cada provedor; servidor valida membership em todas as rotas |
| Pastas | Raiz é string vazia; preservar caminhos retornados, inclusive acentos; validar hierarquia, renomeação e exclusão |
| Upload | Multipart com files, title, storageProvider, documentType, folderPath; limites reais, sem retry automático |
| PDF existente | Confirmar valor aceito de documentType antes de preencher VITE_IMPORTED_DOCUMENT_TYPE |
| OAuth | Servidor precisa fornecer URL HTTPS e callback web válido. O frontend não modifica redirect_uri; retorno apenas nativo pode ser incompatível |
| Busca | Confirmar escopo da sala e eventual OCR do servidor; o frontend não faz OCR |
| Provedores | Confirmar campos dinâmicos, disponibilidade e tratamento de credenciais |

Teste de homologação sugerido: duas contas e duas salas com provedores distintos; negar acesso à sala alheia, alternar durante consultas, expirar sessão, enviar imagem/PDF, baixar e conferir bytes, navegar pastas e concluir OAuth real.

Um timeout ou erro 5xx após o início do upload tem resultado incerto: pode ter ocorrido gravação. Conferir a listagem antes de repetir. Sem chave de idempotência documentada pelo servidor, o frontend não promete deduplicação.
