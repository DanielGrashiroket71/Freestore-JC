/**
 * FreeStore Server - Compatible con cualquier Node.js 14+
 * Sin dependencias externas - almacenamiento en JSON
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
const APKS_DIR = path.join(UPLOADS_DIR, 'apks');
const ICONS_DIR = path.join(UPLOADS_DIR, 'icons');
const DATA_FILE = path.join(__dirname, 'data', 'db.json');

// Crear directorios si no existen
[PUBLIC_DIR, UPLOADS_DIR, APKS_DIR, ICONS_DIR, path.join(__dirname, 'data')].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ─── BASE DE DATOS EN JSON ────────────────────────
function loadDB() {
  if (!fs.existsSync(DATA_FILE)) return { apps: [], ratings: [] };
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return { apps: [], ratings: [] }; }
}

function saveDB(db) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

// Cargar o crear DB con datos de ejemplo
let DB = loadDB();

if (DB.apps.length === 0) {
  const SEED = [
    { name:'TurboLauncher Pro', developer:'@turbodev_community', icon_emoji:'🚀', description:'El launcher más rápido y personalizable. Temas, widgets, gestos avanzados, gestión de apps mejorada y soporte multi-perfil.', category:'utilidades', version:'3.1.2', android_min:'7.0+', size_bytes:19292160, downloads:48234, rating_sum:39.2, rating_count:8, featured:true },
    { name:'PixelCraft Studio', developer:'@pixelart_libre', icon_emoji:'🎨', description:'Crea pixel art y sprites en tu móvil. Exporta en PNG, GIF animado o spritesheet. Perfecto para game devs y artistas.', category:'multimedia', version:'2.0.5', android_min:'8.0+', size_bytes:12697600, downloads:23100, rating_sum:23.5, rating_count:5, featured:false },
    { name:'NetShield VPN', developer:'@opensec_dev', icon_emoji:'🛡️', description:'VPN de código abierto, sin logs, sin límites de velocidad ni datos. Tu privacidad, tu control total. WireGuard integrado.', category:'seguridad', version:'1.9.0', android_min:'6.0+', size_bytes:9121792, downloads:91400, rating_sum:48.0, rating_count:10, featured:true },
    { name:'RetroEmul 64', developer:'@retrodev_labs', icon_emoji:'🎮', description:'Emulador multicore para SNES, GBA, NES, N64 y más. Compatible con ROMs, savestates y mandos Bluetooth.', category:'juegos', version:'5.2.1', android_min:'8.0+', size_bytes:36175872, downloads:67800, rating_sum:41.4, rating_count:9, featured:false },
    { name:'MusicFlow', developer:'@audiodev_free', icon_emoji:'🎵', description:'Reproductor de música con ecualizador de 10 bandas, visualizador espectral y listas sin cuenta requerida.', category:'multimedia', version:'4.0.0', android_min:'7.0+', size_bytes:15938560, downloads:38900, rating_sum:31.5, rating_count:7, featured:false },
    { name:'CodeEditor X', developer:'@devtools_open', icon_emoji:'💻', description:'Editor de código para móvil. Syntax highlighting para 50+ lenguajes, SSH, Git básico y preview HTML en tiempo real.', category:'productividad', version:'2.5.3', android_min:'9.0+', size_bytes:23920640, downloads:19300, rating_sum:43.2, rating_count:9, featured:true },
    { name:'OpenChat', developer:'@libre_social', icon_emoji:'💬', description:'Mensajería cifrada E2E, sin servidores centrales, protocolo P2P, sin metadatos. Grupos de hasta 500 personas.', category:'social', version:'1.8.7', android_min:'8.0+', size_bytes:11952640, downloads:52100, rating_sum:26.4, rating_count:6, featured:false },
    { name:'MathKing', developer:'@edtech_libre', icon_emoji:'📐', description:'Resuelve ecuaciones, grafica funciones 2D/3D, calculadora científica y estadística avanzada. Exporta a LaTeX.', category:'educacion', version:'3.3.0', android_min:'7.0+', size_bytes:9646080, downloads:14600, rating_sum:37.6, rating_count:8, featured:false },
    { name:'BattleRoads', developer:'@gamedev_indie', icon_emoji:'🏎️', description:'Carreras arcade multijugador local. 20+ pistas, torneo y battle royale vehicular con física realista.', category:'juegos', version:'1.5.0', android_min:'9.0+', size_bytes:91555840, downloads:28400, rating_sum:30.1, rating_count:7, featured:false },
    { name:'FileVault Pro', developer:'@crypto_tools', icon_emoji:'🔒', description:'Cifra archivos con AES-256. Bóveda de fotos y documentos con clave maestra o huella dactilar. Zero-knowledge.', category:'seguridad', version:'2.2.1', android_min:'8.0+', size_bytes:7444480, downloads:31700, rating_sum:36.8, rating_count:8, featured:false },
    { name:'CamAI Studio', developer:'@vision_libre', icon_emoji:'📷', description:'Cámara con filtros de IA en tiempo real, modo noche, desenfoque de fondo y edición sin marca de agua.', category:'multimedia', version:'3.0.2', android_min:'10.0+', size_bytes:43188224, downloads:44900, rating_sum:40.5, rating_count:9, featured:false },
    { name:'ZenNote', developer:'@productivity_open', icon_emoji:'📝', description:'Notas minimalistas con markdown, listas anidadas y recordatorios. Sin cuenta necesaria, sincronización local.', category:'productividad', version:'1.4.0', android_min:'6.0+', size_bytes:6082560, downloads:61300, rating_sum:49.0, rating_count:10, featured:true },
    { name:'TermiDroid', developer:'@sysadmin_free', icon_emoji:'🖥️', description:'Terminal Linux completa para Android. Bash, Python, Node.js, SSH, SFTP. El mejor entorno dev móvil.', category:'utilidades', version:'4.1.0', android_min:'8.0+', size_bytes:28311552, downloads:33200, rating_sum:44.8, rating_count:10, featured:false },
    { name:'DungeonsRL', developer:'@roguelike_indie', icon_emoji:'⚔️', description:'Roguelike procedural con pixel art. +200 horas, 50 clases, sistema de crafting profundo y generación infinita.', category:'juegos', version:'2.0.0', android_min:'7.0+', size_bytes:18874368, downloads:17600, rating_sum:35.2, rating_count:8, featured:false },
    { name:'LinguaFree', developer:'@lang_community', icon_emoji:'🌐', description:'Aprende idiomas offline con IA adaptativa. 30 idiomas, tarjetas espaciadas, reconocimiento de voz incluido.', category:'educacion', version:'5.0.1', android_min:'8.0+', size_bytes:52428800, downloads:76400, rating_sum:46.8, rating_count:10, featured:true },
  ];
  DB.apps = SEED.map(a => ({
    ...a,
    id: crypto.randomUUID(),
    icon_file: null,
    file_name: null,
    source_url: '',
    created_at: new Date().toISOString()
  }));
  DB.ratings = [];
  saveDB(DB);
  console.log('✅ Datos de ejemplo cargados');
}

// ─── HELPERS ──────────────────────────────────────
function json(res, data, status = 200) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(body);
}

function fmtSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function appView(a) {
  const ratingAvg = a.rating_count > 0 ? (a.rating_sum / a.rating_count) : 0;
  return { ...a, rating: Math.round(ratingAvg * 10) / 10, size: fmtSize(a.size_bytes) };
}

function mimeFor(ext) {
  const map = {
    html: 'text/html', css: 'text/css', js: 'application/javascript',
    json: 'application/json', png: 'image/png', jpg: 'image/jpeg',
    jpeg: 'image/jpeg', gif: 'image/gif', svg: 'image/svg+xml',
    ico: 'image/x-icon', webp: 'image/webp',
    apk: 'application/vnd.android.package-archive', xapk: 'application/zip'
  };
  return map[ext] || 'application/octet-stream';
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function parseMultipart(body, boundary) {
  const fields = {}, files = {};
  const sep = Buffer.from('--' + boundary);
  let start = 0;
  const parts = [];
  while (start < body.length) {
    const idx = body.indexOf(sep, start);
    if (idx === -1) break;
    const end = body.indexOf(sep, idx + sep.length);
    const chunk = end === -1 ? body.slice(idx + sep.length) : body.slice(idx + sep.length, end);
    if (chunk.length > 2) parts.push(chunk);
    start = end === -1 ? body.length : end;
  }
  for (const part of parts) {
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;
    const headerStr = part.slice(0, headerEnd).toString();
    const data = part.slice(headerEnd + 4, part.length - 2);
    const dispMatch = headerStr.match(/Content-Disposition:[^\r\n]*name="([^"]+)"/i);
    if (!dispMatch) continue;
    const fieldName = dispMatch[1];
    const fileMatch = headerStr.match(/filename="([^"]*)"/i);
    const ctMatch = headerStr.match(/Content-Type:\s*([^\r\n]+)/i);
    if (fileMatch && fileMatch[1]) {
      files[fieldName] = { filename: fileMatch[1], contentType: ctMatch ? ctMatch[1].trim() : 'application/octet-stream', data };
    } else {
      fields[fieldName] = data.toString().trim();
    }
  }
  return { fields, files };
}

// ─── ROUTER ───────────────────────────────────────
async function router(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;
  const method = req.method;

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  // ── API ──────────────────────────────────────────
  if (pathname.startsWith('/api/')) {

    // GET /api/apps
    if (pathname === '/api/apps' && method === 'GET') {
      const q = (url.searchParams.get('q') || '').toLowerCase();
      const cat = url.searchParams.get('cat') || '';
      const sort = url.searchParams.get('sort') || 'popular';
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');

      let apps = [...DB.apps];
      if (q) apps = apps.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.developer.toLowerCase().includes(q)
      );
      if (cat) apps = apps.filter(a => a.category === cat);

      if (sort === 'popular') apps.sort((a, b) => b.downloads - a.downloads);
      else if (sort === 'rating') apps.sort((a, b) => (b.rating_sum / Math.max(b.rating_count, 1)) - (a.rating_sum / Math.max(a.rating_count, 1)));
      else if (sort === 'name') apps.sort((a, b) => a.name.localeCompare(b.name));
      else apps.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      const total = apps.length;
      const paged = apps.slice((page - 1) * limit, page * limit);
      return json(res, { apps: paged.map(appView), total, page, pages: Math.ceil(total / limit) });
    }

    // GET /api/apps/featured
    if (pathname === '/api/apps/featured' && method === 'GET') {
      const feat = DB.apps.filter(a => a.featured).sort((a, b) => b.downloads - a.downloads).slice(0, 5);
      return json(res, feat.map(appView));
    }

    // GET /api/stats
    if (pathname === '/api/stats' && method === 'GET') {
      const totalDl = DB.apps.reduce((s, a) => s + (a.downloads || 0), 0);
      const cats = {};
      DB.apps.forEach(a => { cats[a.category] = (cats[a.category] || 0) + 1; });
      return json(res, {
        total_apps: DB.apps.length,
        total_downloads: totalDl,
        categories: Object.entries(cats).map(([category, c]) => ({ category, c }))
      });
    }

    // GET /api/apps/:id
    const appMatch = pathname.match(/^\/api\/apps\/([^/]+)$/);
    if (appMatch && method === 'GET') {
      const app = DB.apps.find(a => a.id === appMatch[1]);
      if (!app) return json(res, { error: 'No encontrado' }, 404);
      const ratings = DB.ratings.filter(r => r.app_id === appMatch[1]).slice(-10).reverse();
      return json(res, { ...appView(app), ratings });
    }

    // POST /api/apps/:id/download
    const dlMatch = pathname.match(/^\/api\/apps\/([^/]+)\/download$/);
    if (dlMatch && method === 'POST') {
      const app = DB.apps.find(a => a.id === dlMatch[1]);
      if (!app) return json(res, { error: 'No encontrado' }, 404);
      app.downloads = (app.downloads || 0) + 1;
      saveDB(DB);
      if (!app.file_name) return json(res, { url: null, filename: null });
      return json(res, { url: `/uploads/apks/${app.file_name}`, filename: app.file_name });
    }

    // POST /api/apps/:id/rate
    const rateMatch = pathname.match(/^\/api\/apps\/([^/]+)\/rate$/);
    if (rateMatch && method === 'POST') {
      const body = await readBody(req);
      let data;
      try { data = JSON.parse(body.toString()); } catch { return json(res, { error: 'JSON inválido' }, 400); }
      const score = parseInt(data.score);
      if (!score || score < 1 || score > 5) return json(res, { error: 'Score debe ser 1-5' }, 400);
      const app = DB.apps.find(a => a.id === rateMatch[1]);
      if (!app) return json(res, { error: 'No encontrado' }, 404);
      DB.ratings.push({ id: crypto.randomUUID(), app_id: rateMatch[1], score, comment: data.comment || '', created_at: new Date().toISOString() });
      app.rating_sum = (app.rating_sum || 0) + score;
      app.rating_count = (app.rating_count || 0) + 1;
      saveDB(DB);
      return json(res, { ok: true });
    }

    // POST /api/apps (publicar nueva app)
    if (pathname === '/api/apps' && method === 'POST') {
      const ct = req.headers['content-type'] || '';
      const boundaryMatch = ct.match(/boundary=([^\s;]+)/);
      if (!boundaryMatch) return json(res, { error: 'Se requiere multipart' }, 400);
      const rawBody = await readBody(req);
      const { fields, files } = parseMultipart(rawBody, boundaryMatch[1]);
      if (!fields.name || !fields.category || !fields.description || !fields.version)
        return json(res, { error: 'Faltan campos: name, category, description, version' }, 400);

      const id = crypto.randomUUID();
      let file_name = null, size_bytes = 0, icon_file = null;

      if (files.apk_file && files.apk_file.data.length > 0) {
        const ext = path.extname(files.apk_file.filename) || '.apk';
        file_name = `${id}${ext}`;
        fs.writeFileSync(path.join(APKS_DIR, file_name), files.apk_file.data);
        size_bytes = files.apk_file.data.length;
      }
      if (files.icon_file && files.icon_file.data.length > 0) {
        const ext = path.extname(files.icon_file.filename) || '.png';
        icon_file = `${id}${ext}`;
        fs.writeFileSync(path.join(ICONS_DIR, icon_file), files.icon_file.data);
      }

      const newApp = {
        id, file_name, icon_file, size_bytes,
        name: fields.name,
        developer: fields.developer || 'Anónimo',
        icon_emoji: fields.icon_emoji || '📦',
        description: fields.description,
        category: fields.category,
        version: fields.version,
        android_min: fields.android_min || '8.0+',
        source_url: fields.source_url || '',
        downloads: 0, rating_sum: 0, rating_count: 0, featured: false,
        created_at: new Date().toISOString()
      };
      DB.apps.unshift(newApp);
      saveDB(DB);
      return json(res, { ok: true, id }, 201);
    }

    return json(res, { error: 'Ruta no encontrada' }, 404);
  }

  // ── ARCHIVOS ESTÁTICOS ───────────────────────────
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end('Forbidden'); }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).slice(1).toLowerCase();
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mimeFor(ext), 'Content-Length': content.length });
    return res.end(content);
  }

  // SPA fallback
  const index = fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'));
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(index);
}

// ─── INICIAR SERVIDOR ─────────────────────────────
const server = http.createServer(async (req, res) => {
  try { await router(req, res); }
  catch (err) {
    console.error('Error:', err.message);
    if (!res.headersSent) json(res, { error: 'Error interno del servidor' }, 500);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ FreeStore corriendo en http://0.0.0.0:${PORT}`);
});
