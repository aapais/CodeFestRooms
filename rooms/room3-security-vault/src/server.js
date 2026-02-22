const express = require('express');
const path = require('path');
const fs = require('fs');
const repo = require('./userRepo');

const app = express();
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json()); // Support JSON bodies
app.use(express.urlencoded({ extended: true }));

app.get('/api/source', (req, res) => {
  try {
    const source = fs.readFileSync(path.join(__dirname, 'userRepo.js'), 'utf8');
    res.json({ ok: true, source });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Serve shared config files
app.get('/timingConfig.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../../shared/timingConfig.js'));
});
app.get('/config.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../../shared/config.js'));
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    // This calls the vulnerable method
    const result = repo.login(username, password);
    
    if (result.ok) {
        // Mock Admin Check based on username (since repo doesn't expose it)
        if (username === 'admin') {
            return res.json({ ok: true, msg: `🔓 ACCESS GRANTED. Welcome Admin! Flag: {SECURE_CODE_UNLOCKED}` });
        }
        return res.json({ ok: true, msg: `Welcome ${username}. (Not an Admin)` });
    } else {
      return res.json({ ok: false, msg: 'Invalid credentials.' });
    }
  } catch (err) {
    // Verbose error leaking info (part of the challenge?)
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/search', (req, res) => {
    const q = req.query.q || '';
    const result = repo.findUsersByName(q);
    // Return the RAW QUERY to show the vulnerability
    res.json({ ok: true, queryExecuted: result.query });
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`🔐 Security Vault running at http://localhost:${PORT}`);
});
