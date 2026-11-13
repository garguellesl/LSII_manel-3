// Run synchronously before styles/body/React: a saved light theme must never paint dark first.
(function () {
  var theme = 'dark';
  try {
    var saved = window.localStorage.getItem('protube.theme');
    if (saved === 'light' || saved === 'dark') theme = saved;
  } catch {
    // Storage can be unavailable; the default theme still renders normally.
  }
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.bsTheme = theme;
  document.documentElement.style.colorScheme = theme;
})();
