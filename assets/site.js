/* Shared behaviour for the secondary pages (about, music, contact). */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* ── topographic contour lines (seeded, so they're stable) ── */
  const rng = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
  document.querySelectorAll('svg.topo').forEach(svg => {
    const r = rng(+svg.dataset.seed || 7), n = +svg.dataset.topo || 10;
    svg.setAttribute('viewBox', '0 0 1000 1000'); svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    let d = '';
    for (let i = 0; i < Math.ceil(n / 2); i++) {
      const cx = r() * 1000, cy = r() * 1000, base = 140 + r() * 220, rings = 1 + Math.floor(r() * 2);
      const ph = [r() * 6, r() * 6, r() * 6], amp = [.18 + r() * .2, .1 + r() * .12, .05 + r() * .06];
      for (let k = 0; k < rings; k++) {
        const R = base + k * (90 + r() * 60), pts = [];
        for (let a = 0; a < 48; a++) {
          const t = a / 48 * Math.PI * 2;
          const m = 1 + amp[0] * Math.sin(2 * t + ph[0]) + amp[1] * Math.sin(3 * t + ph[1]) + amp[2] * Math.sin(5 * t + ph[2]);
          pts.push([cx + Math.cos(t) * R * m * 1.25, cy + Math.sin(t) * R * m]);
        }
        const mid = (a, b) => `${((a[0] + b[0]) / 2).toFixed(1)} ${((a[1] + b[1]) / 2).toFixed(1)}`;
        d += `M${mid(pts[pts.length - 1], pts[0])} ` + pts.map((p, j) =>
          `Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${mid(p, pts[(j + 1) % pts.length])}`).join(' ') + 'Z';
      }
    }
    svg.innerHTML = `<path d="${d}"/>`;
  });

  /* ── nav theme: read the section under the nav ── */
  const nav = document.getElementById('nav');
  const sections = [...document.querySelectorAll('main > section, footer')];
  const setNav = () => {
    if (!nav || nav.classList.contains('menu-open')) return;
    const y = 40;
    const s = sections.find(el => { const b = el.getBoundingClientRect(); return b.top <= y && b.bottom > y; });
    let theme = s ? s.dataset.theme : 'light';
    if (s && s.tagName === 'FOOTER') { const c = s.querySelector('.foot-card').getBoundingClientRect(); theme = c.top <= y ? 'dark' : 'light'; }
    nav.dataset.on = theme || 'light';
  };
  addEventListener('scroll', setNav, { passive: true }); setNav();

  /* ── menu ── */
  const menu = document.getElementById('menu'), mb = document.getElementById('menuBtn');
  if (menu && mb) {
    const setMenu = open => {
      menu.classList.toggle('open', open); nav.classList.toggle('menu-open', open);
      mb.setAttribute('aria-expanded', open); mb.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if (open) nav.dataset.on = 'dark'; else setNav();
    };
    mb.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    addEventListener('keydown', e => e.key === 'Escape' && setMenu(false));
  }

  /* ── reveal on scroll ── */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }),
    { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.rv').forEach(el => io.observe(el));

  /* ── smooth scroll, like the home page ── */
  if (!reduce && typeof Lenis !== 'undefined') {
    const lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.on('scroll', setNav);
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href'); if (id.length < 2) return;
      const el = document.querySelector(id); if (!el) return; e.preventDefault(); lenis.scrollTo(el);
    }));
  }
})();
