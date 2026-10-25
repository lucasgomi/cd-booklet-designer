# CD Booklet Designer

Aplicación de escritorio para Windows para diseñar e imprimir el librito
interior de las cajas de CD slim: **120 × 120 mm**, o **240 × 120 mm** si
va doblado con la portada al lado. Funciona como un editor de plantillas:
rellenas los campos, subes imágenes y eliges colores, y ves el resultado en
vivo. Lo que ves en la vista previa es exactamente lo que se exporta: el
editor, el PDF y el PNG usan el mismo motor de maquetación.

## Instalar

En la página de *Releases* del repositorio (etiquetas `v*`) hay dos
ejecutables:

- `CD-Booklet-Designer-Setup-x.y.z.exe`: instalador normal, que asocia los
  archivos `.cdbook` a la aplicación.
- `CD-Booklet-Designer-Portable-x.y.z.exe`: no necesita instalación.

Al abrir la app por primera vez se carga un proyecto de ejemplo para que
veas cómo funciona.

## Qué hace

**Datos del disco** (pestaña *Disco*)
- Artista, título del recopilatorio, número de disco y fecha. Cada uno tiene
  un interruptor para mostrarlo u ocultarlo.
- Cuenta las pistas y calcula la duración total. El formato del total se
  elige en la lista: `1 H 16 MIN`, `1H 16MIN`, `76 MIN`, `76:06`,
  `1:16:06`…
- Avisa si el total supera los 80 minutos de un CD.

**Canciones**
- Cada canción tiene número, título, versión abreviada opcional, duración
  (m:ss) y grupo.
- *Pegar lista…*: una canción por línea. Acepta `Título – 3:04`,
  `1. Título 3:04`, `Título (3:04)`, etc.
- *Importar .cue…*: lee títulos, intérpretes, fecha y duraciones. La
  duración de la última pista se calcula leyendo el `.flac` o el `.wav`
  que acompaña al `.cue`.
- Para reordenar, arrastra las filas por el asa `⋮⋮`.
- Grupos: activa *Colorear los números según el grupo* y elige un color
  para cada grupo (por ejemplo, el álbum de origen).

**Plantillas** (pestaña *Plantilla*: galería con miniaturas en vivo hechas
con tus datos, estilos de un clic y botón «Sorpréndeme»; los ajustes finos
están en *Diseño*)
1. **Cabecera + lista**: cabecera con imagen de fondo, título y línea de
   datos. Debajo, la lista en una columna con filas alternas resaltadas y
   barra vertical opcional.
2. **Ticket**: la lista como un ticket de compra, en letra monoespaciada,
   con separadores, puntitos de relleno y total. Todos los textos del
   ticket son editables: cabeceras de columna, líneas de datos, pie, texto
   libre y despedida. Abajo puede llevar un código de barras decorativo,
   un Code 128 real (escaneable), un código QR o nada.
3. **Dos columnas**: cabecera tipográfica con filete y la lista repartida en
   dos columnas. Va bien con listas largas.
4. **Setlist**: la hoja de setlist pegada en el escenario, con papel girado,
   cinta adhesiva, líneas de cuaderno y letras grandes.
5. **Cartel**: como el cartel de un festival, con degradado y las canciones
   seguidas en un párrafo centrado, separadas por un símbolo.
6. **Terminal**: pantalla de fósforo con la lista como archivos, resplandor,
   líneas de barrido y cursor.

Estética *white girl music*:

7. **Notas del móvil**: la lista apuntada en la app de notas, con casillas
   (algunas marcadas, si quieres), fecha y barra superior.
8. **Coquette**: tarjeta rosa con borde festoneado, perlas, lazo y título
   caligráfico. Los números van en romanos y la lista en cursiva.
9. **Verde ácido**: un color chillón y letra tipo Arial en minúsculas,
   estrechada y un poco borrosa.
10. **Índice**: como el índice de una novela, con capítulos en romanos,
    puntos hasta la «página» (la duración), papel con grano y una foto
    opcional en blanco y negro.
11. **Playlist**: pantalla de playlist con portada, botón de reproducir y
    canciones. Si rellenas el campo «Grupo» de cada canción (por ejemplo,
    con el artista), aparece junto al título.

Objetos dibujados:

12. **Y2K holográfico** (en *white girl music*): fondo iridiscente con
    destellos, título cromado y la lista en un panel de cristal con números
    en burbujas.
13. **Vinilo**: la funda con el vinilo asomando (surcos, brillo y etiqueta) y
    la lista en Cara A / Cara B.
14. **Casete**: una cinta con la etiqueta escrita a mano, bobinas y ventana, y
    la lista por caras.
15. **Polaroid**: página de álbum de recortes, con una polaroid de tu foto,
    cinta washi, dibujitos y la lista en una hoja de cuaderno arrancada.

Más estéticas:

16. **Fanzine**: fotocopia punk con el título en letras recortadas de revista,
    máquina de escribir, cinta adhesiva y tachones.
17. **Brutalista**: retícula de bordes gruesos, letra enorme y un bloque de color.
18. **Art déco**: negro y oro, abanico de rayos y marco escalonado.
19. **Synthwave**: sol a rayas, cuadrícula de neón y letras luminosas.
20. **Bauhaus**: círculos, triángulos y colores primarios.
21. **Periódico**: portada de diario con cabecera, titular, foto y tres columnas.
22. **Tarjeta de embarque**: billete de avión con origen, destino e itinerario.
23. **8 bits**: pantalla de consola portátil con letra de píxeles.
24. **Postal**: «Saludos desde…» con letras rellenas de foto, sello y matasellos.
25. **Carta de restaurante**: entrantes, principales y postres; la duración es el
    precio.

Cada plantilla trae **estilos incluidos**: combinaciones de colores y
letras que se aplican con un clic y se deshacen con Ctrl+Z.

Todo lo visual se ajusta desde la interfaz:
- colores, con selector y campo hexadecimal;
- tipografías de título y de lista, con grosor y tamaño. Se incluyen 28
  familias de Google Fonts (con cursivas, manuscritas y de píxeles) que funcionan sin conexión, y se puede añadir
  cualquier otra por su nombre (necesita Internet);
- textos;
- márgenes, alto de la cabecera y altura de fila.

Los textos admiten campos: `{artista}`, `{titulo}`, `{disco}`, `{fecha}`,
`{pistas}` y `{total}`. Lo que va entre `[corchetes]` se oculta si alguno
de sus campos está vacío u oculto. Por ejemplo, con
`HITS[ · Nº {disco}]`, si el número de disco está oculto solo se ve `HITS`.

*Mis plantillas* guarda tus ajustes visuales para reutilizarlos en otros
discos. También se pueden exportar e importar como archivo
`.cdtemplate`.

**Imágenes**
- Imagen de fondo de la cabecera, o del fondo del ticket, con encuadre y
  zoom.
- Stickers PNG con transparencia. Se colocan con el ratón: arrastra para
  moverlos, usa la esquina para escalarlos y el círculo superior para
  rotarlos (con Mayús, en saltos de 15°). Cada uno puede llevar sombra,
  opacidad y volteo. Las flechas los mueven y Supr los borra.

**Ayudas de diseño**
- Margen de seguridad de 5 mm visible en el editor. No se imprime.
- Todos los títulos se pintan al mismo tamaño. Si alguno no cabe, la app
  avisa y propone una versión abreviada, por ejemplo «(Live at NPR Music's
  Tiny Desk)» → «(Tiny Desk)». No encoge la letra solo en esa fila.
- Las duraciones usan cifras de ancho fijo para que queden alineadas.
- Avisa si la lista no cabe en la página.

**Librito completo e impresión** (pestaña *Librito*)
- Modo librito: monta la portada (120 × 120 mm) junto a la lista en una
  hoja de 240 × 120 mm.
- **Exportar PDF**: A4 apaisado a tamaño real, con marcas de corte en las
  esquinas, marca de doblez en el centro y una regla de control de 50 mm.
  El texto queda vectorial y las fuentes van incrustadas.
- **Exportar PNG**: 300 ppp (1417 × 1417 o 2835 × 1417 px).
- ⚠ **Imprime al 100 % / tamaño real.** Nunca uses «Ajustar a la página».

**Arrastrar y soltar**
- Imágenes sobre la ventana: se añaden como stickers.
- Un `.cue`: importa las canciones.
- Un `.cdbook`: abre el proyecto.

**Guardado**
- Los proyectos `.cdbook` guardan los datos, los ajustes y las imágenes en
  un solo archivo.
- Deshacer y rehacer con Ctrl+Z y Ctrl+Y.

## Actualizaciones automáticas

La versión instalada (`Setup`) busca versiones nuevas en las releases de
GitHub al arrancar y cada 4 horas. Si hay una nueva, la descarga en segundo
plano y se instala sola al cerrar la app; también puedes pulsar «Reiniciar y
actualizar». La portable no puede sustituirse a sí misma: avisa y ofrece el
enlace de descarga. En el menú *Ayuda* está «Buscar actualizaciones…».

Para que funcione, el repositorio tiene que ser **público**: la app lee las
releases sin iniciar sesión.

Para publicar una versión nueva: **Actions → CD Booklet Designer → Run
workflow** y escribe la versión (por ejemplo `v1.2.0`). El flujo compila en
Windows, pone ese número de versión y sube los `.exe`, `latest.yml` y los
`.blockmap` que usa el actualizador.

## Desarrollo

Necesitas Node.js 20 o posterior.

```bash
npm install        # también prepara tipografías y librerías en src/vendor
npm start          # abre la app
npm test           # pruebas unitarias
npm run smoke      # prueba de la app completa: capturas, PDF y PNG en smoke-out/
npm run dist:win   # instalador y portable para Windows en dist/
```

### Estructura

```
src/main/        proceso principal de Electron (archivos, exportación, .cue)
src/renderer/    interfaz del editor (paneles, vista previa, stickers)
src/print/       página que se usa para generar el PDF y el PNG
src/shared/      motor común: modelo, maquetación, textos, códigos
src/shared/templates/   una plantilla por archivo
```

### Añadir una plantilla nueva

1. Crea `src/shared/templates/mi-plantilla.js` exportando un objeto con:
   - `id`, `name` y `description`;
   - `defaults`: los valores iniciales de sus ajustes;
   - `presets` (opcional): estilos de un clic, `[{ name, style }]`;
   - `category` (opcional): el grupo en el que aparece en la interfaz;
   - `controls`: las secciones y controles del panel de ajustes, con tipos
     `color`, `opacity`, `number`, `font`, `toggle`, `text`, `textarea` y
     `select`. La interfaz se genera sola a partir de ellos;
   - `render(ctx)`: devuelve el elemento del panel de 120 × 120 mm. `ctx`
     trae `style`, `tracks` (ya numeradas y formateadas), `values` (los
     campos `{…}`), `asset()` para las imágenes y `h()` para crear
     elementos. Marca los títulos con la clase `fit` y la lista con
     `fit-v` para recibir los avisos de «no cabe».
2. Regístrala en `src/shared/templates/index.js`.

Para ver un ejemplo, consulta `header-list.js` y `ticket.js`.
