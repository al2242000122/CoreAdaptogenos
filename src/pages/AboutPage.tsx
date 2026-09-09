import { Link } from 'react-router-dom';

export function AboutPage() {
  return (
    <div className="about-page">
      <header className="editorial-intro">
        <p className="eyebrow">Nosotros / Botica lunar</p>
        <h1>Materia, método.<br /><em>Y una mirada propia.</em></h1>
        <p>Una idea de botica que empieza con preguntas claras: qué contiene una fórmula, cómo se presenta y de dónde viene su información.</p>
      </header>
      <section className="about-origin" aria-labelledby="origin-title">
        <div className="about-emblem" aria-hidden="true"><span>c°</span><i /><small>MATERIA / MÉTODO / LOTE</small></div>
        <div><p className="eyebrow">01 / El punto de partida</p><h2 id="origin-title">Nuestro origen</h2><p>Core Adaptógenos nace aquí como una exploración de diseño: dar espacio a los ingredientes, a los detalles y al ritmo de cada persona.</p><p>Esta historia es parte de un prototipo. La colección, sus fórmulas y sus lotes son ficticios; no representan una producción ni certificaciones reales.</p></div>
      </section>
      <section className="about-method" aria-labelledby="extraction-title">
        <div className="section-heading"><div><p className="eyebrow">02 / Abrir el proceso</p><h2 id="extraction-title">Extracción, <em>a la vista.</em></h2></div><p>Un recorrido ilustrativo. Las etapas siguientes no describen un proceso productivo validado ni instrucciones de preparación.</p></div>
        <div className="method-grid">
          <article><span className="eyebrow">01 / Materia</span><h3>Identificar</h3><p>Registrar la identidad de cada ingrediente y su procedencia antes de presentar una fórmula.</p></article>
          <article><span className="eyebrow">02 / Método</span><h3>Documentar</h3><p>Una ficha futura describirá el método de extracción y sus controles con información verificada del fabricante.</p></article>
          <article><span className="eyebrow">03 / Lote</span><h3>Dar seguimiento</h3><p>Conectar la presentación con su referencia de lote. Los códigos que ves hoy son únicamente de muestra.</p></article>
        </div>
      </section>
      <section className="traceability-section" aria-labelledby="traceability-title">
        <div><p className="eyebrow">03 / Lo que queremos hacer visible</p><h2 id="traceability-title">Principios de<br /><em>trazabilidad.</em></h2></div>
        <dl><div><dt>Composición legible</dt><dd>Ingredientes y contenido a la vista en cada ficha.</dd></div><div><dt>Referencias comprobables</dt><dd>Los datos reales deberán acompañarse de documentación antes de su publicación.</dd></div><div><dt>Transparencia primero</dt><dd>Sin atribuir efectos médicos ni convertir un ritual en una promesa.</dd></div></dl>
      </section>
      <aside className="editorial-disclaimer"><p>Contenido demostrativo. La información de producto y los textos comerciales requieren revisión profesional antes de una venta real. No es asesoría médica; consulta a un profesional de salud para decisiones de consumo.</p></aside>
      <Link className="button-primary" to="/tienda">Conoce las fórmulas <span aria-hidden="true">↗</span></Link>
    </div>
  );
}
