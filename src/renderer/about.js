// Diálogo «Acerca de y licencias»: qué va dentro de la app y con qué licencia,
// y qué se puede hacer con las tipografías que se descargan.
import { h } from './ui.js';
import { THIRD_PARTY } from '../vendor/licenses.js';

let dlg = null;

const item = (n) => h('li', {},
  h('a', { href: n.url, target: '_blank', rel: 'noopener', text: n.name }),
  h('span', { class: 'muted', text: ` — ${n.license}` }));

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
    h('h3', { text: 'Tipografías que se descargan' }),
    h('p', { text: 'Las del explorador de tipografías vienen de Google Fonts, Fontshare (Indian Type Foundry) y Fontsource. '
      + 'Todas son libres: licencia SIL Open Font License, Apache 2.0, Ubuntu Font License, ITF Free Font License o similares. '
      + 'Se pueden usar gratis para diseñar e imprimir tus portadas, también si las vendes; lo único que no se permite es vender las propias tipografías. '
      + 'Cada una muestra su origen y su licencia en el explorador.' }),
    h('h3', { text: `Tipografías incluidas en la app (${fonts.length})` }),
    h('p', { class: 'help', text: 'Van dentro de la app para que funcione sin internet. Se redistribuyen con su licencia, como exige.' }),
    h('ul', { class: 'about-list' }, ...fonts.map(item)),
    h('h3', { text: 'Bibliotecas' }),
    h('ul', { class: 'about-list' }, ...libs.map(item),
      h('li', {}, h('a', { href: 'https://www.electronjs.org', target: '_blank', rel: 'noopener', text: 'Electron' }), h('span', { class: 'muted', text: ' — MIT (app de escritorio; su licencia y la de Chromium van en la carpeta de instalación)' }))),
    showFull, full,
    h('div', { class: 'toolbar about-actions' }, close));
  close.addEventListener('click', () => dlg.close());
  dlg.addEventListener('close', () => dlg.remove());
  document.body.appendChild(dlg);
  dlg.showModal();
}
