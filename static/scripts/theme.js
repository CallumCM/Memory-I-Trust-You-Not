const THEME_COLORS = {
  'LIGHT': {
    'primary': '#391919',
    'secondary': '#e5d783',
    'accent': '#d37e9e',
    'background': '#eeeeee'
  },
  'DARK': {
    'primary': '#fdc07d',
    'secondary': '#163739',
    'accent': '#6c2943',
    'background': '#22232f'
  }
};

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  if (e.matches) {
    changeTheme(THEME_COLORS.DARK);
    color_mode.click();
  } else {
    changeTheme(THEME_COLORS.LIGHT);
  }
});
  
window.addEventListener('DOMContentLoaded', (e) => {
  const root = document.querySelector(':root');
  function changeTheme(palette) {
    for (let name in palette) {  
      root.style.setProperty('--'+name, palette[name]);
    }
  }
  const color_mode = document.getElementById('color-mode');
  
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    changeTheme(THEME_COLORS.DARK);
    color_mode.click();
  } else {
    changeTheme(THEME_COLORS.LIGHT);
  }
  
  color_mode.onclick = () => {
    if (color_mode.checked) {
      changeTheme(THEME_COLORS.DARK);
    } else {
      changeTheme(THEME_COLORS.LIGHT);
    }
  };
});