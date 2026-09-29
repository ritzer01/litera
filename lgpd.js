// ─── Litera · LGPD / Consentimento ──────────────────────────────────────────
// Salva as preferências no localStorage sob a chave "litera_consent".
// Só carrega scripts de terceiros (Analytics, AdSense) após consentimento.
//
// IMPORTANTE ao ativar Analytics ou AdSense: a Content-Security-Policy do
// index.html hoje só permite arquivos do próprio site ('self'). Os scripts do
// Google serão bloqueados até que a CSP seja ampliada para os domínios deles.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  const STORAGE_KEY = 'litera_consent';

  // Lê o consentimento salvo (null = ainda não respondeu)
  function getConsent() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : null;
      return data && typeof data === 'object' ? data : null;
    } catch (_) {
      return null;
    }
  }

  // Salva o consentimento e esconde o banner
  function saveConsent(analytics, ads) {
    const payload = {
      analytics: !!analytics,
      ads:       !!ads,
      date:      new Date().toISOString()
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (_) {}

    hideBanner();
    if (payload.analytics) loadAnalytics();
    if (payload.ads)       loadAds();
  }

  function hideBanner() {
    const banner = document.getElementById('lgpd-banner');
    if (banner) {
      banner.classList.add('lgpd-hide');
      // Remove do DOM após a transição para não atrapalhar acessibilidade
      setTimeout(() => banner.remove(), 400);
    }
  }

  // ── Carregamento condicional de terceiros ──────────────────────────────────
  // Quando tiver o ID do Google Analytics, substitua 'G-XXXXXXXXXX' e descomente.
  // Quando tiver o AdSense aprovado (exige domínio próprio), substitua o
  // 'ca-pub-XXXXXXXXXXXXXXXX' e descomente o bloco de loadAds().

  let analyticsCarregado = false;
  let adsCarregado = false;

  function loadAnalytics() {
    if (analyticsCarregado) return;
    analyticsCarregado = true;
    // const GA_ID = 'G-XXXXXXXXXX';
    // const s = document.createElement('script');
    // s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    // s.async = true;
    // document.head.appendChild(s);
    // window.dataLayer = window.dataLayer || [];
    // function gtag(){ dataLayer.push(arguments); }
    // gtag('js', new Date());
    // gtag('config', GA_ID);
  }

  function loadAds() {
    if (adsCarregado) return;
    adsCarregado = true;
    // const s = document.createElement('script');
    // s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX';
    // s.async = true;
    // s.crossOrigin = 'anonymous';
    // document.head.appendChild(s);
  }

  // ── Renderiza o banner (via DOM, sem innerHTML) ────────────────────────────
  function el(tag, attrs, ...filhos) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (k === 'className') node.className = v;
      else node.setAttribute(k, v);
    });
    node.append(...filhos);
    return node;
  }

  function toggle(id, rotulo) {
    return el('label', { className: 'lgpd-toggle' },
      el('input', { type: 'checkbox', id }),
      el('span', { className: 'lgpd-toggle-label' }, rotulo)
    );
  }

  function renderBanner() {
    const existing = document.getElementById('lgpd-banner');
    if (existing && !existing.classList.contains('lgpd-hide')) return;
    if (existing) existing.remove();

    const btnAll    = el('button', { type: 'button', className: 'lgpd-btn lgpd-btn-accept-all' }, 'Aceitar todos');
    const btnSave   = el('button', { type: 'button', className: 'lgpd-btn lgpd-btn-save' }, 'Salvar escolha');
    const btnReject = el('button', { type: 'button', className: 'lgpd-btn lgpd-btn-reject' }, 'Só essenciais');

    const banner = el('div', {
        id: 'lgpd-banner',
        role: 'dialog',
        'aria-modal': 'false',
        'aria-label': 'Preferências de privacidade'
      },
      el('div', { className: 'lgpd-inner' },
        el('div', { className: 'lgpd-text' },
          el('p', { className: 'lgpd-title' }, 'Sua privacidade'),
          el('p', { className: 'lgpd-desc' },
            'O texto que você digita nunca sai do seu navegador. Por padrão, guardamos só a sua escolha de privacidade, no próprio dispositivo. ',
            'Com sua permissão, também poderemos usar cookies analíticos e publicitários. Veja a ',
            el('a', { href: 'privacidade.html', className: 'lgpd-link' }, 'Política de Privacidade'),
            '.'
          )
        ),
        el('div', { className: 'lgpd-toggles' },
          toggle('lgpd-chk-analytics', 'Analíticos'),
          toggle('lgpd-chk-ads', 'Publicitários')
        ),
        el('div', { className: 'lgpd-actions' }, btnAll, btnSave, btnReject)
      )
    );

    document.body.appendChild(banner);

    // Reabertura pelo rodapé: mostra a escolha salva anteriormente
    const current = getConsent();
    const chkAnalytics = document.getElementById('lgpd-chk-analytics');
    const chkAds       = document.getElementById('lgpd-chk-ads');
    if (current) {
      chkAnalytics.checked = !!current.analytics;
      chkAds.checked       = !!current.ads;
    }

    btnAll.addEventListener('click', () => saveConsent(true, true));
    btnSave.addEventListener('click', () => saveConsent(chkAnalytics.checked, chkAds.checked));
    btnReject.addEventListener('click', () => saveConsent(false, false));
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  function init() {
    // Link "Preferências de privacidade" no rodapé: permite alterar ou revogar a escolha
    const openLink = document.getElementById('lgpd-open');
    if (openLink) {
      openLink.addEventListener('click', (e) => {
        e.preventDefault();
        renderBanner();
      });
    }

    const consent = getConsent();

    if (consent === null) {
      // Primeira visita: mostra o banner
      renderBanner();
    } else {
      // Visita recorrente: respeita a escolha salva sem mostrar o banner
      if (consent.analytics) loadAnalytics();
      if (consent.ads)       loadAds();
    }
  }

  // Espera o DOM estar pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
