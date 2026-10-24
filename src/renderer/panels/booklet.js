// Pestaña «Librito»: portada, montaje 240 × 120 y exportación.
import { store, commit, addAsset } from '../store.js';
import { h, section, row, button, toggle, select, pickImages, imageSize, toast } from '../ui.js';
import { newId } from '../../shared/tracklist.js';

export function renderBookletPanel(root, { exportPdf, exportPng }) {
  const { state, assets } = store;
  const b = state.booklet;
  root.replaceChildren();
  root.appendChild(section('Modo librito',
    h('div', { class: 'field' }, toggle(b.enabled, (v) => commit((s) => { s.booklet.enabled = v; }, { rebuild: 'booklet' }), 'Montar portada + lista en una hoja de 240 × 120 mm')),
    h('p', { class: 'help', text: b.enabled
      ? 'La hoja se imprime por una cara y se dobla por la mitad con lo impreso hacia fuera.'
      : 'Sin modo librito se imprime sólo la lista (120 × 120 mm).' }),
    b.enabled ? row('Lado de la portada', select(b.coverSide, [
      { value: 'right', label: 'Derecha (portada delante al doblar)' },
      { value: 'left', label: 'Izquierda' }], (v) => commit((s) => { s.booklet.coverSide = v; }, { rebuild: 'booklet' }))) : null,
    b.enabled ? h('div', { class: 'image-pick' },
      h('div', { class: 'thumb square' }, assets[state.images.cover] ? h('img', { src: assets[state.images.cover] }) : h('span', { class: 'muted', text: 'Portada' })),
      h('div', { class: 'toolbar col' },
        button(state.images.cover ? 'Cambiar portada…' : 'Subir portada (120 × 120 mm)…', async () => {
          const [f] = await pickImages();
          if (!f) return;
          const size = await imageSize(f.url);
          const id = newId('img');
          addAsset(id, f.url);
          commit((s) => { s.images.cover = id; }, { rebuild: 'booklet' });
          if (size && Math.min(size.width, size.height) < 1000) {
            toast(`La portada mide ${size.width} × ${size.height} px: para 300 ppp lo ideal son 1417 × 1417 px. Puede verse pixelada.`, 'warn', 7000);
          } else if (size && Math.abs(size.width / size.height - 1) > 0.03) {
            toast('La portada no es cuadrada: se recortará por los lados para llenar 120 × 120 mm.', 'warn', 6000);
          }
        }),
        state.images.cover ? button('Quitar', () => commit((s) => { s.images.cover = null; }, { rebuild: 'booklet' }), { class: 'danger' }) : null)) : null));

  root.appendChild(section('Exportar e imprimir',
    h('div', { class: 'print-box' },
      h('b', { text: '⚠ Imprimir al 100 % / tamaño real' }),
      h('p', { text: 'En el diálogo de impresión elige «Tamaño real» o «Escala 100 %». Nunca «Ajustar a la página»: el librito saldría más pequeño y no encajaría en la caja. Comprueba con una regla que la barra de control del PDF mide 50 mm.' })),
    h('div', { class: 'toolbar' },
      button('Exportar PDF (A4 apaisado)…', exportPdf, { class: 'primary' }),
      button('Exportar PNG (300 ppp)…', exportPng)),
    h('ul', { class: 'help list' },
      h('li', { text: 'PDF: hoja A4 apaisada a tamaño real con marcas de corte en las esquinas' + (b.enabled ? ' y marca de doblez en el centro.' : '.') }),
      h('li', { text: `PNG: sólo la hoja, ${b.enabled ? '2835 × 1417' : '1417 × 1417'} píxeles (300 ppp).` }),
      h('li', { text: 'El margen de seguridad y las guías del editor no se imprimen.' }))));
}
