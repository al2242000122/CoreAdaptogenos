# Core Adaptógenos · Botica lunar

Prototipo navegable en español con React, TypeScript y Vite. Incluye catálogo, filtros, fichas, carrito persistente, revisión manual por WhatsApp y un checkout que puede crear pedidos reales en WooCommerce (contraentrega o transferencia) cuando se configura `VITE_WOOCOMMERCE_URL`.

## Uso local

Requiere Node.js 22.12+ compatible con Vite 8 y npm. Desde la raíz del proyecto, en PowerShell:

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Abre la dirección local que muestra Vite. Reinicia el servidor después de editar variables de entorno.

```powershell
npm run lint
npm run test:run
npm run build
```

La compilación genera `dist/`. El servidor de destino debe devolver `index.html` para las rutas del sitio, como `/producto/orbita-01`, y servir los recursos estáticos normalmente.

## Datos y límites de la demostración

- `src/data/products.ts` contiene seis productos ficticios: nombres, ingredientes, presentaciones, precios MXN y lotes reemplazables. No hay inventario ni certificaciones reales.
- `LocalCommerceProvider` es exclusivamente de demostración. Las vistas consumen `commerce`, definido en `src/commerce/CommerceProvider.ts`, a través de la interfaz de `src/commerce/types.ts`.
- El carrito guarda únicamente identificadores y cantidades en la clave `coreadaptogenos-cart` de `localStorage`. Valida los datos al cargar y continúa en memoria si falla el almacenamiento. Puede vaciarse desde el carrito.
- `VITE_WHATSAPP_NUMBER` es público y viene vacío. Configura explícitamente un número autorizado y verificado del negocio (10–15 dígitos, con código de país) antes de habilitar el enlace externo. Si falta o no cumple el formato, la llamada a la acción permanece oculta y solo se ofrece “Copiar pedido”. El sitio muestra el resumen antes de abrir WhatsApp; la persona decide si envía el mensaje.
- Sin `VITE_WOOCOMMERCE_URL`, “Pago en línea” es una simulación: utiliza datos ficticios. El prototipo no los guarda ni los transmite y no pide tarjetas. Aun con `autocomplete="off"`, el navegador puede conservar datos del formulario en su historial según su configuración. Con WooCommerce configurado, la dirección, el envío y el método offline se envían al Store API; los pagos con tarjeta deben continuar en el checkout nativo de WooCommerce.
- Nosotros y Diario son contenido de muestra. La historia, el proceso, los textos comerciales y cualquier texto legal necesitan revisión profesional antes de una publicación comercial.

## Rutas

`/`, `/tienda`, `/producto/:slug`, `/nosotros`, `/diario`, `/carrito`, `/checkout`, `/checkout/whatsapp`, `/checkout/normal` y `/checkout/listo`. Las rutas desconocidas muestran una recuperación al catálogo.

El menú móvil usa un diálogo de pantalla completa con foco contenido, cierre por Escape, retorno de foco al botón y bloqueo de scroll. Las transiciones de ruta llevan el foco al contenido y restablecen el scroll; los filtros mantienen el foco del control. Se respetan las preferencias de movimiento reducido.

## WooCommerce

La conexión ya está implementada en `src/commerce/WooCommerceProvider.ts` y `src/commerce/WooCommerceCheckout.ts`. Sin la variable de entorno se conserva el modo local de demostración; con ella, el catálogo se lee desde Store API y el formulario envía dirección, tarifa, método offline y total confirmado a WooCommerce. El carrito del navegador se limpia solo si no cambió mientras se creaba el pedido.

Sigue [docs/woocommerce-setup.md](docs/woocommerce-setup.md) para crear tus productos, configurar CORS, zonas de envío, protección WAF y publicar el build. Stripe/PayPal deben usar el checkout nativo de WooCommerce hasta añadir sus campos y extensión de pago.

Antes de publicar: revisar contenido y accesibilidad con datos reales; configurar HTTPS, la política de datos del negocio y la navegación directa del servidor; ejecutar las pruebas y validar ambos recorridos en el entorno integrado.

## Identidad independiente

La dirección aprobada es **Botica lunar**: azul tinta `#0c0b2e`, violeta `#24205e`, lima eléctrica `#c9ff4a` y rosa mineral `#ff779c`. Usa Palatino y Bahnschrift con alternativas locales, numeración de fórmulas, envases abstractos CSS y composiciones orbitales originales.

La revisión de los patrones prohibidos confirma: sin base crema/bosque; sin Fraunces/Figtree; sin tarjetas blancas de producto 4:3; sin badges por especie; sin portada de mosaicos por formato; sin ilustraciones botánicas. La portada sigue manifiesto → momentos → colección horizontal → materia/método/lote → diario. No se reutilizaron código, copy ni recursos de CoreMushroom. Los colores de envase son acentos compositivos, no categorías por especie.
