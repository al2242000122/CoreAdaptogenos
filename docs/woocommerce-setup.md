# Conexión con WooCommerce

El frontend puede trabajar en dos modos:

- Sin `VITE_WOOCOMMERCE_URL`: catálogo local de demostración y checkout simulado.
- Con `VITE_WOOCOMMERCE_URL`: catálogo público de WooCommerce y creación real de pedidos mediante Store API.

## Configuración de producción

1. En el panel de WooCommerce crea tus productos reales y publícalos. El SKU se muestra como referencia de fórmula; usa las categorías `Extractos`, `Mezclas` o `Cacao` y las etiquetas `Mañana`, `Cotidiano`, `Noche` y opcionalmente `Destacado` para que los filtros y la portada del frontend se completen automáticamente.
2. En WooCommerce activa al menos un método offline (`Contra reembolso` o `Transferencia bancaria`). El formulario propio admite esos dos métodos; si después instalas Stripe o PayPal, usa el checkout nativo de WooCommerce para esos pagos.
3. Permite solicitudes CORS desde el dominio público del frontend hacia `https://coreadaptogenos.app`. Debe permitirse `GET, POST, OPTIONS`, los encabezados `Content-Type, Cart-Token` y la exposición de `Cart-Token, X-WP-TotalPages`. No compartas claves REST ni credenciales en el frontend.
4. Copia `.env.example` a `.env.production` y define:

   ```text
   VITE_WOOCOMMERCE_URL=https://coreadaptogenos.app
   VITE_WOO_PAYMENT_METHOD=cod
   VITE_WOO_ALLOWED_PAYMENT_HOSTS=coreadaptogenos.app
   VITE_WHATSAPP_NUMBER=521XXXXXXXXXX
   ```

5. Ejecuta `npm run build` y publica la carpeta `dist/` en el hosting del frontend. Tras publicar, prueba un producto, el carrito, WhatsApp y un pedido de importe pequeño con contraentrega.

## Antes de abrir pedidos

- Configura en WooCommerce una zona de envío para México y al menos una tarifa activa. El formulario envía primero la dirección a `cart/update-customer` para que WooCommerce recalcule envío e impuestos antes de confirmar el total.
- Crea los artículos como productos simples con precio e inventario; los productos variables (`has_options`) se ocultan hasta integrar un selector de variaciones para no enviar pedidos incompletos.
- Prueba estados con su nombre completo (por ejemplo, `Jalisco` o `Ciudad de México`); el frontend los convierte a los códigos oficiales de WooCommerce.
- La Store API es pública por diseño y usa un `Cart-Token`; CORS no es un control contra bots. Activa el WAF y la limitación de solicitudes de Hostinger (o Cloudflare) para `/wp-json/wc/store/v1/cart/*` y `/wp-json/wc/store/v1/checkout`, y revisa pedidos COD sospechosos desde WooCommerce.
- Si se pierde la conexión después de pulsar «Crear pedido», confirma primero en WooCommerce si el pedido fue creado antes de reintentarlo.

El checkout automático usa la Store API pública y un `Cart-Token`; no requiere claves de la API REST administrativa. Si WooCommerce no responde o CORS está mal configurado, el checkout muestra el error y el pedido manual por WhatsApp sigue disponible.
