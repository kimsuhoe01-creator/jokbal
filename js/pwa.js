(() => {
  'use strict';

  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./service-worker.js', {
        scope: './',
        updateViaCache: 'none'
      });

      // Check for a newer deployed version without delaying the current screen.
      registration.update().catch(() => {});
    } catch (error) {
      console.warn('PWA service worker registration failed:', error);
    }
  });
})();
