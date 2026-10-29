(() => {
  const path = location.pathname.replace(/\/+$/, '') || '/';
  if (path.startsWith('/analytics')) return;

  const meta = document.querySelector('meta[name="ga4-id"]');
  const measurementId = (meta?.content || '').trim();
  if (!/^G-[A-Z0-9]{6,}$/.test(measurementId) || measurementId.includes('XXXX')) return;

  const storageKey = 'hailey-consent';
  const granted = { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' };
  const denied = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' };
  let choice = null;
  try { choice = localStorage.getItem(storageKey); } catch {}

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', { ...denied, wait_for_update: 500 });
  if (choice === 'granted') window.gtag('consent', 'update', granted);
  window.gtag('js', new Date());
  window.gtag('config', measurementId);

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.append(script);

  window.haileyGA = {
    bookingClick(link) {
      if (typeof window.gtag !== 'function' || !link) return;
      const section = link.closest('section, header, footer');
      const placement = section?.id || (section?.className || '').toString().trim().split(/\s+/)[0] || 'page';
      window.gtag('event', 'booking_click', { link_url: link.href, placement });
    },
  };

  function setConsent(value) {
    try { localStorage.setItem(storageKey, value); } catch {}
    window.gtag('consent', 'update', value === 'granted' ? granted : denied);
  }

  function initConsent() {
    const banner = document.querySelector('[data-consent]');
    if (!banner) return;

    const hide = () => {
      banner.hidden = true;
      banner.classList.remove('is-open');
      document.body.classList.remove('consent-open');
      document.body.style.setProperty('--consent-offset', '0px');
    };

    const show = () => {
      banner.hidden = false;
      requestAnimationFrame(() => banner.classList.add('is-open'));
      document.body.classList.add('consent-open');
      document.body.style.setProperty('--consent-offset', `${banner.offsetHeight}px`);
    };

    banner.querySelector('[data-consent-accept]')?.addEventListener('click', () => { setConsent('granted'); hide(); });
    banner.querySelector('[data-consent-decline]')?.addEventListener('click', () => { setConsent('denied'); hide(); });
    document.querySelectorAll('[data-consent-open]').forEach((button) => {
      button.addEventListener('click', show);
    });

    const syncOffset = () => {
      if (!banner.hidden) document.body.style.setProperty('--consent-offset', `${banner.offsetHeight}px`);
    };
    window.addEventListener('resize', syncOffset);

    if (!choice || (choice !== 'granted' && choice !== 'denied')) show();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initConsent);
  else initConsent();
})();
