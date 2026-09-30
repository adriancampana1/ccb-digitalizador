---
name: Digitalizador CCB — web
description: Interface interna clara para digitalização e organização de documentos.
colors:
  primary: "#003d5c"
  primary-hover: "#005575"
  tint: "#e8f0f3"
  bg: "#f7f8f9"
  paper: "#ffffff"
  ink: "#20333e"
  muted: "#62727e"
  line: "#dfe5e8"
  danger: "#a52c32"
  success: "#226b50"
typography:
  body:
    fontFamily: '"Lexend Deca", sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  headline:
    fontFamily: '"Lexend Deca", sans-serif'
    fontSize: "32px"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: '"Lexend Deca", sans-serif'
    fontSize: "23px"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-0.025em"
rounded:
  control: "9px"
  surface: "14px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "10px 18px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.primary}"
    rounded: "{rounded.control}"
    padding: "10px 18px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 18px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "11px 13px"
  surface:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.surface}"
---

# Design System: Digitalizador CCB — web

## Overview

Identidade herdada do aplicativo CCB e modernizada em modo Operate: minimalista, clean e profissional. O logo original e o azul institucional permanecem como referências fixas; superfícies claras, tipografia legível e controles explícitos apoiam o uso interno recorrente.

**Key Characteristics:**
- Fundo claro e superfícies brancas delimitadas por bordas discretas.
- Sala ativa visível e ações com linguagem direta em português.
- Navegação e editor reorganizados para celular e computador.

## Colors

O azul institucional é o acento principal de ações, seleção e marca. O tom de hover reforça a resposta dos botões; a tonalidade clara marca contexto e estados ativos. Fundo e papel sustentam a hierarquia sem decoração. Texto principal, texto secundário e divisórias usam os neutros definidos no frontmatter. Perigo e sucesso são semânticos, reservados ao resultado das operações.

A fonte normativa de valores é `src/shared/theme/tokens.css`; `globals.css` contém estados e detalhes de componentes. Seleção de texto usa fundo tonal e texto primário; cursor de edição usa a cor primária. Sliders, checkbox e radio usam `accent-color: var(--primary)`.

## Typography

Lexend Deca local nos pesos 400, 500 e 600, com fallback sans-serif. Corpo e títulos compartilham a mesma família. Títulos usam espaçamento levemente compacto; metadados são menores e secundários, sem competir com o nome do documento. Títulos de página passam a 27px no celular; títulos dos painéis do scanner usam 20px. O destaque do login usa `clamp(32px, 3.5vw, 54px)` no desktop.

## Layout

Navegação lateral de 238px no desktop e conteúdo com largura máxima de 1320px. A lateral reduz para 210px até 1000px. Até 700px, a lateral cede lugar à navegação inferior fixa, com espaço reservado no conteúdo. Sala ativa permanece no cabeçalho e seu nome pode quebrar linha.

O scanner usa área de revisão flexível e coluna de salvamento de 300px. Até 1100px, o salvamento aparece abaixo da revisão. Até 500px, os ajustes ficam em uma coluna, ações podem quebrar linha e o painel de salvamento usa padding de 20px. A lista tabular transforma-se em linhas verticais de documentos no celular. Importação admite quebra de linha entre botão e estado.

## Elevation & Depth

Superfícies operacionais usam bordas e contraste tonal. A sombra `0 24px 80px #003d5c25` é reservada ao diálogo; não deve ser espalhada por listas e painéis. O contorno interno da miniatura selecionada reforça seu estado. Transições de fundo dos botões duram 0.15s; a preferência por movimento reduzido desativa transições e animações.

## Shapes

Controles têm cantos moderadamente arredondados; painéis usam o raio de superfície. Campos têm altura mínima de 46px e botões, 44px. Ícones Lucide mantêm linguagem linear consistente. O logo original permanece como imagem, sem redesenho.

## Components

- **Botões:** primário azul, secundário branco com borda, ghost transparente e perigo em tom semântico. Hover altera o fundo. Estado desabilitado reduz opacidade e bloqueia a ação.
- **Campos:** rótulo visível associado ao controle, placeholder secundário e erros vinculados ao campo. Foco usa outline de 3px em #537d94, com offset de 3px.
- **Importação:** botões “Selecionar imagens” e “Selecionar PDF” acionam o input correspondente, oculto apenas visualmente; estados de seleção são exibidos em português. O botão permanece acessível por teclado e herda o bloqueio da operação. O input conserva o rótulo associado.
- **Revisão:** miniaturas indicam a página ativa; ajuste de cantos, resultado e original ficam em modos separados. Cantos oferecem comandos por setas e passos maiores com Shift. Contraste e zoom preservam controles range nativos com acento institucional e rótulos de valor.
- **Navegação:** estado ativo tonal, ícone e texto. Digitalizar mantém ação destacada no celular. O link de salto leva ao conteúdo principal.
- **Avisos:** mensagens explicam situação e recuperação. Demonstração identifica dados fictícios explicitamente, inclusive nos documentos de teste.

## Do's and Don'ts

### Do
- Do preservar o logo original e a identidade institucional.
- Do manter foco visível, rótulos associados e alvos de toque de pelo menos 44px.
- Do oferecer ajuste dos cantos por teclado além do arraste.
- Do localizar ações e estados de seleção de arquivos em português.

### Don't
- Don't adicionar gradientes ou efeitos decorativos à interface operacional.
- Don't usar o seletor de arquivos nativo como apresentação visível dependente do idioma do navegador.
- Don't ocultar a sala e o destino das ações de envio.
