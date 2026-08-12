// js/main.js
(function() {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    window.Habita.initTheme();
    window.Habita.initUI();
    window.Habita.renderProgressRings();
    // The timeline sets itself up hidden, then asks for calendar access once the
    // first frame is on screen — a permission dialog should never be the first
    // thing the app shows.
    window.Habita.initTimeline();
  }
})();
