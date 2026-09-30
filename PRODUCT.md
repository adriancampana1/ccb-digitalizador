# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + TypeScript + Vite, aprovados pelo usuário em 28/09/2026.
Detalhamento técnico delegado à recomendação do assistente; consultar a especificação de migração.
A hospedagem deve servir o build estático com HTTPS e fallback de rotas. Nenhuma implantação foi autorizada ou executada nesta etapa.

## Users

Uso interno na CCB, especialmente secretaria e administrativo de congregações.
O aplicativo original descreve uso frequente para digitalização e recuperação de documentos.
A versão web deve atender celular e computador, com prioridade ao fluxo de captura no celular.

## Product Purpose

Capturar documentos físicos, preparar arquivos legíveis e enviá-los, identificados e na pasta correta, ao armazenamento da congregação. Permitir sua localização e recuperação posterior.

## Operating Context

O usuário se autentica por telefone e senha e participa de salas.
Cada sala possui provedor, pasta base, estado de conexão e papel MASTER ou MEMBER por participante.
A sala ativa determina o contexto das operações. Um usuário pode participar de várias salas.
O código de acesso é utilizado no cadastro e na entrada em salas existentes.

## Capabilities and Constraints

- Migrar autenticação, salas, conexão de provedores, pastas, documentos, busca e permissões existentes.
- Scanner completo na primeira versão: câmera, múltiplas páginas, recorte, correção de perspectiva, revisão e PDF/JPEG.
- Preservar a integração com a API conhecida, sem presumir acesso ao código do backend.
- A integração real depende de um ambiente de API acessível e compatível com navegador.
- Não afirmar disponibilidade de OCR, indexação ou provedores além do que a API efetivamente demonstrar.
- Não confundir revisão visual ou testes com respostas simuladas com validação de integração real.

## Brand Commitments

Preservar Digitalizador CCB, logo existente e identidade azul institucional.
O usuário aprovou fundo claro, tipografia atual e evolução para componentes modernos, minimalistas, clean e profissionais.
Comunicação em português, direta e adequada a uma ferramenta interna.

## Evidence on Hand

- Origem: https://github.com/adriancampana1/digitalizador-app
- Referência analisada: main, commit 84a30260f7eab631888c739e36755119665510d7.
- Produto e design: PRODUCT.md e DESIGN.md do repositório original.
- Destino: https://github.com/adriancampana1/ccb-digitalizador
- O repositório de destino estava vazio antes deste registro.
- Backend informado: ccb-londrina/digitalizador-backend; inacessível na análise, excluído temporariamente pelo usuário.

## Product Principles

1. Sala e destino sempre explícitos antes de qualquer envio.
2. Digitalização e organização eficientes para uso recorrente.
3. Preservar páginas e escolhas quando uma operação falhar.
4. Autorizações reais pertencem ao backend; controles de interface apenas refletem permissões.
5. Adaptar recursos nativos ao navegador sem prometer equivalência sem validação.

## Accessibility & Inclusion

Proposta de implementação: navegação por teclado, foco visível, rótulos acessíveis, contraste AA e alvos de toque confortáveis.
O editor de páginas deve oferecer comandos acessíveis além de gestos de arrastar.

