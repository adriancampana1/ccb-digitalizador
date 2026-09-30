# Estado da migração

Implementação web entregue localmente na branch `codex/migracao-web`.

As dez áreas do plano foram implementadas: fundação, autenticação/transporte, salas, provedores, documentos/pastas, captura/lote, processamento, editor/exportação, envio/recuperação e validação/documentação. O backend permaneceu fora do escopo, conforme solicitado.

Evidência atual: `docs/validation/frontend.md`. Integração externa e aparelhos: `docs/validation/backend.md` e `devices.md`. Instalação: `README.md`. O plano aprovado e a especificação permanecem em `docs/superpowers/`; os checklists originais são referência de planejamento, não o registro da execução final.

Decisões de implementação: componentes pequenos compartilhados em `shared/ui/index.tsx`; um tsconfig; demo via adapter Axios explicitamente habilitado, sem service worker; OAuth confirmado por atualização/foco e status do servidor. O worker é clássico e local em `public/scanner-worker.js`, necessário para carregar a distribuição OpenCV via importScripts. Quando indisponível, permite exportação explícita das imagens normalizadas sem correções.

Páginas, PDF importado e destino ficam na memória. Uma sala que desaparece mantém o lote recuperável por download e exige escolha explícita de outra sala. Não há troca automática de provedor, retry de POST ou deduplicação prometida.

GitHub: escrita recusada pela integração (403). Nenhum push, PR ou CI remoto foi executado. Não repetir tentativas ou substituir credenciais enquanto a permissão não for alterada. Preservar esta branch e o histórico local; não fazer merge em uma branch remota não inspecionada.

A entrega compactada inclui o código e `historico.bundle`. Para restaurar os commits em outra pasta:

```bash
git clone -b codex/migracao-web historico.bundle ccb-digitalizador-restaurado
cd ccb-digitalizador-restaurado
git remote set-url origin https://github.com/adriancampana1/ccb-digitalizador.git
```

Após liberar escrita, conferir se o repositório remoto recebeu mudanças antes de enviar a branch. Não usar force push. A sincronização remota é a única etapa de entrega bloqueada; homologação com backend/dispositivos continua separada.
