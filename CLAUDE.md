# CD Booklet Designer: notas para trabajar en el proyecto

App para diseñar e imprimir libritos y pegatinas de CD. Hay **dos versiones
de la misma app**, y las dos son igual de importantes:

- **Escritorio (Windows)**: Electron. Su código está en `src/main` (proceso
  principal) y `src/main/preload.cjs` (puente `window.api`).
- **Web**: GitHub Pages, https://lucasgomi.github.io/cd-booklet-designer/.
  Usa los mismos archivos de `src/renderer`, `src/shared` y `src/print`. El
  puente `window.api` lo implementa `src/web/api.js` con lo que ofrece el
  navegador.

## Reglas

1. **Todo lo nuevo tiene que funcionar en las dos versiones.**
   - Si añades un método a `window.api` (`preload.cjs` + `ipcMain` en
     `main.js`), añade también su versión en `src/web/api.js`.
   - Guardar y abrir van por descarga o por la API de archivos, el PDF por
     el diálogo de imprimir y el PNG por html-to-image.
2. **La web tiene que ir bien en el móvil.**
   - Las reglas de pantalla estrecha están en el bloque
     `@media (max-width: 820px)` de `src/renderer/app.css`.
   - Nada puede desbordar a lo ancho, los controles deben ser cómodos para
     el dedo y los arrastres usan eventos `pointer`.
   - Pruébalo con Playwright en un móvil emulado (`devices['iPhone 13']`).
3. **Escritorio y web salen juntos.**
   - Una release se lanza con el workflow `build.yml` (workflow_dispatch
     sobre `main`, con el input `release`, por ejemplo `v1.8.0`). En una
     sola ejecución:
     1. Compila los `.exe` y crea la release con `latest.yml` (la usa la
        actualización automática).
     2. Publica la web con la misma versión.
   - No publiques la web sola salvo para arreglar un despliegue (`pages.yml`,
     manual).
   - Cada versión de la web va en su propia carpeta (`/v1.8.0/…`), y la raíz
     solo redirige. Así el navegador no mezcla archivos en caché de
     versiones distintas: no lo cambies.
   - Desde Claude Code: `gh api -X POST repos/lucasgomi/cd-booklet-designer/actions/workflows/build.yml/dispatches -f ref=main -f 'inputs[release]=vX.Y.Z'`.
4. **Textos de ejemplo genéricos.** El proyecto de ejemplo
   (`src/renderer/example.js`) y los textos de muestra usan nombres
   inventados («Artista de Ejemplo», «Grandes Éxitos»), nunca artistas
   reales.
5. **Interfaz, comentarios y commits en español.**

## Comprobar antes de subir

- `npm test`: tests unitarios de `src/shared`.
- `npm run smoke`: recorre la app de escritorio con xvfb, hace capturas y
  exporta PDF y PNG. Salida en `smoke-out/` y `report.json`.
  - `CDBOOK_SMOKE_ONLY=id1,id2` prueba solo esas plantillas.
  - `CDBOOK_SMOKE_LONG=45` prueba un disco largo en todas.
- Web: ejecuta `npm run build:web` y sirve `dist-web/`
  (`python3 -m http.server`). Ábrela con Playwright en escritorio y en
  móvil: sin errores de consola, que exporte el PNG y que no haya scroll
  horizontal.

## Piezas principales

- **Plantillas del librito**: `src/shared/templates/*.js`, registradas en
  `index.js` y en la lista `ids` de `src/renderer/smoke.js`.
  - Medidas en mm.
  - Títulos con `fitTitle` y listas con `fitList`/`rowSizing`, para el
    ajuste automático.
  - Adornos con `deco()` y declarados en `decorations`.
- **Pegatina del CD**:
  - Modelo: `src/shared/label-model.js`.
  - Dibujo y hojas de etiquetas: `src/shared/disc-label.js`.
  - Pestaña: `src/renderer/panels/label.js`.
- **Tipografías**:
  - Las incluidas sin conexión se copian a `src/vendor` con
    `scripts/prepare-vendor.js`, que se ejecuta en `postinstall`.
  - El catálogo de Google Fonts se regenera con
    `node scripts/build-font-catalog.js`.
  - El selector está en `src/renderer/fontpicker.js`.
