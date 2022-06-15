const THEME_COLORS = {
  'LIGHT': {
    'primary': '#391919',
    'secondary': '#e5d783',
    'accent': '#d37e9e',
    'background': '#eeeeee'
  },
  'DARK': {
    'primary': '#fdc07d',
    'secondary': '#0e2c3e',
    'accent': '#6c2943',
    'background': '#22232f'
  }
};
let color_mode;
let color_mode_container;

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
  
  color_mode = document.getElementById('color-mode');
  color_mode_container = document.getElementById('color-mode-container');

  if (localStorage.getItem('color-scheme') == null) {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      changeTheme(THEME_COLORS.DARK);
      color_mode.click();
    } else {
      changeTheme(THEME_COLORS.LIGHT);
    }
  } else {
    if (localStorage.getItem('color-scheme') == 'dark') {
      changeTheme(THEME_COLORS.DARK);
      color_mode.click();
    } else {
      changeTheme(THEME_COLORS.LIGHT);
    }
  }
  
  color_mode.onclick = () => {
    if (color_mode.checked) {
      localStorage.setItem('color-scheme', 'dark');
      changeTheme(THEME_COLORS.DARK);
    } else {
      localStorage.setItem('color-scheme', 'light');
      changeTheme(THEME_COLORS.LIGHT);
    }
  };
});

window.addEventListener('scroll', (e) => {
  if (window.pageYOffset > 0) {
    color_mode_container.classList.add('vanish');
  } else {
    color_mode_container.classList.remove('vanish');
  }
});