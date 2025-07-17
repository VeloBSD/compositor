import express from 'express';
import path from 'path';
import session from 'express-session';
import { fileURLToPath } from 'url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static build directory
app.use(express.static(path.join(__dirname, '../client/dist')));

// === Session Setup ===
app.use(session({
  secret: 'velo-super-secret', // เปลี่ยนใน production นะ
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // true ถ้าใช้ HTTPS
    maxAge: 1000 * 60 * 60 // 1 ชั่วโมง
  }
}));

// === Middleware: Require login ===
function requireLogin(req, res, next) {
  if (req.session.loggedIn) {
    next();
  } else {
    res.redirect('/login');
  }
}

// === API Mock ===
app.use(express.json());
app.post('/api/login', (req, res) => {
  // ในของจริงใช้ username/password check
  req.session.loggedIn = true;
  res.json({ status: 'ok' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ status: 'logged out' });
  });
});

// === Routes ===

// ✅ Home/desktop ต้อง login
app.get('/', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// ✅ Desktop session page (อันนี้อาจปล่อยให้เข้าตรงได้ ถ้าจะ debug)
app.get('/desktop-session', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// ✅ Login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// ✅ Fallback (React Router SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// === Start the server ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ VeloUI Server running on http://localhost:${PORT}`);
});
