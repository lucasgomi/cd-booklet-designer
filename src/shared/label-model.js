// Modelo de la pegatina del CD: fondo, centro, textos libres o en curva y
// lista de canciones. Va dentro del proyecto (state.label).

let textCounter = 0;
const textId = () => `lt${Date.now().toString(36)}${(textCounter += 1).toString(36)}`;

/** Un texto de la pegatina. path: top | bottom (en curva) | free (recto, se mueve). */
export function newLabelText(over = {}) {
  return {
    id: textId(),
    text: '{titulo}',
    path: 'free',
    font: '',            // '' = la del título de la plantilla
    weight: 800,
    italic: false,
    size: 14,            // pt
    color: '#FFFFFF',
    outline: true,
    outlineColor: '#000000',
    outlineWidth: 0.16,  // proporción del tamaño de letra
    spacing: 0.04,       // em
    uppercase: false,
    offset: 4.5,         // en curva: distancia al borde (mm)
    angle: 0,            // giro (grados)
    x: 0,                // recto: desde el centro (mm)
    y: -32,
    align: 'center',
    opacity: 1,
    ...over,
  };
}

export function defaultLabel() {
  return {
    v: 2,
    background: 'cover', // cover (si no hay, template) | template | image | color | gradient | cdr | vinyl
    color: '#111111',
    color2: '#FF3EA5',
    gradient: 'linear',  // linear | radial | conic
    angle: 135,
    image: null,         // id de asset (imagen propia)
    imageScale: 1,
    imageX: 0,
    imageY: 0,
    dim: 0,
    hub: { show: false, color: '#FFFFFF', size: 46, border: 0, borderColor: '#000000' },
    edge: { show: false, color: '#FFFFFF', width: 0.6, inset: 2.5 },
    texts: [
      newLabelText({ text: '{titulo}', path: 'top', size: 13 }),
      newLabelText({ text: '{artista}', path: 'bottom', size: 13 }),
    ],
    list: { show: false, place: 'sides', font: '', weight: 600, size: 5.5, color: '#FFFFFF', durations: false, outline: true, outlineColor: '#000000' },
  };
}

/** Completa lo que falte y convierte las pegatinas de la versión anterior. */
export function normalizeLabel(l) {
  const base = defaultLabel();
  if (!l) return base;
  if (!l.v) {
    // v1: dos textos fijos (arriba/abajo) y la lista como «distribución».
    const common = {
      font: l.font || '', weight: l.weight ?? 800, size: l.size ?? 13, color: l.textColor || '#FFFFFF',
      outline: l.outline !== false, outlineColor: l.outlineColor || '#000000',
    };
    const texts = l.layout === 'none' ? [] : [
      l.topText ? newLabelText({ ...common, text: l.topText, path: 'top' }) : null,
      l.bottomText ? newLabelText({ ...common, text: l.bottomText, path: 'bottom' }) : null,
    ].filter(Boolean);
    return {
      ...base, background: l.background || base.background, color: l.color || base.color, dim: l.dim || 0, texts,
      list: { ...base.list, show: l.layout === 'list', size: l.listSize || base.list.size, font: l.font || '', color: common.color, outline: common.outline, outlineColor: common.outlineColor },
    };
  }
  return {
    ...base, ...l,
    hub: { ...base.hub, ...(l.hub || {}) },
    edge: { ...base.edge, ...(l.edge || {}) },
    list: { ...base.list, ...(l.list || {}) },
    texts: (Array.isArray(l.texts) ? l.texts : base.texts).map((t) => newLabelText({ ...t, id: t.id || textId() })),
  };
}

/** Estilos rápidos: puntos de partida que luego se retocan. */
export const LABEL_PRESETS = [
  {
    id: 'portada', name: 'Portada',
    make: () => ({ background: 'cover', dim: 0.15, texts: [
      newLabelText({ text: '{titulo}', path: 'top', size: 13 }),
      newLabelText({ text: '{artista}', path: 'bottom', size: 12, weight: 600 }),
    ] }),
  },
  {
    id: 'cdr', name: 'CD-R a rotulador',
    make: () => ({ background: 'cdr', dim: 0, hub: { show: true, color: '#E9ECF1', size: 44, border: 0.5, borderColor: '#B7BEC9' }, texts: [
      newLabelText({ text: '{titulo}', font: 'Permanent Marker', weight: 400, size: 22, color: '#111111', outline: false, x: 0, y: -33, angle: -5 }),
      newLabelText({ text: '{artista}', font: 'Permanent Marker', weight: 400, size: 13, color: '#111111', outline: false, x: 2, y: 33, angle: -3 }),
      newLabelText({ text: '[{fecha}]', font: 'Rock Salt', weight: 400, size: 7, color: '#1F3FB8', outline: false, x: 30, y: 44, angle: -8 }),
    ] }),
  },
  {
    id: 'vinilo', name: 'Vinilo',
    make: () => ({ background: 'vinyl', dim: 0, hub: { show: true, color: '#E63946', size: 62, border: 0, borderColor: '#000000' }, texts: [
      newLabelText({ text: '{titulo}', font: 'Montserrat', weight: 800, size: 9, color: '#FFFFFF', outline: false, uppercase: true, spacing: 0.12, x: 0, y: -25.5 }),
      newLabelText({ text: '{artista}', font: 'Montserrat', weight: 500, size: 6.5, color: '#FFFFFF', outline: false, x: 0, y: 25.5 }),
    ], list: { show: true, place: 'ring', font: 'Montserrat', weight: 500, size: 5.5, color: '#C8C8C8', durations: false, outline: false, outlineColor: '#000000' } }),
  },
  {
    id: 'degradado', name: 'Degradado',
    make: () => ({ background: 'gradient', gradient: 'linear', angle: 135, color: '#FF5E8A', color2: '#5B2BFF', dim: 0, texts: [
      newLabelText({ text: '{titulo}', font: 'Unbounded', weight: 700, size: 24, outline: false, x: 0, y: -33, uppercase: true }),
      newLabelText({ text: '{artista}', path: 'bottom', font: 'Unbounded', weight: 400, size: 9, outline: false, spacing: 0.2, uppercase: true }),
    ] }),
  },
  {
    id: 'minimal', name: 'Minimal',
    make: () => ({ background: 'color', color: '#F4F1EA', dim: 0, edge: { show: true, color: '#1A1A1A', width: 0.35, inset: 3.5 }, texts: [
      newLabelText({ text: '{titulo}', path: 'top', font: 'Inter', weight: 600, size: 8, color: '#1A1A1A', outline: false, spacing: 0.45, uppercase: true, offset: 7 }),
      newLabelText({ text: '{artista} · {pistas} temas · {total}', path: 'bottom', font: 'Inter', weight: 400, size: 6.5, color: '#1A1A1A', outline: false, spacing: 0.25, uppercase: true, offset: 7 }),
    ] }),
  },
  {
    id: 'anillo', name: 'Lista en anillo',
    make: () => ({ background: 'cover', dim: 0.45, texts: [
      newLabelText({ text: '{titulo}', path: 'top', size: 14 }),
      newLabelText({ text: '{artista}', path: 'bottom', size: 10, weight: 600 }),
    ], list: { show: true, place: 'ring', font: '', weight: 600, size: 6, color: '#FFFFFF', durations: false, outline: true, outlineColor: '#000000' } }),
  },
  {
    id: 'plantilla', name: 'Estilo de la plantilla',
    make: () => ({ background: 'template', dim: 0, texts: [
      newLabelText({ text: '{titulo}', path: 'top', size: 13 }),
      newLabelText({ text: '{artista}', path: 'bottom', size: 12 }),
    ] }),
  },
];

/** Aplica un estilo rápido conservando la imagen propia. */
export function applyLabelPreset(label, id) {
  const p = LABEL_PRESETS.find((x) => x.id === id);
  if (!p) return label;
  const base = defaultLabel();
  const made = p.make();
  return normalizeLabel({
    ...base, image: label.image, imageScale: label.imageScale, imageX: label.imageX, imageY: label.imageY, ...made,
    hub: { ...base.hub, ...(made.hub || {}) }, edge: { ...base.edge, ...(made.edge || {}) }, list: { ...base.list, ...(made.list || {}) },
  });
}
