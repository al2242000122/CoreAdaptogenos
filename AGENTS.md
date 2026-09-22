# context-mode — MANDATORY routing rules

## Puente de pago CoreMushroom

- El origen canónico del escaparate es `https://coremushroom.com.mx`. El
  antiguo subdominio `core.bancodeesporas.com` queda únicamente como redirección
  permanente. El receptor debe validar el host canónico de forma exacta.

- El WhatsApp Business público para ambas marcas es 220 644 6651. Enlaces
  internacionales: `https://wa.me/522206446651`. El frontend de muestra no
  debe activar pedidos por WhatsApp con productos ficticios; configura
  `VITE_WHATSAPP_NUMBER` solo junto con el catálogo WooCommerce real.

- El receptor WordPress vive en `https://coreadaptogenos.app`; DNS y HTTPS se
  verificaron el 19 de septiembre de 2026. Usar el dominio definitivo también
  para la conexión de Stripe y las pruebas del puente.
- El 21 de septiembre de 2026 se publicó una portada estática propia en ese
  WordPress. Identifica a CoreAdaptogenos como procesador de pagos de pedidos
  CoreMushroom, explica Stripe, el importe verificado y el regreso al pedido,
  y muestra el WhatsApp compartido. El pie ya no contiene marcadores `trans-*`.
- El plugin está en
  `wordpress-plugin/coreadaptogenos-coremushroom-bridge/`. No se guardan
  secretos, pedidos ni datos de clientes en este repositorio público.
- CoreMushroom conserva el pedido comercial. Este WooCommerce crea un pedido
  espejo de solo pago con los artículos reales y Stripe como único gateway.
- El navegador nunca confirma un pago. La confirmación nace en el webhook de
  Stripe, se aplica al pedido espejo y vuelve por callback HMAC idempotente.
- La sesión es estable por pedido, expira en una hora y está ligada al entorno
  real de Stripe (test o live). El receptor propaga pago, reembolso y
  reversión; solo acepta como entrega un acuse JSON con los identificadores
  exactos.
- El endpoint falla cerrado sin secreto compartido, origen HTTPS exacto y
  activación explícita. OXXO no forma parte de la primera versión.
- El 21 de septiembre de 2026 se activaron en Stripe las transferencias
  automáticas diarias sin saldo mínimo retenido. No guardar datos de la cuenta
  bancaria vinculada en este repositorio público.
- El 21 de septiembre se verificaron los escenarios de rechazo y reembolso. En
  el rechazo, el espejo #32 quedó «Fallido» y el pedido CoreMushroom #56 siguió
  pendiente de pago. En el reembolso, Stripe devolvió íntegramente el cargo
  simulado de $900, el espejo #27 quedó «Reembolsado» y el callback firmado
  actualizó CoreMushroom #55 al mismo estado. No hubo dinero real.
- Verificación local: `php wordpress-plugin/coreadaptogenos-coremushroom-bridge/tests/run.php`.

context-mode MCP tools are available. Use them to keep large tool output out of the context window. Codex hooks provide runtime enforcement when `[features].hooks = true`; these project rules provide model-side routing.

## Think in Code

Analyze, count, filter, compare, search, parse, or transform data by writing code through `ctx_execute`. Print only the result needed for the current decision. Prefer one sandboxed program over reading many files or large outputs into context.

## Required routing

- Do not use `curl` or `wget`. Use `ctx_fetch_and_index` for web content, then `ctx_search`.
- Do not run inline HTTP with `node -e` or `python -c`; use `ctx_execute`.
- Use `ctx_batch_execute` for shell workflows expected to produce more than 20 lines.
- Read files directly when editing them. For analysis or summarization, use `ctx_execute_file`.
- Use `ctx_execute` for grep/search operations that may produce large results.
- For multiple URLs or network commands, set concurrency between 4 and 8. Keep concurrency 1 for builds, tests, or commands sharing state.

## Tool order

1. Resume: search prior context with `ctx_search(..., sort: "timeline")`.
2. Gather: use one `ctx_batch_execute` call for related commands.
3. Follow up: use one `ctx_search` call with all related questions.
4. Process: use `ctx_execute` or `ctx_execute_file`.
5. Web: use `ctx_fetch_and_index`, then `ctx_search`.
6. Persist useful context with `ctx_index`.

## Project search

The project-local tgrep executable is `.tools/bin/tgrep.exe`; its index is `.tgrep/index`. Always invoke it through the tracked integrity-checking wrapper.

- Build or refresh: `pwsh -NoProfile -File scripts/tgrep.ps1 index . --index-path .tgrep/index`
- Search: `pwsh -NoProfile -File scripts/tgrep.ps1 <pattern> . --index-path .tgrep/index`

Use `rg` for small, focused searches. Prefer tgrep after its index exists when searching broadly or repeatedly.

## Windows

Context Mode's shell sandbox uses Git Bash/MSYS2. Convert `X:\path` to `/x/path`, use absolute paths, and quote paths containing spaces. Wrap PowerShell-only commands with `pwsh -NoProfile -Command "..."`.
