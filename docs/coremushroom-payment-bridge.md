# Recepción de pedidos de CoreMushroom

## Decisiones confirmadas el 15 de septiembre de 2026

- Backend: WordPress/WooCommerce. Este repositorio contiene el frontend, el
  cliente Store API y el plugin servidor en
  `wordpress-plugin/coreadaptogenos-coremushroom-bridge/`.
- Pasarela elegida: Stripe mediante su extensión oficial para WooCommerce.
  Usar el checkout nativo del pedido receptor; el formulario React no captura
  tarjetas. La elección no confirma aprobación de la cuenta ni del catálogo.
- Dominio definitivo: `https://coreadaptogenos.app`. Se registró en Name.com
  y se conectó al WordPress receptor de Hostinger el 16 de septiembre de 2026.
  Los nameservers configurados son `aurora.dns-parking.com` y
  `nebula.dns-parking.com`; DNS y HTTPS se verificaron el 19 de septiembre de
  2026. Se confirmó WooCommerce activo y se instaló WooCommerce Stripe Gateway
  11.0.0. La cuenta en vivo y el modo de pruebas están conectados; el webhook
  de pruebas se reconfiguró y procesó correctamente la compra integral del 19
  de septiembre.
- OXXO: condicionado a disponibilidad real en la cuenta y extensión elegidas.

## Puente implementado

El plugin receptor expone `POST /wp-json/coreadaptogenos/v1/payment-sessions`.
Valida HMAC SHA-256, antigüedad de cinco minutos, nonce atómico, origen exacto,
MXN, total en centavos y artículos reales. Crea mediante CRUD de WooCommerce
un pedido espejo de solo pago y devuelve su URL nativa `order-pay`, firmada.
En ese pedido deja únicamente el gateway oficial `stripe`, evita una segunda
reducción de inventario y suprime los correos duplicados de WooCommerce.

Cuando el webhook oficial de Stripe completa, reembolsa o revierte el pedido
receptor, el plugin envía un callback firmado e idempotente a CoreMushroom. El
acuse JSON debe confirmar el evento y ambos pedidos exactos; una respuesta
HTML con código 200 se trata como fallo. Si el origen no responde, usa Action
Scheduler con reintentos. El regreso del navegador no confirma el pago.

El endpoint permanece cerrado hasta guardar el mismo secreto en ambos sitios
y activar el puente en WooCommerce → Puente CoreMushroom. El secreto nunca se
incluye en Git ni se vuelve a imprimir en el formulario de administración.

## Pantalla preparada para una fase posterior

La ruta `/pago/coremushroom/:session` ya existe en este frontend. No acepta
importe, pedido, correo ni datos bancarios en la URL. La sesión es un valor
hexadecimal aleatorio de al menos 128 bits. Sin servidor receptor configurado,
solo muestra que el método no está disponible y permite volver a CoreMushroom.

La primera versión operativa redirige directamente a `order-pay`; no depende
de desplegar el prototipo React. La ruta React queda preparada para una futura
pantalla intermedia y no participa en la confirmación del pago.

El intercambio entre servidores funciona así:

1. CoreMushroom crea su pedido, deriva una sesión opaca estable para ese pedido
   y envía por HTTPS una
   solicitud firmada con el total exacto, los artículos y la facturación mínima.
2. CoreAdaptogenos valida firma, vigencia, entorno test/live y total exacto.
   La pareja origen/pedido solo puede tener una sesión y cada sesión solo puede
   tener un pedido espejo. Después devuelve una
   respuesta 201 firmada con esta estructura:

   ```json
   {
     "session": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
     "receiver_order_id": 87,
     "amount_minor": 90000,
     "currency": "MXN",
     "environment": "test",
     "checkout_url": "https://coreadaptogenos.app/finalizar-compra/order-pay/87/?key=wc_...",
     "signature": "hmac_sha256_..."
   }
   ```

El ejemplo es el contrato de la versión 1, todavía cerrado en producción. El
plugin verifica identificador, importe positivo entero, MXN, método, origen y
hostname HTTPS exacto. Las variables `VITE_COREMUSHROOM_PAYMENT_HOSTS` y
`VITE_COREMUSHROOM_BRIDGE_API` solo se usarán si después se despliega la
pantalla React intermedia; permanecen vacías en esta primera versión. La
respuesta lleva `Cache-Control: no-store`.

El backend receptor valida la firma, marca de tiempo y nonce de cada solicitud
servidor a servidor; no devuelve checkout para un importe o pedido distinto.
El frontend **no** valida pagos ni marca pedidos como pagados. El webhook
firmado del procesador debe verificarse en CoreAdaptogenos y su resultado
enviarse firmado a CoreMushroom, con comparación exacta e idempotencia.

La pasarela y el adquirente deben conocer el catálogo real, ambas marcas y el
dominio que origina el pedido. No usar este frontend para aparentar una venta
distinta a la real. El alcance y las pruebas exigidas están en
`CoreMushroom/docs/pagos-coreadaptogenos.md`.

El plugin receptor ya está instalado y activado en el WordPress de Hostinger;
el secreto compartido está guardado en ambos paneles y la pasarela emisora
sigue oculta. La ruta REST responde 401 a solicitudes sin firma.

El 19 de septiembre de 2026 se completó un recorrido de pruebas por $900 MXN:
el pedido #55 de CoreMushroom creó el espejo #27, Stripe confirmó el pago y
ambos pedidos quedaron en «Procesando». El 21 de septiembre se publicó una
portada estática propia en CoreAdaptogenos y se retiraron el contenido inicial
de WordPress y los marcadores `trans-*` del pie.

El 21 de septiembre se activaron transferencias automáticas diarias sin saldo
mínimo retenido. Ese día se completó un rechazo controlado: CoreMushroom #56
quedó pendiente y el espejo #32 quedó fallido. También se reembolsó íntegramente
el cargo simulado de $900; el espejo #27 y CoreMushroom #55 quedaron
reembolsados mediante el webhook oficial y el callback firmado. No hubo dinero
real. Pendiente: obtener la aprobación del catálogo y la relación entre ambos
dominios, y después cambiar ambos lados a producción.
Ninguno de esos datos se inventa ni se publica en este repositorio.

## Preparación del servidor receptor

1. Comprobar WordPress/WooCommerce y HTTPS en el hosting receptor.
2. Instalar la [extensión oficial de Stripe](https://woocommerce.com/document/stripe/setup-and-configuration/).
3. Conectar la cuenta en [modo de pruebas](https://woocommerce.com/document/stripe/customer-experience/testing/)
   y verificar sus [webhooks](https://woocommerce.com/document/stripe/setup-and-configuration/stripe-webhooks/).
4. Instalar el ZIP generado desde
   `wordpress-plugin/coreadaptogenos-coremushroom-bridge/`, guardar el secreto
   compartido y activar el endpoint.
5. Probar pago aprobado/rechazado, reintentos, vencimiento, importe alterado y
   reembolsos entre ambos pedidos antes de habilitarlo en CoreMushroom.

El plugin Stripe gestiona los datos de tarjeta y su comunicación con Stripe.
No sustituye el puente ni confirma por sí solo el pedido de CoreMushroom.
