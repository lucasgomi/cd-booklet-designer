// Pestaña «Imágenes»: fondo de cabecera y stickers PNG.
import { store, commit, addAsset } from '../store.js';
import { h, section, row, button, toggle, numberInput, opacityInput, pickImages, imageSize, toast } from '../ui.js';
import { newId } from '../../shared/tracklist.js';
import { getTemplate } from '../../shared/templates/index.js';

let selectedSticker = null;
export const getSelectedSticker = () => selectedSticker;
export function setSelectedSticker(id) { selectedSticker = id; }

function thumb(url) {
  return h('div', { class: 'thumb' }, url ? h('img', { src: url }) : h('span', { class: 'muted', text: 'Sin imagen' }));
}

export async function addStickers() {
  const files = await pickImages({ multiple: true, accept: 'image/png,image/webp,image/gif,image/*' });
  if (!files.length) return;
  const added = [];
  for (const f of files) {
    const id = newId('img');
    addAsset(id, f.url);
    const size = await imageSize(f.url);
    const ratio = size ? size.height / size.width : 1;
    const w = Math.min(30, 30 / Math.max(ratio, 1));
    added.push({ id: newId('st'), asset: id, name: f.name, x: 60 + added.length * 6, y: 40 + added.length * 6, w, rot: 0, shadow: true, flip: false, opacity: 1 });
  }
  commit((s) => { s.images.stickers.push(...added); }, { rebuild: 'images' });
  selectedSticker = added[added.length - 1].id;
  commit(() => {}, { rebuild: 'images' });
  toast('Arrastra el sticker en la vista previa; las esquinas escalan y el círculo de arriba rota.', 'info', 5000);
}

function stickerCard(st, i) {
  const set = (key, opts = {}) => (v) => commit((s) => { s.images.stickers[i][key] = v; }, { key: `st.${st.id}.${key}`, ...opts });
  const selected = selectedSticker === st.id;
  const card = h('div', { class: `sticker-card${selected ? ' selected' : ''}` },
    h('div', { class: 'sticker-head' },
      thumb(store.assets[st.asset]),
      h('div', { class: 'sticker-name' }, h('b', { text: st.name || `Sticker ${i + 1}` }), h('small', { class: 'muted', text: `${st.w.toFixed(1)} mm · ${Math.round(st.rot)}°` })),
      button('↑', () => commit((s) => { const a = s.images.stickers; if (i < a.length - 1) [a[i], a[i + 1]] = [a[i + 1], a[i]]; }, { rebuild: 'images' }), { class: 'icon', title: 'Traer adelante' }),
      button('↓', () => commit((s) => { const a = s.images.stickers; if (i > 0) [a[i], a[i - 1]] = [a[i - 1], a[i]]; }, { rebuild: 'images' }), { class: 'icon', title: 'Enviar atrás' }),
      button('⧉', () => {
        const copy = { ...st, id: newId('st'), x: st.x + 5, y: st.y + 5 };
        commit((s) => { s.images.stickers.splice(i + 1, 0, copy); }, { rebuild: 'images' });
      }, { class: 'icon', title: 'Duplicar' }),
      button('✕', () => commit((s) => { s.images.stickers.splice(i, 1); }, { rebuild: 'images' }), { class: 'icon danger', title: 'Quitar' })));
  card.addEventListener('click', (e) => {
    if (e.target.closest('button, input, label')) return;
    selectedSticker = st.id;
    commit(() => {}, { rebuild: 'images' });
  });
  if (selected) {
    card.appendChild(h('div', { class: 'fields' },
      row('Posición X', numberInput(+st.x.toFixed(1), { min: -20, max: 260, step: 0.5, unit: 'mm' }, set('x')), { half: true }),
      row('Posición Y', numberInput(+st.y.toFixed(1), { min: -20, max: 140, step: 0.5, unit: 'mm' }, set('y')), { half: true }),
      row('Ancho', numberInput(+st.w.toFixed(1), { min: 2, max: 240, step: 0.5, unit: 'mm' }, set('w'))),
      row('Rotación', numberInput(Math.round(st.rot), { min: -180, max: 180, step: 1, unit: '°' }, set('rot'))),
      row('Opacidad', opacityInput(st.opacity ?? 1, set('opacity'))),
      h('div', { class: 'field' }, toggle(st.shadow, set('shadow', { rebuild: 'images' }), 'Sombra')),
      st.shadow ? row('Desenfoque de la sombra', numberInput(st.shadowBlur ?? 1.2, { min: 0, max: 6, step: 0.1, unit: 'mm' }, set('shadowBlur'))) : null,
      st.shadow ? row('Intensidad de la sombra', opacityInput(st.shadowOpacity ?? 0.35, set('shadowOpacity'))) : null,
      h('div', { class: 'field' }, toggle(st.flip, set('flip'), 'Voltear horizontalmente'))));
  }
  return card;
}

export function renderImagesPanel(root) {
  const { state, assets } = store;
  const tplName = getTemplate(state.templateId).id === 'ticket' ? 'Fondo detrás del ticket' : 'Fondo de la cabecera';
  root.replaceChildren();
  root.appendChild(section('Imagen de fondo',
    h('p', { class: 'help', text: `${tplName}. Se recorta para cubrir el área; el encuadre y el zoom se ajustan en «Diseño».` }),
    h('div', { class: 'image-pick' }, thumb(assets[state.images.background]),
      h('div', { class: 'toolbar col' },
        button(state.images.background ? 'Cambiar imagen…' : 'Subir imagen…', async () => {
          const [f] = await pickImages();
          if (!f) return;
          const id = newId('img');
          addAsset(id, f.url);
          commit((s) => { s.images.background = id; }, { rebuild: 'images' });
        }),
        state.images.background ? button('Quitar', () => commit((s) => { s.images.background = null; }, { rebuild: 'images' }), { class: 'danger' }) : null))));

  root.appendChild(section('Stickers (PNG con transparencia)',
    h('p', { class: 'help', text: 'Colócalos libremente: arrastra para mover, esquina inferior derecha para escalar, círculo superior para rotar. Supr borra el seleccionado; las flechas lo mueven 0,5 mm (con Mayús, 5 mm).' }),
    h('div', { class: 'toolbar' }, button('+ Añadir stickers…', addStickers, { class: 'primary' })),
    ...state.images.stickers.map((st, i) => stickerCard(st, i)).reverse()));
}
