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

// Evita que un nombre como <script> se ejecute en la página (XSS)
const escapar = (t) => String(t).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const pagina = (titulo, contenido) => `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titulo}</title>
<style>
  *{box-sizing:border-box;margin:0}
  body{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;padding:40px 20px;
       font-family:"Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif;color:#e0e7ff;
       background:radial-gradient(900px 500px at 85% -10%,rgba(167,139,250,.25),transparent 60%),
                  radial-gradient(700px 500px at -10% 110%,rgba(56,189,248,.10),transparent 60%),#13112e}
  .card{width:100%;max-width:640px;background:#1c1a45;border:1px solid #2e2a6b;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.45)}
  .top{height:6px;background:linear-gradient(90deg,#a78bfa,#38bdf8)}
  .body{padding:40px 44px}
  .badge{display:inline-flex;align-items:center;gap:8px;font:600 13px/1 Consolas,"Courier New",monospace;letter-spacing:2px;
         color:#c4b5fd;background:rgba(167,139,250,.14);padding:8px 14px;border-radius:999px}
  .dot{width:8px;height:8px;border-radius:50%;background:#4ade80;box-shadow:0 0 10px #4ade80}
  h1{margin-top:20px;font-size:34px;line-height:1.2;color:#fff}
  h1 span{color:#a78bfa}
  .lead{margin-top:10px;color:#a5b4fc;font-size:17px;line-height:1.6}
  form{margin-top:28px;display:flex;gap:10px}
  input{flex:1;padding:14px 16px;border-radius:10px;border:1px solid #3b3680;background:#13112e;color:#fff;font-size:16px;outline:none}
  input:focus{border-color:#a78bfa;box-shadow:0 0 0 3px rgba(167,139,250,.25)}
  button,.btn{padding:14px 22px;border-radius:10px;border:none;background:#a78bfa;color:#13112e;font-weight:700;font-size:16px;cursor:pointer;text-decoration:none}
  button:hover,.btn:hover{background:#c4b5fd}
  .btn.sec{background:transparent;color:#c4b5fd;border:1px solid #3b3680}
  .stats{margin-top:28px;display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .stat{background:#13112e;border:1px solid #2e2a6b;border-radius:14px;padding:16px 18px}
  .stat small,.field small{display:block;font:600 11px/1 Consolas,monospace;letter-spacing:2px;color:#818cf8;text-transform:uppercase}
  .stat b{display:block;margin-top:8px;font:700 26px Consolas,"Courier New",monospace;color:#fff}
  .field{margin-top:14px;background:#13112e;border:1px solid #2e2a6b;border-radius:14px;padding:16px 18px}
  .field code{display:block;margin-top:8px;font:14px Consolas,"Courier New",monospace;color:#ddd6fe;word-break:break-all}
  .chips{margin-top:22px;display:flex;flex-wrap:wrap;gap:8px}
  .chip{font:13px Consolas,monospace;color:#bae6fd;background:rgba(56,189,248,.10);border:1px solid rgba(56,189,248,.3);border-radius:999px;padding:6px 12px}
  .acciones{margin-top:28px;display:flex;gap:10px;flex-wrap:wrap}
  footer{font-size:13px;color:#6366f1;text-align:center}
  @media(max-width:600px){.body{padding:28px 22px}form{flex-direction:column}.stats{grid-template-columns:1fr}}
</style></head>
<body><main class="card"><div class="top"></div><div class="body">${contenido}</div></main>
<footer>Grupo CodeX · Node.js + Express detrás de Nginx · app.local</footer></body></html>`;

app.get('/', (req, res) => {
  if (!req.session.usuario) {
    return res.send(pagina('Iniciar sesión · App Grupo CodeX', `
      <span class="badge"><span class="dot"></span>HOST VIRTUAL 2 · BACKEND</span>
      <h1>App <span>Node.js</span> · Grupo CodeX</h1>
      <p class="lead">Backend detrás de un proxy inverso Nginx. Escribe tu nombre para iniciar una sesión.</p>
      <form method="post" action="/login">
        <input name="usuario" placeholder="Tu nombre" required autocomplete="off">
        <button>Iniciar sesión</button>
      </form>
      <div class="chips"><span class="chip">Express</span><span class="chip">express-session</span><span class="chip">cookie sid</span></div>`));
  }
  req.session.visitas = (req.session.visitas || 0) + 1;
  res.send(pagina('Sesión activa · App Grupo CodeX', `
    <span class="badge"><span class="dot"></span>SESIÓN ACTIVA</span>
    <h1>Hola, <span>${escapar(req.session.usuario)}</span></h1>
    <p class="lead">El servidor te recuerda gracias a la cookie <b>sid</b>, aunque HTTP no tiene estado.</p>
    <div class="stats">
      <div class="stat"><small>Visitas en esta sesión</small><b>${req.session.visitas}</b></div>
      <div class="stat"><small>IP del cliente</small><b>${escapar(req.ip)}</b></div>
    </div>
    <div class="field"><small>ID de sesión</small><code>${req.sessionID}</code></div>
    <div class="chips"><span class="chip">HttpOnly</span><span class="chip">SameSite=Lax</span><span class="chip">expira en 30 min</span></div>
    <div class="acciones"><a class="btn" href="/api/info">Ver /api/info</a><a class="btn sec" href="/logout">Cerrar sesión</a></div>`));
});

app.post('/login', (req, res, next) => {
  req.session.regenerate((err) => {      // ID nuevo al iniciar sesión
    if (err) return next(err);
    req.session.usuario = req.body.usuario;
    res.redirect('/');
  });
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
