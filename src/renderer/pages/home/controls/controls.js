/*
Font, theme, and background opacity controls
*/
import { FONTS } from '../../../styles/fonts.js';
import { THEMES } from '../../../styles/themes.js';
import { CONTROLS } from './controlsConfig.js';
import { getSelected, setSelected } from './controlsSelected.js';
import { showSelected, resetInfo } from '../info-msg.js';

const homePage = document.getElementById('home-page');
const editBtns = document.querySelectorAll('.edit-btn');

class Control {
  constructor(type) {
    if (new.target === Control) {
      throw new Error('Cannot instantiate abstract class Control');
    }
    this.type = type;
  }
  createUI() {
    throw new Error("createUI() must be implemented");
  }
  async applySelection(id, recordChange) {
    throw new Error("applySelection() must be implemented");
  }
  display() {
    Object.keys(CONTROLS).forEach(c => {
    CONTROLS[c]['element'].style.display = 'none';
    });
    CONTROLS[this.type]['element'].style.display = 'flex';
    const actionBar = document.getElementById('action-bar');
    if (this.type === 'playback') {
      actionBar.style.visibility = 'visible';
    } else {
      actionBar.style.visibility = 'hidden';
    }
  }
}

class FontControl extends Control {
  constructor() {
    super('font');
  }
  createUI() {
    const fontBar = CONTROLS['font']['element'];
    Object.keys(FONTS).forEach(f => {
      const fontBtn = document.createElement('button');
      fontBtn.textContent = 'Aa';
      fontBtn.classList.add('font-btn', `font-${f}`);
      fontBtn.title = FONTS[f]['name'];
      fontBtn.id = f;
      if (f === getSelected('font')) {
        fontBtn.classList.add('underline');  // Indicate currently selected font
      }
      fontBar.appendChild(fontBtn);
    });
  }

  async applySelection(fontId, recordChange=true) {
    // Transform to a CSS-syntax font stack first
    const fontStack = FONTS[fontId]['family'].map(f => `"${f}"`).join(', ');
    homePage.style.setProperty('--font', fontStack);
    if (recordChange) setSelected('font', fontId);
  }
}

class ThemeControl extends Control {
  #coverUrl = '';

  constructor() {
    super('theme');
  }

  createUI() {
    const themeBar = CONTROLS['theme']['element'];
    Object.keys(THEMES).forEach(t => {
      const themeBtn = document.createElement('button');

      const themeIcon = document.createElement('theme-icon');
      themeIcon.setFill(THEMES[t]['background']);
      themeIcon.setStroke(THEMES[t]['text-primary']);
      themeBtn.appendChild(themeIcon);

      themeBtn.classList.add('theme-btn');
      themeBtn.title = THEMES[t].name;
      themeBtn.id = t;

      themeBar.appendChild(themeBtn);
    });
  }

  async applySelection(themeId, recordChange=true) {
    homePage.style.setProperty('--theme-text-primary', THEMES[themeId]['text-primary']);
    homePage.style.setProperty('--theme-text-secondary', THEMES[themeId]['text-secondary']);

    // Make the edit theme button match the currently selected theme
    const editThemeIcon = document.querySelector('theme-icon');
    editThemeIcon.setFill(THEMES[themeId]['background']);
    editThemeIcon.setStroke(THEMES[themeId]['text-primary']);

    // Album theme sets the background image to the album's cover art
    if (themeId === 'album') {
      // If there is no song playing, keep the current theme or switch to default theme
      if (this.#coverUrl === '') { 
        this.applySelection(getSelected('theme') === 'album' ? 'dark' : getSelected('theme'));
        setSelected('theme', 'album');
        return;
      }
      homePage.style.setProperty('--theme-background-image', `url(${this.#coverUrl})`);

      // Text shadow to make lyrics more readable with the background image
      document.getElementById('overlay').style.visibility = 'visible';
      setSelected('theme', themeId);
      return;
    }
    homePage.style.setProperty('--theme-background-image', 'none');
    homePage.style.setProperty('--theme-background-color', THEMES[themeId].background);
    document.getElementById('overlay').style.visibility = 'hidden';  // Hide text shadow
    setSelected('theme', themeId);
  }

  setCoverUrl(url) {
    this.#coverUrl = url;
  }
}

class OpacityControl extends Control {
  constructor() {
    super('opacity');
  }

  createUI() { 
    return; 
  }

  applySelection(value, recordChange=true) {
    document.documentElement.style.setProperty(
      '--background-opacity', value);
    setSelected('opacity', value);
  }
}

class PlaybackControl extends Control {
  constructor() {
    super('playback');
  }
  createUI() { 
    document.getElementById('opacity-slider').value = getSelected('opacity') * 100;
  }
  applySelection(id, recordChange) { return; }
}

const controlObjs = {
  'font': new FontControl(),
  'theme': new ThemeControl(),
  'opacity': new OpacityControl(),
  'playback': new PlaybackControl(),
}

const disableEditBtns = () => editBtns.forEach(btn => btn.disabled = true);
const enableEditBtns = () => editBtns.forEach(btn => btn.disabled = false);

const initControls = () => {
  Object.keys(controlObjs).forEach(c => {
    controlObjs[c].applySelection(getSelected(c));
    controlObjs[c].createUI();
  });

  // Edit buttons in settings bar
  editBtns.forEach(btn => btn.addEventListener('click', () => {
    // e.g. 'theme' from 'edit-theme'
    const controlType = btn.id.slice(5);

    // Toggle the corresponding control type, disable all the others
    Object.keys(CONTROLS).forEach(c => {
      if (c === controlType) {
        // Toggle
        CONTROLS[controlType]['active'] = !CONTROLS[controlType]['active']; 
      } else {
        // Disable everything else
        CONTROLS[c]['active'] = false;  
      }
    });

    if (CONTROLS[controlType]['active']) {
      controlObjs[controlType].display();
      showSelected(controlType); // GAHHHHHHHHHHHHHHHHHHHHHHHHH
    } else {
      // If the current controlType is not active => Exiting out of editing mode => Display playback
      CONTROLS['playback']['active'] = true;
      controlObjs['playback'].display();
      resetInfo(); // GAHHHHHhhhhhhhhhhhhhhhhhHHHHHHHHHHHHHH
    }
  }));

  // Font options
  const fontBtns = document.querySelectorAll('.font-btn');
  fontBtns.forEach(fontBtn => {
    const control = controlObjs['font'];
    const f = fontBtn.id;
    fontBtn.addEventListener('click', () => {
      if (f !== getSelected('font')) {
        document.getElementById(getSelected('font')).classList.remove('underline');
        fontBtn.classList.add('underline');
        control.applySelection(f);
        showInfo('Font change applied !', true);
        setTimeout(() => showSelected('font'), 2000);
      }
    });
    fontBtn.addEventListener('mouseenter', () => {
      showSelected('font', f);
      control.applySelection(f, false);
    });
    fontBtn.addEventListener('mouseleave', () => {
      showSelected('font');
      control.applySelection(getSelected('font'), false);
    });
  });

  // Theme options
  const themeBtns = document.querySelectorAll('.theme-btn');
  themeBtns.forEach(themeBtn => {
    const control = controlObjs['theme'];
    themeBtn.addEventListener('click', () => {
      control.applySelection(themeBtn.id);
      showSelected('theme');
    });
  });

  // Opacity slider
  const opacitySlider = document.getElementById('opacity-slider');
  opacitySlider.addEventListener('input', () => {
    controlObjs['opacity'].applySelection(Number(opacitySlider.value) / 100);
    showSelected('opacity');
  });
}

// resetInfo, showSelected, showInfo

export {
  controlObjs,
  getSelected,
  enableEditBtns,
  disableEditBtns,
  initControls,
};