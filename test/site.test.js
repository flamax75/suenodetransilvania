const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const htmlFiles = ['index.html', 'quien.html', 'contacto.html', 'politica.html'];
const localUrlPattern = /\b(?:href|src)="([^"]+)"/g;

function existsFromRoot(target) {
  const cleanTarget = target.split('#')[0].split('?')[0];
  if (!cleanTarget) return true;
  return fs.existsSync(path.join(root, cleanTarget.replace(/^\//, '')));
}

test('all local href and src targets exist', () => {
  const missing = [];

  for (const file of htmlFiles) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    for (const match of html.matchAll(localUrlPattern)) {
      const target = match[1];
      if (/^(https?:|mailto:|tel:)/.test(target)) continue;
      if (!existsFromRoot(target)) missing.push(`${file} -> ${target}`);
    }
  }

  assert.equal(missing.length, 0, missing.join('\n'));
});

test('manifest references existing icons and screenshots', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  const files = [...manifest.icons, ...manifest.screenshots].map(item => item.src);
  const missing = files.filter(file => !existsFromRoot(file));

  assert.equal(manifest.lang, 'es');
  assert.equal(manifest.display, 'standalone');
  assert.equal(missing.length, 0, missing.join('\n'));
});

test('service worker caches existing local files', () => {
  const sw = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');
  const match = sw.match(/const urlsToCache = (\[[\s\S]*?\]);/);
  assert.ok(match, 'urlsToCache should be declared as an array');

  const urls = vm.runInNewContext(match[1]);
  const missing = urls.filter(url => url !== '/' && !existsFromRoot(url));

  assert.ok(urls.includes('/index.html'));
  assert.ok(urls.includes('/politica.html'));
  assert.equal(missing.length, 0, missing.join('\n'));
});

test('toggleSection opens one section and closes siblings', () => {
  const main = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
  const context = {
    console,
    document: { getElementById: id => ({ textContent: '', addEventListener: () => {}, classList: { add: () => {}, remove: () => {} } }) },
    navigator: {},
    window: { addEventListener: () => {} }
  };

  vm.createContext(context);
  vm.runInContext(main, context);

  const letra = { style: { display: 'none' } };
  const historia = { style: { display: 'block' } };
  const videoItem = {
    querySelector: selector => selector.endsWith('.letra') ? letra : null,
    querySelectorAll: () => [letra, historia]
  };
  const button = { closest: selector => selector === '.video-item' ? videoItem : null };

  context.toggleSection(button, 'letra');

  assert.equal(letra.style.display, 'block');
  assert.equal(historia.style.display, 'none');
});