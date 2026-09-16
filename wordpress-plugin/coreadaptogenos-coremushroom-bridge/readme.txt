=== CoreAdaptógenos · Puente CoreMushroom ===
Requires at least: 6.7
Requires PHP: 8.1
Stable tag: 0.2.0

Puente firmado entre dos instalaciones WooCommerce del mismo operador.

== Seguridad ==

El plugin falla cerrado. No acepta sesiones hasta guardar un secreto de al
menos 32 caracteres y activar el endpoint. Usa HMAC SHA-256, timestamp, nonce
atómico, idempotencia de sesión y una lista exacta de origen. El navegador no
confirma pagos; solo lo hace el webhook oficial de Stripe a WooCommerce y el
callback firmado de este plugin.

Cada pedido de origen conserva una sola sesión y un solo pedido receptor. Los
eventos de pago, reembolso y reversión tienen identificadores idempotentes; la
respuesta del origen debe confirmar exactamente el evento antes de detener los
reintentos.

No almacena datos de tarjeta. Los captura exclusivamente Stripe mediante su
extensión oficial para WooCommerce.
