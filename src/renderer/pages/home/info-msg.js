/*
Manage the info message that shows when lyrics are unsynced or the currently chosen settings
*/
import { FONTS } from '../../styles/fonts.js';
import { THEMES } from '../../styles/themes.js';
import { CONTROLS } from './controls/controlsConfig.js';
import { currentTrack } from './track.js';
import { getSelected } from './controls/controlsSelected.js';

const infoMsg = document.getElementById('info-msg');

const showInfo = (msg, fade=false) => {
  infoMsg.textContent = msg;
  if (fade) {
    infoMsg.classList.remove('fade-out');

    // Force repaint
    requestAnimationFrame(() => {
      infoMsg.classList.add('fade-out');
    });

    infoMsg.classList.remove('fade-out');
  } else {
    infoMsg.classList.remove('fade-out');
  }
};

export const resetInfo = () => { 
  showInfo(currentTrack.isUnsynced ? "Lyrics aren't synced to the track yet." : "");

  // Check which editing mode user is in and show currently selected option for that mode
  for (const c of Object.keys(CONTROLS)) {
    if (CONTROLS[c]['active']) {
      showSelected(c);
      return;
    }
  }
};

export const showSelected = (type, selected) => {
  // Do not show selected info if user is not in editing mode
  if (!(CONTROLS[type]['active']) || type === 'playback') return;
  if (!selected) selected = getSelected(type);
  if (type === 'font') {
    showInfo(`Selected font: ${FONTS[selected]['name']}`);
  } else if (type === 'theme') {
    showInfo(`Selected theme: ${THEMES[selected]['name']}`);
  } else if (type === 'opacity') {
    showInfo(`Opacity: ${Math.round(selected * 100)}%`)
  }
};