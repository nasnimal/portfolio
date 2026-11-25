(() => {
  const asset = new URL('./aliexpress-bouncy.svg', document.currentScript.src);
  document.querySelectorAll('#aliexpress a').forEach((card) => {
    const images = card.querySelector('[data-name="images"]');
    if (!images || card.querySelector('.ali-motion-card')) return;
    const panel = document.createElement('div');
    panel.className = 'ali-motion-card';
    const image = document.createElement('img');
    image.src = asset.href;
    image.alt = 'AliExpress logo bouncing between its original and redesigned forms';
    image.width = 1200;
    image.height = 800;
    image.loading = 'lazy';
    panel.append(image);
    images.insertAdjacentElement('afterend', panel);
  });
})();
