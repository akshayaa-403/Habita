// features/matrix/progress.js
window.Habita = window.Habita || {};

(function(app) {
  app.renderProgressRings = function() {
    for (let q = 1; q <= 4; q++) {
      const container = document.getElementById('progress' + q);
      if (!container) continue;

      const { total, completed, remaining } = app.getProgress(q);
      const r = 54;
      const circumference = 2 * Math.PI * r;
      const offset = total === 0 ? circumference : circumference * (1 - completed / total);

      container.innerHTML = `
        <svg class="progress-ring" viewBox="0 0 130 130">
          <circle class="progress-ring-disc" cx="65" cy="65" r="${r + 4.5}"/>
          <circle class="progress-ring-bg" cx="65" cy="65" r="${r}"/>
          <circle class="progress-ring-fill" cx="65" cy="65" r="${r}"
                  stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
        </svg>
        <div class="remaining-number">${remaining}</div>
        <div class="total-text">to go</div>
      `;
      container.setAttribute('aria-label', `${remaining} tasks to go out of ${total}`);
    }
  };
})(window.Habita);