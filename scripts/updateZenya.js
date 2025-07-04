const fs = require('fs');
const https = require('https');
const tar = require('tar');
const axios = require('axios');
const { execSync } = require('child_process');

const REMOTE_VERSION_URL = 'https://raw.githubusercontent.com/fastxl2024/zenya-dashboard/main/version.json';
const ZENYA_PATH = '/opt/zenya'; // pad naar jouw project

async function updateZenya() {
  try {
    const { data: remote } = await axios.get(REMOTE_VERSION_URL);
    const file = fs.createWriteStream("/tmp/zenya.tar.gz");

    console.log('⬇️ Downloaden van:', remote.download_url);
    https.get(remote.download_url, response => {
      response.pipe(file);
      file.on('finish', () => {
        console.log('📦 Download voltooid, bestanden uitpakken...');
        file.close(() => {
          // Alles uitpakken in /opt/zenya
          tar.x({
            file: "/tmp/zenya.tar.gz",
            C: ZENYA_PATH,
            sync: true,
            strip: 0 // aanpassen als je in een submap zit
          });

          // Versiebestand bijwerken
          fs.writeFileSync(`${ZENYA_PATH}/local_version.json`, JSON.stringify({ version: remote.version }));

          console.log('✅ Zenya geüpdatet naar versie', remote.version);

          // Herstart Zenya (systemd)
          console.log('🔄 Zenya service herstarten...');
          execSync('sudo systemctl restart zenya.service');
          console.log('✅ Herstart voltooid');
        });
      });
    });
  } catch (err) {
    console.error('❌ Update mislukt:', err.message);
  }
}

updateZenya();