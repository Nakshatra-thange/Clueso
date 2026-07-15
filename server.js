const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use('/screenshots', express.static(path.join(__dirname, 'screenshots')));


app.get('/', (req, res) => {
  res.send('Stale Doc Detector API is running');
});


app.post('/api/capture', async (req, res) => {
  const { url, label } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const fileName = `${label || 'capture'}-${Date.now()}.png`;
    const filePath = path.join(__dirname, 'screenshots', fileName);

    await page.screenshot({ path: filePath, fullPage: true });
    await browser.close();

    res.json({
      success: true,
      fileName,
      url: `/screenshots/${fileName}`,
      capturedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to capture screenshot', details: err.message });
  }
});


app.get('/api/screenshots', (req, res) => {
  const dir = path.join(__dirname, 'screenshots');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
  res.json(files);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});