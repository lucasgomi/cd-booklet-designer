// Piezas de configuración compartidas entre plantillas.
import { TOTAL_FORMATS } from '../time.js';

/** Formato del total propio de la plantilla ('' = el elegido en «Disco»). */
export const TOTAL_FORMAT_CONTROL = {
  key: 'totalFormat',
  label: 'Formato del total ({total})',
  type: 'select',
  options: [{ value: '', label: 'Como en la pestaña «Disco»' }, ...TOTAL_FORMATS.map((f) => ({ value: f.id, label: f.label }))],
};
