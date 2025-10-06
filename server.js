// CFD - Centrum Formacji Duchowej — prosty serwer Express
const path = require('path');
const fs = require('fs');
const express = require('express');
const compression = require('compression');
const morgan = require('morgan');
const archiver = require('archiver');

const app = express();
const PORT = process.env.PORT || 3000;

// Ścieżki
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const DOWNLOADS_DIR = path.join(__dirname, 'downloads');

app.use(compression());
app.use(express.json());
app.use(morgan('dev'));

// Serwuj statyczne pliki
app.use(express.static(PUBLIC_DIR, { maxAge: '1d' }));

function loadJson(file) {
  const p = path.join(DATA_DIR, file);
  try {
    const raw = fs.readFileSync(p, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Błąd ładowania JSON', p, e.message);
    return null;
  }
}

// API
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/events', (req, res) => {
  const data = loadJson('events.json') || [];
  res.json(data);
});

app.get('/api/directors', (req, res) => {
  const data = loadJson('directors.json') || [];
  res.json(data);
});

// Pobieranie ZIP po kodzie
// Body: { code: string }
app.post('/api/download', (req, res) => {
  const { code } = req.body || {};
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Brak lub niepoprawny kod.' });
  }
  const codesMap = loadJson('codes.json') || {};
  const folderRelative = codesMap[code];
  if (!folderRelative) {
    return res.status(403).json({ error: 'Nieprawidłowy kod.' });
  }
  const folderPath = path.normalize(path.join(DOWNLOADS_DIR, folderRelative));
  if (!folderPath.startsWith(DOWNLOADS_DIR)) {
    return res.status(400).json({ error: 'Nieprawidłowa ścieżka.' });
  }
  if (!fs.existsSync(folderPath)) {
    return res.status(404).json({ error: 'Archiwum niedostępne.' });
  }

  const baseName = path.basename(folderPath);
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${baseName}.zip"`);

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.on('error', (err) => {
    console.error('Błąd archiwizacji:', err);
    res.status(500).end();
  });
  archive.pipe(res);
  archive.directory(folderPath, false);
  archive.finalize();
});

// Fallback na index.html (SPA-lite)
app.get('*', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`CFD serwer działa na http://localhost:${PORT}`);
});
