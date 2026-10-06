const express = require('express');
const session = require('express-session');

const app = express();
app.disable('x-powered-by');
const PORT = 3000;

app.set('trust proxy', 1);              // Está detrás de Nginx
app.use(express.urlencoded({ extended: true }));

app.use(session({
  name: 'sid',
  secret: process.env.SESSION_SECRET || 'secreto-dev',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 30 * 60 * 1000 }
}));

const estilo = `<style>body{font-family:Arial;background:#1e1b4b;color:#e0e7ff;text-align:center;padding:60px}
.card{background:#312e81;max-width:600px;margin:auto;padding:30px;border-radius:12px}
input,button{padding:10px;border-radius:6px;border:none;margin:5px}button{background:#a78bfa;cursor:pointer}
a{color:#c4b5fd}code{background:#1e1b4b;padding:2px 6px;border-radius:4px}</style>`;

app.get('/', (req, res) => {
  if (!req.session.usuario) {
    return res.send(`${estilo}<div class="card"><h1>App Node.js - Grupo CodeX</h1>
      <p>Backend detrás de proxy inverso Nginx</p>
      <form method="post" action="/login">
        <input name="usuario" placeholder="Tu nombre" required>
        <button>Iniciar sesión</button>
      </form></div>`);
  }
  req.session.visitas = (req.session.visitas || 0) + 1;
  res.send(`${estilo}<div class="card"><h1>Hola, ${req.session.usuario}</h1>
    <p>Visitas en esta sesión: <b>${req.session.visitas}</b></p>
    <p>ID de sesión: <code>${req.sessionID}</code></p>
    <p>IP del cliente (X-Forwarded-For): <code>${req.ip}</code></p>
    <p><a href="/api/info">Ver /api/info</a> · <a href="/logout">Cerrar sesión</a></p></div>`);
});

app.post('/login', (req, res) => {
  req.session.usuario = req.body.usuario;
  res.redirect('/');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('sid');
    res.redirect('/');
  });
});

app.get('/api/info', (req, res) => {
  res.json({
    usuario: req.session.usuario || null,
    visitas: req.session.visitas || 0,
    sessionID: req.sessionID,
    ipCliente: req.ip,
    host: req.hostname,
    protocolo: req.protocol,
    cabecerasProxy: {
      'x-real-ip': req.headers['x-real-ip'],
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'x-forwarded-proto': req.headers['x-forwarded-proto']
    }
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend escuchando en http://127.0.0.1:${PORT}`);
});
