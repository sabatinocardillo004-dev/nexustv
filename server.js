import express from 'express';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const app = express();
const PORT = process.env.PORT || 3000;

const TARGET_URL = 'https://dlstreams.st/stream/stream-860.php';
const TARGET_DOMAIN = 'https://dlstreams.st';

app.get('/player', async (req, res) => {
  try {
    // 1. Il server (in USA) scarica la pagina bypassando il geoblocco
    const response = await fetch(TARGET_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
        'Referer': TARGET_DOMAIN
      }
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    // 2. Rimuove script pubblicitari esterni
    $('script').each((i, el) => {
      const src = $(el).attr('src') || '';
      const content = $(el).html() || '';
      if (
        src.includes('pop') || 
        src.includes('adsterra') || 
        src.includes('clksite') ||
        content.includes('window.open') || 
        content.includes('popunder')
      ) {
        $(el).remove();
      }
    });

    // 3. Inietta script anti-popup e CSS per adattare il player al 100% dello schermo dello smartphone
    $('head').prepend(`
      <script>
        // Blocco totale di popup e reindirizzamenti su mobile
        window.open = function() { return null; };
        window.alert = function() { return null; };
        
        // Disabilita i cambi di pagina forzati dalle pubblicità
        window.onbeforeunload = null;
      </script>
      <style>
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          overflow: hidden !important;
          background: #000 !important;
        }
        iframe, video, .player-container, #player {
          width: 100% !important;
          height: 100% !important;
          border: 0 !important;
        }
      </style>
    `);

    res.setHeader('Content-Type', 'text/html');
    res.send($.html());

  } catch (error) {
    console.error('Errore durante il recupero del player:', error.message);
    res.status(500).send('Errore di connessione al server dello streaming.');
  }
});

app.listen(PORT, () => {
  console.log(`Server Player attivo su http://localhost:${PORT}`);
});