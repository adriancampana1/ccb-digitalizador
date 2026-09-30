# Matriz de dispositivos

| Ambiente | Situação |
|---|---|
| Chromium headless, desktop 1440 px | Testes automatizados e revisão visual local |
| Chromium headless, 390 px e 320 px | Responsividade e teclado automatizados; não representam hardware móvel |
| Android / Chrome, câmera física | Pendente |
| iPhone / Safari, câmera física | Pendente |
| Safari e Firefox desktop | Pendente |

Nos aparelhos reais: permissão concedida/negada; câmera traseira e troca de câmera; orientação retrato/paisagem; interrupção por outro app; captura repetida; 20 páginas; memória; imagem EXIF; zoom; ajuste por toque; papel com pouco contraste, sombra e reflexo; PDF/JPEG e envio em rede lenta.

Não afirmar aprovação de câmera, qualidade de digitalização ou consumo de memória móvel com base em testes sintéticos. O processamento depende de Worker, OffscreenCanvas, createImageBitmap e WebAssembly; o fallback explícito conserva as imagens normalizadas sem correções.
