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
  }
})();