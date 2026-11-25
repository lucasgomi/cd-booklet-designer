// Diálogo «Acerca de y licencias»: qué va dentro de la app y con qué licencia,
// y qué se puede hacer con las tipografías que se descargan.
import { h } from './ui.js';
import { THIRD_PARTY } from '../vendor/licenses.js';

let dlg = null;

export async function openAbout() {
  dlg?.remove();
  const version = await window.api.appVersion().catch(() => '');
  const fonts = THIRD_PARTY.filter((n) => n.kind === 'font');
  const libs = THIRD_PARTY.filter((n) => n.kind === 'lib');
  const full = h('pre', { class: 'about-text', hidden: true });
  const showFull = h('button', { type: 'button', text: 'Ver los textos completos de las licencias' });
  showFull.addEventListener('click', async () => {
    const { THIRD_PARTY_TEXT } = await import('../vendor/licenses-text.js');
    full.textContent = THIRD_PARTY_TEXT;
    full.hidden = false;
    showFull.remove();
  });
  const close = h('button', { type: 'button', class: 'primary', text: 'Cerrar' });
  dlg = h('dialog', { class: 'about' },
    h('h2', { text: `CD Booklet Designer ${version}` }),
    h('p', { text: 'Para diseñar e imprimir libritos y pegatinas de CD. Proyecto personal y gratuito: ' },
      h('a', { href: 'https://github.com/lucasgomi/cd-booklet-designer', target: '_blank', rel: 'noopener', text: 'github.com/lucasgomi/cd-booklet-designer' })),
    h('p', { text: 'Código propio con licencia MIT.' }),
    h('h3', { text: 'Tipografías' }),
    h('p', { text: `Incluidas en la app: ${fonts.length} tipografías libres (${fonts.filter((n) => /OFL/.test(n.license)).length} con licencia SIL Open Font License y ${fonts.filter((n) => !/OFL/.test(n.license)).length} con Apache 2.0), que se redistribuyen con su licencia. `
      + 'Las que se descargan al elegirlas (Google Fonts, Fontshare y Fontsource) también son libres: se pueden usar gratis para diseñar e imprimir tus portadas, aunque las vendas; lo único que no se permite es vender las tipografías. El explorador muestra el origen y la licencia de cada una.' }),
    h('h3', { text: 'Bibliotecas' }),
    h('p', {}, ...libs.flatMap((n, i) => [i ? ', ' : '', h('a', { href: n.url, target: '_blank', rel: 'noopener', text: n.name }), ` (${n.license})`]),
      ' y ', h('a', { href: 'https://www.electronjs.org', target: '_blank', rel: 'noopener', text: 'Electron' }), ' (MIT, en la app de escritorio).'),
    h('p', {}, h('a', { href: 'https://github.com/lucasgomi/cd-booklet-designer/blob/main/THIRD-PARTY-NOTICES.md', target: '_blank', rel: 'noopener', text: 'Lista completa de avisos de terceros' })),
    showFull, full,
    h('div', { class: 'toolbar about-actions' }, close));
  close.addEventListener('click', () => dlg.close());
  dlg.addEventListener('close', () => dlg.remove());
  document.body.appendChild(dlg);
  dlg.showModal();
}
