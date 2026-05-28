// js/theme.js
window.Habita = window.Habita || {};

(function(app) {
  const DARK_MODE_KEY = 'habita_dark_mode';
  const sunSVG = '<path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/>';
  const moonSVG = '<path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z M12 1v2 M12 21v2 M4.22 4.22l1.42 1.42 M18.36 18.36l1.42 1.42 M1 12h2 M21 12h2 M4.22 19.78l1.42-1.42 M18.36 5.64l1.42-1.42"/>';

  app.applyDarkMode = function(enabled) {
    const toggle = document.getElementById('darkModeToggle');
    if (!toggle) return;

    if (enabled) {
      document.body.classList.add('dark-mode');
      toggle.querySelector('svg').innerHTML = moonSVG;
    } else {
      document.body.classList.remove('dark-mode');
      toggle.querySelector('svg').innerHTML = sunSVG;
    }
    localStorage.setItem(DARK_MODE_KEY, enabled);
  };

  app.initTheme = function() {
    const toggle = document.getElementById('darkModeToggle');
    if (!toggle) return;

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const saved = localStorage.getItem(DARK_MODE_KEY);
    const darkMode = saved !== null ? saved === 'true' : prefersDark;
    app.applyDarkMode(darkMode);

    toggle.addEventListener('click', () => {
      const currentlyDark = document.body.classList.contains('dark-mode');
      app.applyDarkMode(!currentlyDark);
    });
  };
})(window.Habita);