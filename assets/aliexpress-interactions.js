document.addEventListener('DOMContentLoaded', () => {
  const feedback = document.querySelector('.page-aliexpress .s-1tfsl2h-container > section');
  const track = feedback?.querySelector(':scope > ul');

  if (feedback && track) {
    const originals = [...track.children];
    if (originals.length > 1) {
      feedback.classList.add('feedback-marquee');
      feedback.tabIndex = 0;
      feedback.setAttribute('role', 'region');
      feedback.setAttribute('aria-label', 'User feedback');
      track.setAttribute('aria-live', 'off');
      track.style.animationPlayState = 'paused';

      for (const item of originals) {
        const clone = item.cloneNode(true);
        clone.setAttribute('data-feedback-clone', '');
        clone.setAttribute('aria-hidden', 'true');
        clone.inert = true;
        track.append(clone);
      }

      function measureFeedback() {
        const firstCopy = track.children[originals.length];
        const distance = firstCopy.offsetLeft - originals[0].offsetLeft;
        if (distance <= 0) return;
        feedback.style.setProperty('--feedback-distance', `${distance}px`);
        feedback.style.setProperty('--feedback-duration', `${Math.max(28, distance / 58)}s`);
      }

      measureFeedback();
      requestAnimationFrame(() => { track.style.animationPlayState = ''; });
      new ResizeObserver(measureFeedback).observe(feedback);
      document.fonts?.ready.then(measureFeedback);
      new IntersectionObserver(([entry]) => {
        feedback.classList.toggle('is-offscreen', !entry.isIntersecting);
      }).observe(feedback);
    }
  }

  const mobile = window.matchMedia('(max-width: 809px)');
  const stories = [...document.querySelectorAll('.page-aliexpress [id^="ab-"][id$="-section"]')]
    .map((section) => {
      const sticky = section.querySelector(':scope > [data-name="sticky block"]');
      const markers = [...section.children].filter((child) => /^ab-\d+-state\d+$/.test(child.id));
      if (!sticky || !markers.length) return null;

      const paragraph = sticky.children[3]?.querySelector('p.s-text.text-content');
      const bullets = [];
      if (paragraph) {
        let line = '';
        for (const child of [...paragraph.childNodes]) {
          if (child.nodeName === 'BR') {
            if (line.trim()) bullets.push(line.trim());
            line = '';
          } else {
            line += child.textContent;
          }
        }
        if (line.trim()) bullets.push(line.trim());
      }

      let bulletNodes = [];
      if (paragraph && bullets.length > 1) {
        paragraph.classList.add('ab-story-copy');
        const heading = document.createElement('span');
        heading.className = 'ab-story-line ab-story-line--heading';
        heading.textContent = bullets[0];
        bulletNodes = bullets.slice(1).map((text) => {
          const span = document.createElement('span');
          span.className = 'ab-story-line ab-story-line--bullet';
          span.textContent = text;
          return span;
        });
        paragraph.replaceChildren(heading, ...bulletNodes);
      }

      const dots = [...sticky.querySelectorAll('a[href*="#ab-"]')];
      let current = -1;
      function show(stage) {
        if (stage === current) return;
        current = stage;
        const activeId = markers[stage].id;
        for (const dot of dots) {
          if (dot.hash === `#${activeId}`) dot.setAttribute('aria-current', 'step');
          else dot.removeAttribute('aria-current');
        }

        const showAll = stage === 0 || (stage === markers.length - 1 && markers.length > bulletNodes.length + 1);
        for (const [index, bullet] of bulletNodes.entries()) {
          bullet.classList.toggle('is-muted', !showAll && index !== stage - 1);
        }

        const focus = !mobile.matches && stage > 0 && stage < markers.length - 1;
        sticky.style.setProperty('--ab-zoom', focus ? '1.12' : '1');
        sticky.style.setProperty('--ab-pan-y', focus ? `${(1 - stage * 2 / (markers.length - 1)) * 24}px` : '0px');
      }

      return { markers, show };
    }).filter(Boolean);

  if (stories.length) {
    let frame = 0;
    function updateStories() {
      frame = 0;
      for (const story of stories) {
        if (mobile.matches) {
          story.show(0);
          continue;
        }
        let stage = 0;
        const threshold = window.innerHeight * .35;
        for (const [index, marker] of story.markers.entries()) {
          if (marker.getBoundingClientRect().top <= threshold) stage = index;
        }
        story.show(stage);
      }
    }
    function scheduleUpdate() {
      if (!frame) frame = requestAnimationFrame(updateStories);
    }
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    mobile.addEventListener('change', scheduleUpdate);
    scheduleUpdate();
  }
});
