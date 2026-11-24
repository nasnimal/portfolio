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
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const tests = [1, 2, 3].map((number) => document.getElementById(`ab-${number}-section`));
  if (tests.every(Boolean) && tests.every((test) => test.parentElement === tests[0].parentElement)) {
    const placeholders = tests.map((test) => {
      const placeholder = document.createComment(`${test.id} position`);
      test.before(placeholder);
      return placeholder;
    });
    const sequence = document.createElement('section');
    sequence.className = 'ab-test-sequence';
    sequence.setAttribute('aria-label', 'A/B test iterations');
    const pin = document.createElement('div');
    pin.className = 'ab-test-sequence__pin';
    sequence.append(pin);
    tests[0].before(sequence);

    const progress = document.createElement('nav');
    progress.className = 'ab-test-sequence__progress';
    progress.setAttribute('aria-label', 'A/B test progress');
    const buttons = tests.map((_, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', `Show A/B test ${index + 1}`);
      button.addEventListener('click', () => {
        const top = sequence.getBoundingClientRect().top + window.scrollY + index * window.innerHeight + 1;
        window.scrollTo({ top, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      });
      progress.append(button);
      return button;
    });
    pin.append(progress);

    let current = -1;
    let frame = 0;
    function updateClearance() {
      if (mobile.matches) return;
      const overflow = Math.max(0, ...tests.map((test) => test.scrollHeight - pin.clientHeight));
      sequence.style.setProperty('--ab-tail-clearance', `${Math.ceil(overflow) + 32}px`);
    }
    function updateSequence() {
      frame = 0;
      if (mobile.matches) return;
      const stage = Math.max(0, Math.min(tests.length - 1,
        Math.floor(-sequence.getBoundingClientRect().top / window.innerHeight)));
      if (stage === current) return;
      current = stage;
      for (const [index, test] of tests.entries()) {
        const active = index === stage;
        test.classList.toggle('is-active', active);
        test.inert = !active;
        test.setAttribute('aria-hidden', String(!active));
        buttons[index].setAttribute('aria-current', active ? 'step' : 'false');
      }
    }
    function scheduleUpdate() {
      if (!frame) frame = requestAnimationFrame(updateSequence);
    }
    function syncLayout() {
      if (mobile.matches) {
        for (const [index, test] of tests.entries()) {
          placeholders[index].after(test);
          test.classList.remove('ab-test-sequence__slide', 'is-active');
          test.inert = false;
          test.removeAttribute('aria-hidden');
        }
        sequence.hidden = true;
        current = -1;
      } else {
        sequence.hidden = false;
        for (const test of tests) {
          test.classList.add('ab-test-sequence__slide');
          pin.append(test);
        }
        updateClearance();
        scheduleUpdate();
      }
    }
    function syncHash() {
      if (mobile.matches) return;
      const match = window.location.hash.match(/^#ab-([1-3])(?:-section|-state\d+)$/);
      if (!match) return;
      const top = sequence.getBoundingClientRect().top + window.scrollY + (Number(match[1]) - 1) * window.innerHeight + 1;
      window.scrollTo({ top, behavior: 'auto' });
      scheduleUpdate();
    }
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', () => { updateClearance(); scheduleUpdate(); });
    window.addEventListener('hashchange', syncHash);
    mobile.addEventListener('change', () => { syncLayout(); syncHash(); });
    syncLayout();
    document.fonts?.ready.then(updateClearance);
    window.addEventListener('load', updateClearance, { once: true });
    requestAnimationFrame(() => requestAnimationFrame(syncHash));
  }
});
