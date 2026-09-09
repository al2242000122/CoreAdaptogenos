import { Link } from 'react-router-dom';

const notes = [
  { number: '01', category: 'Tiempo', title: 'Una pausa que cabe en tu día', text: 'Una taza, una mesa despejada, unos minutos sin prisa. En este pequeño relato, el ritual no exige una rutina perfecta: comienza por prestar atención a un gesto cotidiano.', color: 'mineral' },
  { number: '02', category: 'Materia', title: 'Leer una fórmula, sin misterio', text: 'Imagina una etiqueta abierta como un cuaderno: ingredientes, formato, contenido y lote. Esta nota de muestra propone mirar esos detalles y preguntar por la información que falta.', color: 'lime' },
  { number: '03', category: 'Texturas', title: 'El cuaderno del cacao', text: 'Una escena inventada entre aromas y texturas: el sonido de una cuchara, una superficie oscura, una página por escribir. Un ejercicio editorial sobre los detalles de la mesa.', color: 'lavender' },
];

export function JournalPage() {
  return (
    <div className="journal-page">
      <header className="editorial-intro"><p className="eyebrow">Diario / Cuaderno de órbitas</p><h1>Hacer espacio<br />para <em>lo pequeño.</em></h1><p>Tres notas de muestra sobre tiempo, materia y texturas. Contenido editorial ficticio, sin recomendaciones de consumo ni afirmaciones médicas.</p></header>
      <section className="journal-grid" aria-label="Notas del diario">
        {notes.map((note) => <article className="journal-card" key={note.number}>
          <div className={`journal-cover journal-cover--${note.color}`} aria-hidden="true"><span>CUADERNO DE ÓRBITAS</span><i /><b>{note.number}</b></div>
          <p className="eyebrow">{note.category} / Artículo ficticio</p><h2>{note.title}</h2><p>{note.text}</p>
        </article>)}
      </section>
      <div className="journal-invitation"><p>Del cuaderno a tu próxima exploración.</p><Link className="text-link" to="/tienda">Volver a las fórmulas <span aria-hidden="true">↗</span></Link></div>
    </div>
  );
}
