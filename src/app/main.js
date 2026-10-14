// app/main.js
window.Habita.initTheme();
window.Habita.initUI();
window.Habita.initDrawer();
window.Habita.renderProgressRings();
// The timeline asks for calendar access only after the first frame is on screen.
window.Habita.initTimeline();
