# Core Adaptógenos — diseño del prototipo navegable

## Objetivo

Crear un prototipo de comercio electrónico en español para hongos funcionales que permita validar marca, navegación, catálogo, carrito y dos rutas de pedido antes de implementar el tema definitivo en WooCommerce.

El prototipo debe sentirse completamente distinto a CoreMushroom. No reutilizará su código, textos, recursos, composición, tipografías ni sistema visual. CoreMushroom se consulta únicamente para identificar patrones que deben evitarse y requisitos comerciales que conviene representar de otra manera.

## Enfoques considerados

1. **React + Vite con proveedor de comercio local — elegido.** Permite una experiencia navegable, estado real de carrito, rutas y pruebas rápidas. Una interfaz de datos separada deja preparado el reemplazo por WooCommerce Store API.
2. **Tema WordPress desde el inicio.** Es más cercano al destino final, pero añade instalación, contenido y configuración de plugins antes de aprobar la experiencia visual.
3. **Sitio HTML estático.** Es el camino más corto a una portada, pero no representa con fidelidad filtros, carrito persistente ni el checkout dual.

## Dirección de marca

La dirección aprobada es **Botica lunar**: nocturna, sensorial y premium, sin estética de herbolaria tradicional ni fantasía esotérica.

- Base azul tinta casi negra, superficies violeta profundo, acento lima eléctrica y contrapunto rosa mineral.
- Titulares con serif expresiva y cursiva; interfaz y datos con sans geométrica.
- Fotografía de producto simulada mediante composiciones gráficas y envases abstractos. No se usarán ilustraciones botánicas, fondos beige, madera ni paletas verdes/terrosas.
- Formas orbitales, líneas finas y numeración de fórmulas crean un lenguaje de “laboratorio nocturno”.
- Movimiento sobrio: entradas escalonadas, desplazamiento suave de órbitas y respuestas táctiles en botones y tarjetas. Se respetará `prefers-reduced-motion`.
- Voz directa, íntima y transparente. El copy evita promesas terapéuticas, diagnósticos, tratamientos y resultados garantizados.

## Arquitectura de experiencia

El prototipo tendrá las siguientes rutas:

- `/`: portada con manifiesto, selector de intención no médica, productos destacados, explicación del proceso y llamada al catálogo.
- `/tienda`: catálogo filtrable por formato y momento del ritual.
- `/producto/:slug`: ficha de producto con presentación, ingredientes de muestra, formato, contenido, lote demostrativo y controles de carrito.
- `/nosotros`: origen, proceso y principios de trazabilidad.
- `/diario`: índice editorial de contenidos de muestra.
- `/carrito`: edición de cantidades, eliminación y resumen.
- `/checkout`: selector claro entre “Pedir por WhatsApp” y “Pago en línea”.
- `/checkout/normal`: formulario demostrativo que representa el checkout de WooCommerce sin procesar un pago real.

La navegación móvil usará un panel de pantalla completa. El carrito será accesible desde el encabezado y mostrará su cantidad sin obligar a abandonar la página.

## Catálogo de demostración

Se incluirán seis productos ficticios y editables repartidos entre extractos, mezclas y cacao. Los nombres, precios, ingredientes y presentaciones se marcarán como contenido de muestra en el código. Las fichas describirán composición y formato, no efectos médicos.

Los filtros serán client-side y no se presentarán como diagnóstico. En vez de “tratar ansiedad” o afirmaciones equivalentes, se usarán momentos neutrales como mañana, enfoque cotidiano y pausa nocturna, acompañados por un aviso de uso responsable.

## Capa de comercio

Los componentes no leerán directamente un archivo de productos. Consumirán una interfaz `CommerceProvider` con operaciones para listar productos, obtener una ficha y construir una solicitud de checkout.

El prototipo implementará `LocalCommerceProvider`. La migración posterior implementará `WooCommerceProvider` mediante WooCommerce Store API conservando las vistas y el estado de interfaz.

El carrito se gestionará con un contexto de React y se persistirá en `localStorage`. Al cargar, los datos se validarán; si están corruptos, el carrito se restablecerá sin bloquear la aplicación.

## Checkout híbrido

### Pedido manual recomendado

La acción principal será **Pedir por WhatsApp**. El prototipo construirá un enlace `wa.me` con:

- saludo y solicitud de confirmación;
- productos, variantes, cantidades y subtotales;
- total estimado;
- identificador local del pedido;
- nota para acordar envío y forma de pago manualmente.

El número se leerá de una variable de entorno pública y tendrá un valor de demostración claramente documentado. Antes de abrir WhatsApp se mostrará una pantalla de revisión; si falta el número, se ofrecerá copiar el pedido al portapapeles.

### Checkout normal

La opción secundaria será **Continuar al pago en línea**. En el prototipo abrirá un formulario navegable con contacto, dirección, envío y método de pago simulado. No almacenará ni transmitirá información sensible. La pantalla final indicará que la transacción es una demostración.

En WooCommerce, esta acción será sustituida por el checkout nativo o por un enlace generado por WooCommerce Store API.

## Estados y errores

- Catálogo vacío: explicación breve y acceso de regreso a la portada.
- Producto inexistente: página 404 contextual con acceso al catálogo.
- Fallo de persistencia: la interfaz mantiene el carrito en memoria y muestra un aviso no intrusivo.
- WhatsApp no configurado: botón para copiar el resumen y explicación de contacto pendiente.
- Checkout simulado: validación accesible por campo; no se aceptarán datos de tarjeta reales.
- Imágenes o decoraciones: la composición mantiene color y texto suficientes para no depender de ellas.

## Accesibilidad y adaptación

- Contraste WCAG AA para texto y controles.
- Navegación completa por teclado, foco visible y etiquetas accesibles.
- Diseño responsive desde 360 px hasta escritorio amplio.
- Áreas táctiles mínimas de 44 px.
- Animaciones desactivables y sin desplazamientos que alteren la lectura.

## Verificación

- Pruebas unitarias para totales, persistencia y construcción del mensaje de WhatsApp.
- Pruebas de componentes para agregar, modificar y eliminar productos.
- Prueba de navegación del flujo portada → producto → carrito → WhatsApp.
- Prueba del flujo portada → carrito → checkout normal → confirmación simulada.
- Compilación de producción, lint y revisión responsive en navegador.
- Revisión visual explícita contra CoreMushroom: sin coincidencia de paleta, tipografías, estructura de portada, tarjetas o recursos.

## Fuera de alcance

- WordPress, WooCommerce y pagos reales.
- Inventario, impuestos, paqueterías o correos transaccionales reales.
- Panel administrativo.
- Asesoría médica, cuestionarios diagnósticos o afirmaciones terapéuticas.
- Textos legales finales; cualquier contenido legal será de muestra y requerirá revisión profesional.

## Criterio de éxito

Una persona puede recorrer el catálogo, añadir productos, editar el carrito y completar cualquiera de las dos rutas de pedido sin callejones sin salida. La experiencia comunica una marca premium y nocturna reconocible, funciona en móvil y escritorio, y mantiene una frontera técnica clara para integrar WooCommerce posteriormente.
