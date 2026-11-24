document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const containers = document.querySelectorAll(
    '.s-8xp3uc-container, .s-188qxaa-container, .s-1e4e4hm-container, .s-170aepj-container, .s-1v63oe8-container'
  );

  for (const container of containers) {
    const seen = new Set();
    const images = [...container.querySelectorAll('section li img')].map((image) => ({
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
    gallery.setAttribute('aria-roledescription', 'carousel');
    gallery.setAttribute('aria-label', 'Project image gallery');
    gallery.tabIndex = 0;

    const viewport = document.createElement('div');
    viewport.className = 'portfolio-preview-gallery__viewport';
    const track = document.createElement('div');
    track.className = 'portfolio-preview-gallery__track';
    for (const [index, image] of images.entries()) {
      const slide = document.createElement('div');
      slide.className = 'portfolio-preview-gallery__slide';
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('aria-label', `${index + 1} of ${images.length}`);
      const img = document.createElement('img');
      img.className = 'portfolio-preview-gallery__image';
      img.src = image.src;
      img.alt = image.alt;
      img.decoding = 'async';
      img.loading = 'eager';
      img.draggable = false;
      slide.append(img);
      track.append(slide);
    }
    viewport.append(track);
    gallery.append(viewport);

    const dots = document.createElement('div');
    dots.className = 'portfolio-preview-gallery__dots';
    const arrows = [];
    const dotButtons = images.map((_, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'portfolio-preview-gallery__dot';
      dot.setAttribute('aria-label', `Show image ${index + 1} of ${images.length}`);
      dot.addEventListener('click', () => show(index));
      dots.append(dot);
      return dot;
    });

    let current = 0;
    let drag = null;
    function updateDots() {
      for (const [index, dot] of dotButtons.entries()) {
        dot.setAttribute('aria-current', String(index === current));
      }
      if (arrows.length) {
        arrows[0].disabled = current === 0;
        arrows[1].disabled = current === images.length - 1;
      }
    }
    function show(index, instant = false) {
      current = Math.max(0, Math.min(images.length - 1, index));
      updateDots();
      viewport.scrollTo({
        left: current * viewport.clientWidth,
        behavior: instant || reduceMotion.matches ? 'auto' : 'smooth'
      });
    }

    for (const [direction, label, path] of [
      [-1, 'Previous image', 'M15.5 5 8.5 12l7 7'],
      [1, 'Next image', 'M8.5 5 15.5 12l-7 7']
    ]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `portfolio-preview-gallery__arrow portfolio-preview-gallery__arrow--${direction < 0 ? 'previous' : 'next'}`;
      button.setAttribute('aria-label', label);
      button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
      button.addEventListener('click', () => show(current + direction));
      gallery.append(button);
      arrows.push(button);
    }
    gallery.append(dots);

    viewport.addEventListener('scroll', () => {
      if (drag || !viewport.clientWidth) return;
      const index = Math.round(viewport.scrollLeft / viewport.clientWidth);
      if (index !== current && index >= 0 && index < images.length) {
        current = index;
        updateDots();
      }
    }, { passive: true });

    viewport.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      drag = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        left: viewport.scrollLeft,
        index: Math.round(viewport.scrollLeft / viewport.clientWidth),
        moved: false
      };
      if (event.pointerType === 'mouse') event.preventDefault();
    });
    viewport.addEventListener('pointermove', (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (!drag.moved) {
        if (Math.abs(dx) < 8 || Math.abs(dx) <= Math.abs(dy)) return;
        drag.moved = true;
        viewport.classList.add('is-dragging');
        viewport.setPointerCapture(event.pointerId);
      }
      viewport.scrollLeft = drag.left - dx;
    });
    function endDrag(event) {
      if (!drag || drag.id !== event.pointerId) return;
      const gesture = drag;
      drag = null;
      viewport.classList.remove('is-dragging');
      if (!gesture.moved) return;
      const dx = gesture.x - event.clientX;
      const threshold = Math.min(72, viewport.clientWidth * 0.12);
      const index = Math.abs(dx) > threshold
        ? gesture.index + Math.sign(dx)
        : Math.round(viewport.scrollLeft / viewport.clientWidth);
      show(Math.max(0, Math.min(images.length - 1, index)));
    }
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);

    gallery.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        show(current + (event.key === 'ArrowLeft' ? -1 : 1));
      }
    });
    new ResizeObserver(() => {
      viewport.style.scrollBehavior = 'auto';
      viewport.scrollLeft = current * viewport.clientWidth;
      viewport.style.scrollBehavior = '';
    }).observe(viewport);

    container.replaceChildren(gallery);
    updateDots();
  }
});
