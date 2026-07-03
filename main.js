// nav scroll state
const nav = document.getElementById('nav');
addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 20));

// reveal on scroll
const io = new IntersectionObserver((es) => { es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }) }, { threshold: 0.12 });
document.querySelectorAll('.reveal,.stagger').forEach(el => io.observe(el));

// hero stagger immediately
addEventListener('load', () => document.getElementById('hero-copy').classList.add('in'));
document.getElementById('hero-copy').classList.add('in');

// count-up metrics
const fmt = n => n >= 1000 ? n.toLocaleString('es-CO') : n;
const mio = new IntersectionObserver((es) => {
  es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.querySelectorAll('.num').forEach(el => {
      const to = +el.dataset.to, pre = el.dataset.pre || '', suf = el.dataset.suf || '';
      let cur = 0; const step = to / 45;
      const tick = () => { cur += step; if (cur >= to) { el.textContent = pre + fmt(to) + suf; } else { el.textContent = pre + fmt(Math.floor(cur)) + suf; requestAnimationFrame(tick); } };
      tick();
    });
    mio.unobserve(e.target);
  });
}, { threshold: 0.4 });
mio.observe(document.getElementById('metrics'));

// role tabs
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(x => x.classList.remove('active'));
  t.classList.add('active');
  document.querySelector(`.panel[data-panel="${t.dataset.tab}"]`).classList.add('active');
}));

// === GA4 TRACKING ===
function gaEvent(name, params) { if (typeof gtag !== 'undefined') gtag('event', name, params); }
function gaLocation(el) {
  if (el.closest('nav')) return 'nav';
  const s = el.closest('section[id]');
  return s ? s.id : 'page';
}

// CTA y WhatsApp clicks
document.querySelectorAll('a.btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const loc = gaLocation(btn);
    const label = btn.textContent.trim().replace(/→/g, '').trim();
    gaEvent('cta_click', { button_text: label, location: loc });
    if (btn.classList.contains('btn-wa')) gaEvent('whatsapp_click', { location: loc });
  });
});

// Tab de roles
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
  gaEvent('tab_view', { tab: t.dataset.tab, tab_label: t.textContent.trim() });
}));

// FAQ — qué preguntas abren
document.querySelectorAll('details.faq').forEach(faq => {
  faq.addEventListener('toggle', () => {
    if (faq.open) {
      const q = faq.querySelector('summary')?.childNodes[0]?.textContent?.trim();
      gaEvent('faq_open', { question: q });
    }
  });
});

// Secciones: virtual pageview + evento section_view
const _sectionMeta = {
  'hero': { path: '/', title: 'Magnetic — Inicio' },
  'problema': { path: '/#problema', title: 'Magnetic — El problema' },
  'solucion': { path: '/#solucion', title: 'Magnetic — Solución' },
  'roles': { path: '/#roles', title: 'Magnetic — Para tu rol' },
  'planes': { path: '/#planes', title: 'Magnetic — Planes' },
  'faq': { path: '/#faq', title: 'Magnetic — FAQ' },
  'final': { path: '/#contacto', title: 'Magnetic — Agenda una demo' },
};
const _sio = new IntersectionObserver((es) => {
  es.forEach(e => {
    if (e.isIntersecting) {
      const meta = _sectionMeta[e.target.id];
      gaEvent('section_view', { section_id: e.target.id });
      if (meta) {
        gtag('event', 'page_view', {
          page_path: meta.path,
          page_title: meta.title,
          page_location: location.origin + meta.path,
        });
        history.replaceState(null, '', meta.path);
      }
      _sio.unobserve(e.target);
    }
  });
}, { threshold: 0.4 });
document.querySelectorAll('section[id]').forEach(s => _sio.observe(s));

// Redes sociales: WhatsApp flotante, LinkedIn, Instagram
document.querySelectorAll('[data-social]').forEach(link => {
  link.addEventListener('click', () => {
    gaEvent('social_click', {
      platform: link.dataset.social,
      location: link.id === 'wa-float' ? 'floating_button' : gaLocation(link),
      link_url: link.href
    });
  });
});

// Videos "Magnetic en acción": preview automático de 5s + CTA a Instagram
const PREVIEW_SECONDS = 5;
document.querySelectorAll('.vid-player').forEach(video => {
  const title = video.dataset.videoTitle || 'video';
  const media = video.closest('.vid-media');
  let ended = false, played = false;
  const track = (name, extra) => gaEvent(name, Object.assign({ video_title: title, location: gaLocation(video) }, extra));
  const finishPreview = () => {
    if (ended) return;
    ended = true;
    video.pause();
    if (media) media.classList.add('is-ended');
    track('video_preview_end');
  };
  video.addEventListener('timeupdate', () => {
    if (video.currentTime >= PREVIEW_SECONDS) finishPreview();
  });
  video.addEventListener('ended', finishPreview);
  // Reproduce el preview solo cuando la card entra en pantalla (ahorra datos)
  const _vio = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting && !ended) {
        video.play().then(() => {
          if (!played) { played = true; track('video_play'); }
        }).catch(() => { });
        _vio.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  _vio.observe(video);
});

// Profundidad de scroll: 25 / 50 / 75 / 100 %
const _sd = new Set();
addEventListener('scroll', () => {
  const total = document.body.scrollHeight - innerHeight;
  if (total <= 0) return;
  const pct = Math.round(scrollY / total * 100);
  [25, 50, 75, 100].forEach(d => {
    if (pct >= d && !_sd.has(d)) { _sd.add(d); gaEvent('scroll_depth', { depth: d }); }
  });
}, { passive: true });
