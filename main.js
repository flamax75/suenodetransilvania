function toggleSection(button, type) {
  const videoItem = button.closest('.video-item');
  if (!videoItem) return;

  const section = videoItem.querySelector('.video-info.' + type);
  if (!section) return;

  const allSections = videoItem.querySelectorAll('.video-info');

  allSections.forEach(info => {
    if (info !== section) info.style.display = 'none';
  });

  section.style.display = (section.style.display === 'block') ? 'none' : 'block';
}

function updateFooterYear() {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.register('service-worker.js')
    .then(registration => console.log('Service Worker registrado', registration))
    .catch(error => console.error('Error al registrar Service Worker', error));
}

function setupInstallBanner() {
  const banner = document.getElementById('install-banner');
  const installBtn = document.getElementById('install-button');
  const dismissBtn = document.getElementById('dismiss-button');
  let deferredPrompt;

  if (!banner || !installBtn || !dismissBtn) return;

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    banner.classList.remove('hidden');
  });

  installBtn.addEventListener('click', () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    deferredPrompt.userChoice.finally(() => {
      deferredPrompt = null;
      banner.classList.add('hidden');
    });
  });

  dismissBtn.addEventListener('click', () => {
    banner.classList.add('hidden');
  });
}

updateFooterYear();
registerServiceWorker();
setupInstallBanner();
