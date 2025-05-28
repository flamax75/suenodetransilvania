function toggleSection(button, type) {
  const videoItem = button.closest('.video-item');
  const section = videoItem.querySelector('.video-info.' + type);
  const allSections = videoItem.querySelectorAll('.video-info');

  allSections.forEach(info => {
    if (info !== section) info.style.display = 'none';
  });

  section.style.display = (section.style.display === 'block') ? 'none' : 'block';
}
