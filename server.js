/**
 * FreeStore Server - Zero dependencies, Node.js built-ins only
 * Node 22+ required (for node:sqlite)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
const APKS_DIR = path.join(UPLOADS_DIR, 'apks');
const ICONS_DIR = path.join(UPLOADS_DIR, 'icons');
const DATA_DIR = path.join(__dirname, 'data');

// Ensure directories exist
[PUBLIC_DIR, UPLOADS_DIR, APKS_DIR, ICONS_DIR, DATA_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ─── DATABASE ────────────────────────────────────────────────────────────────
const db = new DatabaseSync(path.join(DATA_DIR, 'freestore.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS apps (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    developer   TEXT DEFAULT 'Anónimo',
    icon_emoji  TEXT DEFAULT '📦',
    icon_file   TEXT,
    description TEXT NOT NULL,
    category    TEXT NOT NULL,
    version     TEXT NOT NULL,
    android_min TEXT DEFAULT '8.0+',
    size_bytes  INTEGER DEFAULT 0,
    file_name   TEXT,
    source_url  TEXT,
    downloads   INTEGER DEFAULT 0,
    rating_sum  REAL DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    featured    INTEGER DEFAULT 0,
    verified    INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ratings (
    id       TEXT PRIMARY KEY,
    app_id   TEXT NOT NULL,
    score    INTEGER NOT NULL,
    comment  TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(app_id) REFERENCES apps(id)
  );

  CREATE TABLE IF NOT EXISTS screenshots (
    id      TEXT PRIMARY KEY,
    app_id  TEXT NOT NULL,
    file    TEXT NOT NULL,
    FOREIGN KEY(app_id) REFERENCES apps(id)
  );
`);

// Seed with demo apps if empty
const countRow = db.prepare('SELECT COUNT(*) as c FROM apps').get();
if (countRow.c === 0) {
  const SEED = [
    { name:'TurboLauncher Pro', developer:'@turbodev_community', icon_emoji:'🚀', description:'El launcher más rápido y personalizable. Temas, widgets, gestos avanzados, gestión de apps mejorada y soporte multi-perfil. Ideal para personalizar tu experiencia al máximo.', category:'utilidades', version:'3.1.2', android_min:'7.0+', size_bytes:19292160, downloads:48234, rating_sum:39.2, rating_count:8, featured:1 },
    { name:'PixelCraft Studio', developer:'@pixelart_libre', icon_emoji:'🎨', description:'Crea pixel art y sprites directamente en tu móvil. Exporta en PNG, GIF animado o spritesheet. Perfecto para game devs y artistas digitales.', category:'multimedia', version:'2.0.5', android_min:'8.0+', size_bytes:12697600, downloads:23100, rating_sum:23.5, rating_count:5, featured:0 },
    { name:'NetShield VPN', developer:'@opensec_dev', icon_emoji:'🛡️', description:'VPN de código abierto, sin logs, sin límites de velocidad ni datos. Tu privacidad, tu control absoluto. Protocolo WireGuard integrado.', category:'seguridad', version:'1.9.0', android_min:'6.0+', size_bytes:9121792, downloads:91400, rating_sum:48.0, rating_count:10, featured:1 },
    { name:'RetroEmul 64', developer:'@retrodev_labs', icon_emoji:'🎮', description:'Emulador multicore para SNES, GBA, NES, N64, PS1 y más. Compatible con ROMs, savestates y controladores Bluetooth.', category:'juegos', version:'5.2.1', android_min:'8.0+', size_bytes:36175872, downloads:67800, rating_sum:41.4, rating_count:9, featured:0 },
    { name:'MusicFlow', developer:'@audiodev_free', icon_emoji:'🎵', description:'Reproductor de música local con ecualizador de 10 bandas, visualizador espectral y gestión avanzada de playlists sin cuenta requerida.', category:'multimedia', version:'4.0.0', android_min:'7.0+', size_bytes:15938560, downloads:38900, rating_sum:31.5, rating_count:7, featured:0 },
    { name:'CodeEditor X', developer:'@devtools_open', icon_emoji:'💻', description:'Editor de código completo para móvil. Syntax highlighting para 50+ lenguajes, terminal SSH integrada, Git básico y preview HTML en tiempo real.', category:'productividad', version:'2.5.3', android_min:'9.0+', size_bytes:23920640, downloads:19300, rating_sum:43.2, rating_count:9, featured:1 },
    { name:'OpenChat', developer:'@libre_social', icon_emoji:'💬', description:'Mensajería cifrada E2E. Sin servidores centrales, protocolo P2P, sin metadatos, sin publicidad. Grupos de hasta 500 personas.', category:'social', version:'1.8.7', android_min:'8.0+', size_bytes:11952640, downloads:52100, rating_sum:26.4, rating_count:6, featured:0 },
    { name:'MathKing', developer:'@edtech_libre', icon_emoji:'📐', description:'Resuelve ecuaciones diferenciales, grafica funciones 2D/3D, calculadora científica y estadística avanzada. Exporta a LaTeX.', category:'educacion', version:'3.3.0', android_min:'7.0+', size_bytes:9646080, downloads:14600, rating_sum:37.6, rating_count:8, featured:0 },
    { name:'BattleRoads', developer:'@gamedev_indie', icon_emoji:'🏎️', description:'Juego de carreras arcade multijugador local. 20+ pistas, modos torneo y battle royale vehicular con física realista.', category:'juegos', version:'1.5.0', android_min:'9.0+', size_bytes:91555840, downloads:28400, rating_sum:30.1, rating_count:7, featured:0 },
    { name:'FileVault Pro', developer:'@crypto_tools', icon_emoji:'🔒', description:'Cifra y protege archivos con AES-256. Bóveda de fotos y documentos con clave maestra o huella dactilar. Zero-knowledge.', category:'seguridad', version:'2.2.1', android_min:'8.0+', size_bytes:7444480, downloads:31700, rating_sum:36.8, rating_count:8, featured:0 },
    { name:'CamAI Studio', developer:'@vision_libre', icon_emoji:'📷', description:'Cámara con filtros de IA en tiempo real, modo noche mejorado con fusión de frames, desenfoque de fondo y edición sin marca de agua.', category:'multimedia', version:'3.0.2', android_min:'10.0+', size_bytes:43188224, downloads:44900, rating_sum:40.5, rating_count:9, featured:0 },
    { name:'ZenNote', developer:'@productivity_open', icon_emoji:'📝', description:'Notas minimalistas con sincronización local, markdown completo, listas de tareas anidadas y recordatorios. Sin cuenta necesaria.', category:'productividad', version:'1.4.0', android_min:'6.0+', size_bytes:6082560, downloads:61300, rating_sum:49.0, rating_count:10, featured:1 },
    { name:'TermiDroid', developer:'@sysadmin_free', icon_emoji:'🖥️', description:'Terminal Linux completa para Android. Bash, Python, Node.js, SSH, SFTP y más. El mejor entorno de desarrollo móvil.', category:'utilidades', version:'4.1.0', android_min:'8.0+', size_bytes:28311552, downloads:33200, rating_sum:44.8, rating_count:10, featured:0 },
    { name:'DungeonsRL', developer:'@roguelike_indie', icon_emoji:'⚔️', description:'Roguelike procedural con gráficos ASCII y pixel art. +200 horas de contenido, 50 clases, sistema de crafting profundo.', category:'juegos', version:'2.0.0', android_min:'7.0+', size_bytes:18874368, downloads:17600, rating_sum:35.2, rating_count:8, featured:0 },
    { name:'LinguaFree', developer:'@lang_community', icon_emoji:'🌐', description:'Aprende idiomas offline con IA adaptativa. 30 idiomas, tarjetas espaciadas, reconocimiento de voz y lecciones de 5 minutos.', category:'educacion', version:'5.0.1', android_min:'8.0+', size_bytes:52428800, downloads:76400, rating_sum:46.8, rating_count:10, featured:1 },
  ];
  const ins = db.prepare(`INSERT INTO apps (id,name,developer,icon_emoji,description,category,version,android_min,size_bytes,downloads,rating_sum,rating_count,featured) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  for (const a of SEED) {
    ins.run(crypto.randomUUID(), a.name, a.developer, a.icon_emoji, a.description, a.category, a.version, a.android_min, a.size_bytes, a.downloads, a.rating_sum, a.rating_count, a.featured);
  }
  console.log('✅ Seed data inserted');
}

// ─── MULTIPART PARSER ────────────────────────────────────────────────────────
function parseMultipart(body, boundary) {
  const fields = {};
  const files = {};
  const sep = Buffer.from('--' + boundary);
  const parts = [];
  let start = 0;

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

// ─── REQUEST BODY READER ─────────────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function json(res, data, status = 200) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
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
  const map = { html:'text/html', css:'text/css', js:'application/javascript', json:'application/json', png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', gif:'image/gif', svg:'image/svg+xml', ico:'image/x-icon', webp:'image/webp', apk:'application/vnd.android.package-archive', xapk:'application/zip' };
  return map[ext] || 'application/octet-stream';
}

// ─── ROUTER ──────────────────────────────────────────────────────────────────
async function router(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;
  const method = req.method;

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET,POST,PUT,DELETE', 'Access-Control-Allow-Headers':'Content-Type' });
    return res.end();
  }

  // ── API ROUTES ────────────────────────────────────────────────────────────
  if (pathname.startsWith('/api/')) {

    // GET /api/apps
    if (pathname === '/api/apps' && method === 'GET') {
      const q = url.searchParams.get('q') || '';
      const cat = url.searchParams.get('cat') || '';
      const sort = url.searchParams.get('sort') || 'newest';
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;

      let where = 'WHERE 1=1';
      const params = [];
      if (q) { where += ' AND (name LIKE ? OR description LIKE ? OR developer LIKE ?)'; params.push(`%${q}%`,`%${q}%`,`%${q}%`); }
      if (cat) { where += ' AND category = ?'; params.push(cat); }

      const orderMap = { newest:'created_at DESC', popular:'downloads DESC', rating:'(rating_sum/MAX(rating_count,1)) DESC', name:'name ASC' };
      const order = orderMap[sort] || 'created_at DESC';

      const total = db.prepare(`SELECT COUNT(*) as c FROM apps ${where}`).get(...params).c;
      const apps = db.prepare(`SELECT * FROM apps ${where} ORDER BY ${order} LIMIT ? OFFSET ?`).all(...params, limit, offset);
      return json(res, { apps: apps.map(appView), total, page, pages: Math.ceil(total / limit) });
    }

    // GET /api/apps/featured
    if (pathname === '/api/apps/featured' && method === 'GET') {
      const apps = db.prepare('SELECT * FROM apps WHERE featured=1 ORDER BY downloads DESC LIMIT 5').all();
      return json(res, apps.map(appView));
    }

    // GET /api/stats
    if (pathname === '/api/stats' && method === 'GET') {
      const total = db.prepare('SELECT COUNT(*) as c FROM apps').get().c;
      const totalDl = db.prepare('SELECT SUM(downloads) as s FROM apps').get().s || 0;
      const cats = db.prepare('SELECT category, COUNT(*) as c FROM apps GROUP BY category').all();
      return json(res, { total_apps: total, total_downloads: totalDl, categories: cats });
    }

    // GET /api/apps/:id
    const appMatch = pathname.match(/^\/api\/apps\/([^/]+)$/);
    if (appMatch && method === 'GET') {
      const app = db.prepare('SELECT * FROM apps WHERE id=?').get(appMatch[1]);
      if (!app) return json(res, { error: 'Not found' }, 404);
      const ratings = db.prepare('SELECT * FROM ratings WHERE app_id=? ORDER BY created_at DESC LIMIT 10').all(appMatch[1]);
      return json(res, { ...appView(app), ratings });
    }

    // POST /api/apps/:id/download
    const dlMatch = pathname.match(/^\/api\/apps\/([^/]+)\/download$/);
    if (dlMatch && method === 'POST') {
      const app = db.prepare('SELECT * FROM apps WHERE id=?').get(dlMatch[1]);
      if (!app) return json(res, { error: 'Not found' }, 404);
      if (!app.file_name) return json(res, { error: 'No file' }, 404);
      db.prepare('UPDATE apps SET downloads=downloads+1 WHERE id=?').run(dlMatch[1]);
      return json(res, { url: `/uploads/apks/${app.file_name}`, filename: app.file_name });
    }

    // POST /api/apps/:id/rate
    const rateMatch = pathname.match(/^\/api\/apps\/([^/]+)\/rate$/);
    if (rateMatch && method === 'POST') {
      const body = await readBody(req);
      let data;
      try { data = JSON.parse(body.toString()); } catch { return json(res, { error: 'Invalid JSON' }, 400); }
      const score = parseInt(data.score);
      if (!score || score < 1 || score > 5) return json(res, { error: 'Score must be 1-5' }, 400);
      const ratingId = crypto.randomUUID();
      db.prepare('INSERT INTO ratings (id,app_id,score,comment) VALUES (?,?,?,?)').run(ratingId, rateMatch[1], score, data.comment || '');
      db.prepare('UPDATE apps SET rating_sum=rating_sum+?, rating_count=rating_count+1 WHERE id=?').run(score, rateMatch[1]);
      return json(res, { ok: true });
    }

    // POST /api/apps (publish new app)
    if (pathname === '/api/apps' && method === 'POST') {
      const ct = req.headers['content-type'] || '';
      const boundaryMatch = ct.match(/boundary=([^\s;]+)/);
      if (!boundaryMatch) return json(res, { error: 'Multipart required' }, 400);

      const rawBody = await readBody(req);
      const { fields, files } = parseMultipart(rawBody, boundaryMatch[1]);

      // Validate
      if (!fields.name || !fields.category || !fields.description || !fields.version) {
        return json(res, { error: 'Missing required fields: name, category, description, version' }, 400);
      }

      const id = crypto.randomUUID();
      let file_name = null;
      let size_bytes = 0;
      let icon_file = null;

      // Save APK
      if (files.apk_file && files.apk_file.data.length > 0) {
        const ext = path.extname(files.apk_file.filename) || '.apk';
        file_name = `${id}${ext}`;
        fs.writeFileSync(path.join(APKS_DIR, file_name), files.apk_file.data);
        size_bytes = files.apk_file.data.length;
      }

      // Save icon
      if (files.icon_file && files.icon_file.data.length > 0) {
        const ext = path.extname(files.icon_file.filename) || '.png';
        icon_file = `${id}${ext}`;
        fs.writeFileSync(path.join(ICONS_DIR, icon_file), files.icon_file.data);
      }

      db.prepare(`INSERT INTO apps (id,name,developer,icon_emoji,icon_file,description,category,version,android_min,size_bytes,file_name,source_url) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
        .run(id, fields.name, fields.developer || 'Anónimo', fields.icon_emoji || '📦', icon_file, fields.description, fields.category, fields.version, fields.android_min || '8.0+', size_bytes, file_name, fields.source_url || '');

      return json(res, { ok: true, id }, 201);
    }

    return json(res, { error: 'Not found' }, 404);
  }

  // ── STATIC FILES ──────────────────────────────────────────────────────────
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  // Prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403); return res.end('Forbidden');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).slice(1).toLowerCase();
    const mime = mimeFor(ext);
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mime, 'Content-Length': content.length });
    return res.end(content);
  }

  // 404 → index.html (SPA)
  const index = fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'));
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(index);
}

// ─── START ───────────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  try {
    await router(req, res);
  } catch (err) {
    console.error('❌ Error:', err);
    if (!res.headersSent) json(res, { error: 'Internal server error' }, 500);
  }
});

server.listen(PORT, () => {
  console.log(`
  ┌─────────────────────────────────────────┐
  │   🟢 FreeStore corriendo en             │
  │   http://localhost:${PORT}                 │
  │                                         │
  │   Sin registro · Sin costos · Libre     │
  └─────────────────────────────────────────┘
  `);
});
