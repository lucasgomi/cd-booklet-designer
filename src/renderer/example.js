// Proyecto de ejemplo (genérico, con canciones inventadas). Las imágenes se dibujan al
// vuelo para no depender de archivos externos.
import { defaultState } from '../shared/model.js';
import { makeTrack, newId } from '../shared/tracklist.js';
import { parseDuration } from '../shared/time.js';
import { TEMPLATES } from '../shared/templates/index.js';

const TRACKS = `Amanecer – 3:02
Luces de Neón – 2:58
Carretera Secundaria – 3:21
Verano Eterno – 2:47
Nada Que Perder – 2:45
Ciudad Dormida – 3:32
Bailando Sola – 2:39
El Último Tren – 3:08
Papel Mojado – 2:51
Domingo por la Tarde – 3:17
Fuego Lento – 2:44
Marea Alta – 3:03
Desde la Azotea – 2:56
Kilómetro Cero – 3:09
Cometas – 2:22
Todo Irá Bien – 3:18
Lo Que Nunca Te Dije (Versión Acústica) – 3:25
Medianoche – 2:41
Volver a Empezar (Live at the Royal Albert Hall) – 4:06
Luces de Neón (Live at the Royal Albert Hall) – 3:14
Satélite – 2:49
Corazón de Cristal – 3:11
Ruido Blanco (Remix del Verano) – 3:42
Sin Prisa – 3:02
Despedida – 2:55
Hasta Mañana – 2:37`;

function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Cielo azul con nubes, 1600 × 400 px. */
export function drawSky(w = 1600, hgt = 420) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = hgt;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, hgt);
  grad.addColorStop(0, '#173d86');
  grad.addColorStop(0.55, '#2f63b3');
  grad.addColorStop(1, '#5b8fd3');
  g.fillStyle = grad;
  g.fillRect(0, 0, w, hgt);
  const rand = rng(7);
  const cloud = (cx, cy, size) => {
    for (let i = 0; i < 26; i += 1) {
      const x = cx + (rand() - 0.5) * size * 2.4;
      const y = cy + (rand() - 0.3) * size * 0.7;
      const r = size * (0.35 + rand() * 0.5);
      const rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, 'rgba(255,255,255,0.75)');
      rg.addColorStop(0.6, 'rgba(240,245,255,0.35)');
      rg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = rg;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
  };
  cloud(170, hgt * 0.95, 110);
  cloud(820, hgt * 1.0, 70);
  cloud(1300, hgt * 0.75, 150);
  cloud(1500, hgt * 0.95, 120);
  return c.toDataURL('image/jpeg', 0.9);
}

/** Sticker de ejemplo: un globo-estrella con transparencia. */
export function drawSticker(color = '#ff5f7e', points = 5) {
  const s = 600;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const g = c.getContext('2d');
  g.translate(s / 2, s / 2 - 30);
  g.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const r = i % 2 ? 110 : 240;
    const a = (i * Math.PI) / points - Math.PI / 2;
    g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  g.closePath();
  g.lineJoin = 'round';
  g.lineWidth = 40;
  g.strokeStyle = color;
  g.stroke();
  const grad = g.createRadialGradient(-70, -90, 10, 0, 0, 260);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.25, color);
  grad.addColorStop(1, color);
  g.fillStyle = grad;
  g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.9)';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(0, 240);
  g.bezierCurveTo(30, 270, -30, 300, 10, 320);
  g.stroke();
  return c.toDataURL('image/png');
}

/** Portada de ejemplo 1417 × 1417 px. */
export function drawCover() {
  const s = 1417;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, s, s);
  grad.addColorStop(0, '#f29c8f');
  grad.addColorStop(1, '#1f4a98');
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);
  g.fillStyle = 'rgba(255,255,255,0.92)';
  g.font = '800 220px Fraunces';
  g.textAlign = 'center';
  g.fillText('GRANDES', s / 2, s / 2 - 60);
  g.fillText('ÉXITOS', s / 2, s / 2 + 170);
  g.font = '500 70px Inter';
  g.fillText('ARTISTA DE EJEMPLO', s / 2, s / 2 + 300);
  return c.toDataURL('image/jpeg', 0.92);
}

export function exampleProject({ withCover = false } = {}) {
  const state = defaultState();
  state.disc = { ...state.disc, artist: 'Artista de Ejemplo', title: 'Grandes Éxitos', discNumber: '1', date: '2026' };
  state.tracks = TRACKS.split('\n').map((l) => {
    const [title, dur] = l.split(' – ');
    return makeTrack(title, parseDuration(dur));
  });
  for (const t of TEMPLATES) state.styles[t.id] = { ...t.defaults };
  const assets = {};
  const sky = newId('img');
  assets[sky] = drawSky();
  state.images.background = sky;
  const a = newId('img');
  const b = newId('img');
  assets[a] = drawSticker('#2bb3d9');
  assets[b] = drawSticker('#e2453c', 6);
  state.images.stickers = [
    { id: newId('st'), asset: a, name: 'globo-azul.png', x: 99, y: 11.5, w: 14, rot: -8, shadow: true, flip: false, opacity: 1 },
    { id: newId('st'), asset: b, name: 'globo-rojo.png', x: 112.5, y: 15, w: 10.5, rot: 10, shadow: true, flip: false, opacity: 1 },
  ];
  if (withCover) {
    const cov = newId('img');
    assets[cov] = drawCover();
    state.images.cover = cov;
  }
  return { state, assets };
}
