const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { exec } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const app = express();
const PORT = 3000;

const LOCAL_VERSION_PATH = './local_version.json';
const REMOTE_VERSION_URL = 'https://raw.githubusercontent.com/fastxl2024/zenya-dashboard/main/version.json';

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// 📊 Systeeminfo
app.get('/api/system', (req, res) => {
  const data = {
    hostname: os.hostname(),
    platform: os.platform(),
    uptime: os.uptime(),
    totalmem: os.totalmem(),
    freemem: os.freemem(),
    loadavg: os.loadavg(),
  };
  res.json(data);
});

// 🐳 Docker containers ophalen
app.get('/api/containers', (req, res) => {
  exec('docker ps --format "{{.Names}}|{{.Image}}|{{.Status}}"', (err, stdout) => {
    if (err) return res.status(500).send('Docker fout');
    const containers = stdout.trim().split('\n').map(line => {
      const [name, image, status] = line.split('|');
      return { name, image, status };
    });
    res.json(containers);
  });
});

// 📁 ZFS datasets ophalen
app.get('/api/zfs', (req, res) => {
  exec('sudo zfs list -H -o name,used,avail,mountpoint', (err, stdout) => {
    if (err) return res.status(500).send('ZFS fout');
    const datasets = stdout.trim().split('\n').map(line => {
      const [name, used, avail, mount] = line.split('\t');
      return { name, used, avail, mount };
    });
    res.json(datasets);
  });
});

// ➕ ZFS dataset aanmaken
app.post('/api/zfs/create', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).send('Dataset naam vereist');
  exec(`sudo zfs create ${name}`, err => {
    if (err) return res.status(500).send('Fout bij aanmaken');
    res.send('✅ Dataset aangemaakt');
  });
});

// ❌ ZFS dataset verwijderen
app.post('/api/zfs/destroy', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).send('Naam vereist');
  exec(`sudo zfs destroy ${name}`, err => {
    if (err) return res.status(500).send('Fout bij verwijderen');
    res.send('🗑️ Dataset verwijderd');
  });
});

// 📸 Snapshot maken
app.post('/api/zfs/snapshot', (req, res) => {
  const { name, snapshot } = req.body;
  if (!name || !snapshot) return res.status(400).send('Naam en snapshot vereist');
  exec(`sudo zfs snapshot ${name}@${snapshot}`, err => {
    if (err) return res.status(500).send('Fout bij snapshot');
    res.send('📸 Snapshot gemaakt');
  });
});

// 🔄 Snapshot rollback
app.post('/api/zfs/rollback', (req, res) => {
  const { name, snapshot } = req.body;
  if (!name || !snapshot) return res.status(400).send('Naam en snapshot vereist');
  exec(`sudo zfs rollback ${name}@${snapshot}`, err => {
    if (err) return res.status(500).send('Fout bij rollback');
    res.send('🔄 Teruggezet naar snapshot');
  });
});

// 🗑️ Snapshot verwijderen
app.post('/api/zfs/destroy-snapshot', (req, res) => {
  const { name, snapshot } = req.body;
  if (!name || !snapshot) return res.status(400).send('Naam en snapshot vereist');
  exec(`sudo zfs destroy ${name}@${snapshot}`, err => {
    if (err) return res.status(500).send('Fout bij snapshot verwijderen');
    res.send('🗑️ Snapshot verwijderd');
  });
});

// 📂 Alle snapshots tonen
app.get('/api/zfs/snapshots', (req, res) => {
  exec('sudo zfs list -t snapshot -H -o name,used,creation', (err, stdout) => {
    if (err) return res.status(500).send('ZFS snapshot fout');
    const snapshots = stdout.trim().split('\n').map(line => {
      const [name, used, creation] = line.split('\t');
      return { name, used, creation };
    });
    res.json(snapshots);
  });
});

// Versie controle
app.get('/api/check-update', async (req, res) => {
  try {
    const local = JSON.parse(fs.readFileSync(LOCAL_VERSION_PATH));
    const { data: remote } = await axios.get(REMOTE_VERSION_URL);

    const isUpdate = remote.version !== local.version;

    res.json({
      updateAvailable: isUpdate,
      current: local.version,
      latest: remote.version,
      changelog: remote.changelog,
      download_url: remote.download_url,
      release_date: remote.release_date
    });
  } catch (err) {
    res.status(500).json({ error: 'Update check failed', details: err.message });
  }
});

// Update starten
app.get('/api/start-update', (req, res) => {
  exec('node /opt/zenya/scripts/updateZenya.js', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Update-fout:', error.message);
      res.status(500).send('Update mislukt: ' + error.message);
    } else {
      console.log('✅ Update uitgevoerd:\n', stdout);
      res.send('Update uitgevoerd. Herlaad Zenya om wijzigingen te zien.');
    }
  });
});

// 🌐 Server starten
app.listen(PORT, () => {
  console.log(`Zenya dashboard draait op http://localhost:${PORT}`);
});
