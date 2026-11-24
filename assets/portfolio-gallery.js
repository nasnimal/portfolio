document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const containers = document.querySelectorAll(
    '.s-8xp3uc-container, .s-188qxaa-container, .s-1e4e4hm-container, .s-170aepj-container, .s-1v63oe8-container'
  );

  for (const container of containers) {
    const slides = [...container.querySelectorAll('section li img')];
    const seen = new Set();
    const images = slides.map((image) => ({
      src: image.getAttribute('data-gallery-src') || image.getAttribute('src'),
      alt: image.getAttribute('alt') || 'Portfolio project image'
    })).filter(({ src }) => {
      if (!src || seen.has(src)) return false;
      seen.add(src);
      return true;
    });
    if (!images.length) continue;

    const gallery = document.createElement('div');
    gallery.className = 'portfolio-preview-gallery';
    gallery.setAttribute('role', 'region');
    gallery.setAttribute('aria-label', 'Project image gallery');
    gallery.tabIndex = 0;

    const display = document.createElement('img');
    display.className = 'portfolio-preview-gallery__image';
    display.decoding = 'async';
    display.loading = 'lazy';
    gallery.append(display);

    const dots = document.createElement('div');
    dots.className = 'portfolio-preview-gallery__dots';
    const dotButtons = images.map((_, number) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'portfolio-preview-gallery__dot';
      dot.setAttribute('aria-label', `Show image ${number + 1} of ${images.length}`);
      dot.addEventListener('click', () => show(number));
      dots.append(dot);
      return dot;
    });

    let current = 0;
    let changeToken = 0;
    function show(number, initial = false) {
      const next = (number + images.length) % images.length;
      if (!initial && next === current) return;
      current = next;
      const selected = images[current];
      const token = ++changeToken;
      for (const [index, dot] of dotButtons.entries()) {
        dot.setAttribute('aria-current', String(index === current));
      }
      if (initial || reduceMotion.matches) {
        display.src = selected.src;
        display.alt = selected.alt;
        return;
      }

      const preload = new Image();
      let readyOnce = false;
      const ready = () => {
        if (readyOnce || token !== changeToken) return;
        readyOnce = true;
        display.classList.add('is-changing');
        window.setTimeout(() => {
          if (token !== changeToken) return;
          display.src = selected.src;
          display.alt = selected.alt;
          requestAnimationFrame(() => display.classList.remove('is-changing'));
        }, 110);
      };
      preload.onload = ready;
      preload.src = selected.src;
      if (preload.complete && preload.naturalWidth) ready();
    }

    for (const [direction, label, symbol] of [
      [-1, 'Previous image', '‹'],
      [1, 'Next image', '›']
    ]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `portfolio-preview-gallery__arrow portfolio-preview-gallery__arrow--${direction < 0 ? 'previous' : 'next'}`;
      button.setAttribute('aria-label', label);
      button.textContent = symbol;
      button.addEventListener('click', () => show(current + direction));
      gallery.append(button);
    }
    gallery.append(dots);
    gallery.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        show(current + (event.key === 'ArrowLeft' ? -1 : 1));
      }
    });

    container.replaceChildren(gallery);
    show(0, true);
  }
});
