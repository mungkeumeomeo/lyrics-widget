import { navigateTo } from './router.js';
import { currentToken } from './authorization.js';
import { FONTS } from './styles/fonts.js';

// Generate @font-face dynamically
FONTS.forEach(f => {
  const newFont = new FontFace(
    f.family,
    `url("./../assets/fonts/${f.file}") format("truetype")`,
  );
  newFont.load().then(() => {
    document.fonts.add(newFont);
  });
});

if (!window.localStorage.getItem('path') || 
    currentToken.access_token === 'undefined' || 
    currentToken.expires_in <= 5000) {
  await navigateTo('login');
} else {
  await navigateTo(window.localStorage.getItem('path'));
}

// Window controls logic
const closeBtn = document.querySelector("#close");
const minBtn = document.querySelector("#min");

if (closeBtn) closeBtn.addEventListener("click", () => window.controls.closeWindow());
if (minBtn) minBtn.addEventListener("click", () => window.controls.minimizeWindow());