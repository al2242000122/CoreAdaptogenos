# Recepción de pedidos de CoreMushroom

## Decisiones confirmadas el 15 de septiembre de 2026

- Backend: WordPress/WooCommerce. Este repositorio contiene el frontend y el
  cliente Store API; todavía no contiene el plugin servidor del puente.
- Pasarela elegida: Stripe mediante su extensión oficial para WooCommerce.
  Usar el checkout nativo del pedido receptor; el formulario React no captura
  tarjetas. La elección no confirma aprobación de la cuenta ni del catálogo.
- Dominio definitivo: pendiente. `docs/woocommerce-setup.md` identifica un
  host temporal de Hostinger; falta comprobar su instalación y acceso.
- OXXO: condicionado a disponibilidad real en la cuenta y extensión elegidas.

## Pantalla preparada

La ruta `/pago/coremushroom/:session` ya existe en este frontend. No acepta
importe, pedido, correo ni datos bancarios en la URL. La sesión es un valor
hexadecimal aleatorio de al menos 128 bits. Sin servidor receptor configurado,
solo muestra que el método no está disponible y permite volver a CoreMushroom.

Para habilitarla se necesitan **dos componentes servidor**, además del frontend:

1. CoreMushroom crea el pedido y expone los datos reales de sesión solo mediante
   una llamada autenticada desde CoreAdaptogenos. La respuesta incluye el
   pedido, importe entero en centavos, `MXN`, artículos reales, vigencia y
   método; la URL pública contiene únicamente el identificador opaco.
2. El backend de CoreAdaptogenos recupera y valida esos datos, crea el checkout
   alojado mediante el plugin o API oficial del procesador aprobado y entrega
   una respuesta de lectura `GET /wp-json/coreadaptogenos/v1/payment-sessions/:id`
   con esta estructura pública, sin información personal:

   ```json
   {
     "session_id": "0123456789abcdef0123456789abcdef",
     "amount_minor": 90000,
     "currency": "MXN",
     "method": "card",
     "expires_at": "2030-01-01T12:00:00Z",
     "merchant": "CoreAdaptogenos",
     "descriptor": "COREADAPTOGENOS",
     "checkout_url": "https://host-aprobado.example/checkout/token"
   }
   ```

El ejemplo es un **contrato de desarrollo**, no un cobro activo. La ruta
verifica identificador, importe positivo entero, MXN, método, vencimiento,
identidad del cobrador y hostname HTTPS exacto. El hostname permitido se fija
en `VITE_COREMUSHROOM_PAYMENT_HOSTS`; la ruta de lectura se fija en
`VITE_COREMUSHROOM_BRIDGE_API` y debe ser una ruta del mismo origen que el
frontend. Las dos variables siguen vacías mientras el backend no exista.
La respuesta del backend debe llevar `Cache-Control: no-store` y no incluir
datos personales; el frontend también pide la sesión sin usar caché.

El backend receptor valida la firma, marca de tiempo y nonce de cada solicitud
servidor a servidor; no devuelve checkout para un importe o pedido distinto.
El frontend **no** valida pagos ni marca pedidos como pagados. El webhook
firmado del procesador debe verificarse en CoreAdaptogenos y su resultado
enviarse firmado a CoreMushroom, con comparación exacta e idempotencia.

La pasarela y el adquirente deben conocer el catálogo real, ambas marcas y el
dominio que origina el pedido. No usar este frontend para aparentar una venta
distinta a la real. El alcance y las pruebas exigidas están en
`CoreMushroom/docs/pagos-coreadaptogenos.md`.

Pendiente: dominio HTTPS definitivo, acceso al WordPress receptor, aprobación
de Stripe para este catálogo, descriptor bancario, sandbox y conciliación.
Ninguno de esos datos se inventa ni se publica en este repositorio.

## Preparación del servidor receptor

1. Comprobar WordPress/WooCommerce y HTTPS en el hosting receptor.
2. Instalar la [extensión oficial de Stripe](https://woocommerce.com/document/stripe/setup-and-configuration/).
3. Conectar la cuenta en [modo de pruebas](https://woocommerce.com/document/stripe/customer-experience/testing/)
   y verificar sus [webhooks](https://woocommerce.com/document/stripe/setup-and-configuration/stripe-webhooks/).
4. Implementar los dos componentes del puente descritos arriba. El pedido
   receptor debe conservar los artículos reales, importe, moneda y origen;
   no reemplazar el catálogo por un producto genérico de cobro.
5. Probar pago aprobado/rechazado, reintentos, vencimiento, importe alterado y
   reembolsos entre ambos pedidos antes de habilitarlo en CoreMushroom.

El plugin Stripe gestiona los datos de tarjeta y su comunicación con Stripe.
No sustituye el puente ni confirma por sí solo el pedido de CoreMushroom.
