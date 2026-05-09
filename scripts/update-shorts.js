const fs = require('node:fs');
const https = require('node:https');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const INDEX_FILE = path.join(ROOT, 'index.html');
const CHANNEL_SHORTS_URL = process.env.CHANNEL_SHORTS_URL || 'https://www.youtube.com/channel/UCERqiUdNB_quNuERXF2JNDg/shorts';
const LIMIT = Number(process.env.TOP_SHORTS_LIMIT || 10);
const START_MARKER = '<!-- AUTO-SHORTS-START -->';
const END_MARKER = '<!-- AUTO-SHORTS-END -->';

function fetchText(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'accept-language': 'es-ES,es;q=0.9,en;q=0.8',
        'user-agent': 'Mozilla/5.0 (compatible; suenodetransilvania-shorts-updater/1.0)'
      }
    }, response => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location && redirects < 5) {
        response.resume();
        resolve(fetchText(new URL(response.headers.location, url).toString(), redirects + 1));
        return;
      }

      if (response.statusCode < 200 || response.statusCode >= 300) {
        response.resume();
        reject(new Error(`YouTube responded with HTTP ${response.statusCode}`));
        return;
      }

      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => {
        body += chunk;
      });
      response.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

function extractInitialData(html) {
  const marker = 'var ytInitialData = ';
  const start = html.indexOf(marker);
  if (start === -1) throw new Error('Could not find ytInitialData in YouTube HTML');

  const jsonStart = start + marker.length;
  const jsonEnd = html.indexOf(';</script>', jsonStart);
  if (jsonEnd === -1) throw new Error('Could not find end of ytInitialData JSON');

  return JSON.parse(html.slice(jsonStart, jsonEnd));
}

function contentText(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value.content) return value.content;
  if (value.simpleText) return value.simpleText;
  if (Array.isArray(value.runs)) return value.runs.map(run => run.text || '').join('');
  return '';
}

function parseViews(viewText) {
  const normalized = viewText
    .replace(/\u00a0/g, ' ')
    .replace(/\./g, '')
    .replace(/,/g, '.')
    .toLowerCase();
  const match = normalized.match(/([\d.]+)\s*([km])?/);
  if (!match) return 0;

  const base = Number(match[1]);
  if (!Number.isFinite(base)) return 0;
  if (match[2] === 'm') return Math.round(base * 1000000);
  if (match[2] === 'k') return Math.round(base * 1000);
  return Math.round(base);
}

function collectShorts(data) {
  const found = [];

  function walk(node) {
    if (!node || typeof node !== 'object') return;

    if (node.reelItemRenderer) {
      const item = node.reelItemRenderer;
      found.push({
        id: item.videoId,
        title: contentText(item.headline),
        viewsText: contentText(item.viewCountText)
      });
    }

    if (node.shortsLockupViewModel) {
      const item = node.shortsLockupViewModel;
      const command = item.onTap?.innertubeCommand?.reelWatchEndpoint;
      found.push({
        id: command?.videoId || item.entityId?.replace(/^shorts-shelf-item-/, ''),
        title: contentText(item.overlayMetadata?.primaryText),
        viewsText: contentText(item.overlayMetadata?.secondaryText)
      });
    }

    for (const value of Object.values(node)) {
      if (value && typeof value === 'object') walk(value);
    }
  }

  walk(data);

  const byId = new Map();
  for (const item of found) {
    if (!item.id || !item.title || !item.viewsText || byId.has(item.id)) continue;
    byId.set(item.id, {
      ...item,
      views: parseViews(item.viewsText)
    });
  }

  return [...byId.values()]
    .sort((a, b) => b.views - a.views)
    .slice(0, LIMIT);
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderShorts(shorts) {
  return shorts.map(short => `      <article class="short-item">
        <iframe src="https://www.youtube.com/embed/${escapeHtml(short.id)}" title="${escapeHtml(short.title)}" allowfullscreen></iframe>
        <h2>${escapeHtml(short.title)}</h2>
        <p>${escapeHtml(short.viewsText)}</p>
      </article>`).join('\n\n');
}

function updateIndex(shorts) {
  const html = fs.readFileSync(INDEX_FILE, 'utf8');
  const start = html.indexOf(START_MARKER);
  const end = html.indexOf(END_MARKER);

  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`Could not find ${START_MARKER} and ${END_MARKER} in index.html`);
  }

  const before = html.slice(0, start + START_MARKER.length);
  const after = html.slice(end);
  const nextHtml = `${before}\n${renderShorts(shorts)}\n      ${after}`;

  fs.writeFileSync(INDEX_FILE, nextHtml);
}

async function main() {
  const html = await fetchText(CHANNEL_SHORTS_URL);
  const data = extractInitialData(html);
  const shorts = collectShorts(data);

  if (shorts.length < LIMIT) {
    throw new Error(`Expected ${LIMIT} shorts, found ${shorts.length}`);
  }

  updateIndex(shorts);
  console.log(`Updated index.html with ${shorts.length} shorts.`);
  shorts.forEach((short, index) => {
    console.log(`${index + 1}. ${short.viewsText} - ${short.title}`);
  });
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
