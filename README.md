# Core Adaptógenos · Botica lunar

Prototipo navegable en español con React, TypeScript y Vite. Incluye catálogo ficticio, filtros, fichas, carrito persistente, revisión para WhatsApp y un checkout simulado. No crea pedidos comerciales ni procesa pagos.

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
- `VITE_WHATSAPP_NUMBER` es público. El número de `.env.example` es de muestra y **debe reemplazarse por el número autorizado del negocio antes de compartir o utilizar el enlace externo**. Déjalo vacío para probar “Copiar pedido”. No envíes mensajes al número de muestra. El sitio muestra el resumen antes de abrir WhatsApp; la persona decide si envía el mensaje.
- “Pago en línea” es una simulación: utiliza datos ficticios. No pide tarjetas ni transmite contacto, dirección, pedido o pago. Los datos del formulario viven en memoria; recargar la confirmación no acredita una compra. No hay envío, impuestos ni correos reales.
- Nosotros y Diario son contenido de muestra. La historia, el proceso, los textos comerciales y cualquier texto legal necesitan revisión profesional antes de una publicación comercial.

## Rutas

`/`, `/tienda`, `/producto/:slug`, `/nosotros`, `/diario`, `/carrito`, `/checkout`, `/checkout/whatsapp`, `/checkout/normal` y `/checkout/listo`. Las rutas desconocidas muestran una recuperación al catálogo.

El menú móvil usa un diálogo de pantalla completa con foco contenido, cierre por Escape, retorno de foco al botón y bloqueo de scroll. Las transiciones de ruta llevan el foco al contenido y restablecen el scroll; los filtros mantienen el foco del control. Se respetan las preferencias de movimiento reducido.

## Handoff a WooCommerce

1. Implementar `WooCommerceProvider` con la interfaz existente (`listProducts(filters?)` y `getProduct(slug)`) usando WooCommerce Store API. Mapear identificadores, slugs, formatos, momentos, ingredientes, lotes, imágenes y precios; adaptar las unidades monetarias de la API al contrato local. Los filtros de ritual son una taxonomía de negocio que debe definirse.
2. Sustituir la instancia `commerce` manteniendo las vistas. Comprobar carga, error, productos retirados y stock contra el catálogo real. Los lotes de muestra no constituyen trazabilidad real.
3. Integrar el carrito de Store API y su sesión/token. El subtotal actual se calcula localmente: en producción, WooCommerce debe ser la autoridad de precios, descuentos, existencias, impuestos y envío. Reconciliar el carrito local antes de permitir un pedido.
4. La interfaz actual cubre lectura del catálogo; no implementa creación de pedidos. Definir esa frontera para el checkout real y sustituir el formulario simulado por el checkout nativo o la integración de Store API. El procesamiento de pagos y sus credenciales pertenecen al proveedor de pago/servidor; nunca colocar secretos en variables `VITE_*`.
5. Reemplazar el número de WhatsApp y revisar el mensaje con datos comerciales reales. El identificador `CA-...` es una referencia local de demostración, no un número de pedido de WooCommerce. Confirmar disponibilidad, envío y pago manualmente en esa ruta.

Antes de publicar: revisar contenido y accesibilidad con datos reales; configurar HTTPS, la política de datos del negocio y la navegación directa del servidor; ejecutar las pruebas y validar ambos recorridos en el entorno integrado.

## Identidad independiente

La dirección aprobada es **Botica lunar**: azul tinta `#0c0b2e`, violeta `#24205e`, lima eléctrica `#c9ff4a` y rosa mineral `#ff779c`. Usa Palatino y Bahnschrift con alternativas locales, numeración de fórmulas, envases abstractos CSS y composiciones orbitales originales.

La revisión de los patrones prohibidos confirma: sin base crema/bosque; sin Fraunces/Figtree; sin tarjetas blancas de producto 4:3; sin badges por especie; sin portada de mosaicos por formato; sin ilustraciones botánicas. La portada sigue manifiesto → momentos → colección horizontal → materia/método/lote → diario. No se reutilizaron código, copy ni recursos de CoreMushroom. Los colores de envase son acentos compositivos, no categorías por especie.
