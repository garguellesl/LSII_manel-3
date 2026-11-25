// Run synchronously before styles/body/React: a saved light theme must never paint dark first.
(function () {
  var theme = 'dark';
  var contrast = null;
  try {
    var saved = window.localStorage.getItem('protube.theme');
    if (saved === 'light' || saved === 'dark') theme = saved;
    var savedContrast = window.localStorage.getItem('protube.contrast');
    if (savedContrast === 'high' || savedContrast === 'standard') contrast = savedContrast;
  } catch {
    // Storage can be unavailable; the default theme still renders normally.
  }
  if (contrast === null) {
    // Without a saved choice, follow the operating system's "more contrast" setting.
    contrast = window.matchMedia && window.matchMedia('(prefers-contrast: more)').matches ? 'high' : 'standard';
  }
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.bsTheme = theme;
  document.documentElement.dataset.contrast = contrast;
  document.documentElement.style.colorScheme = theme;
})();
