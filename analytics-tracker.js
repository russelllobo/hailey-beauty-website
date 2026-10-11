(() => {
  if (!['/', '/index.html'].includes(location.pathname) || !window.crypto?.randomUUID) return;
  const pageviewId = crypto.randomUUID();
  let pageviewSent = false;
  let source = new URLSearchParams(location.search).get('utm_source') || '';
  if (!/^[\p{L}\p{N} ._+-]{1,80}$/u.test(source)) source = '';
  let referrer = '';
  try { referrer = new URL(document.referrer).origin; } catch {}

  function send(type) {
    const body = JSON.stringify({eventId:crypto.randomUUID(),pageviewId,type,path:location.pathname,source,referrer});
    function deliver(attempt = 0) {
      fetch('/api/analytics/event', {method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true})
        .then(response => { if (response.status >= 500) throw new Error('Tracking unavailable'); })
        .catch(() => { if (attempt < 2) setTimeout(() => deliver(attempt + 1), 2000 * (attempt + 1)); });
    }
    deliver();
  }
  function pageview() {
    if (pageviewSent || document.visibilityState !== 'visible' || document.prerendering) return;
    pageviewSent = true;
    send('pageview');
  }
  pageview();
  document.addEventListener('visibilitychange',pageview);
  document.addEventListener('prerenderingchange',pageview);
  window.addEventListener('pageshow',pageview);
  document.addEventListener('click',event => {
    const link = event.target.closest('a[data-booking-link]');
    if (!link || link.getAttribute('aria-disabled') === 'true' || !link.href.startsWith('https://www.sumupbookings.com/')) return;
    pageview();
    send('booking_click');
  });
})();
