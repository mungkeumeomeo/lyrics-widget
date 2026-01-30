import { CONTROLS } from './controlsConfig.js';

export const getSelected = (type) => {
  const stored = window.localStorage.getItem(type);
  if (stored !== null) {
    return type === 'opacity' ? parseFloat(stored) : stored;
  }
  return CONTROLS[type]['default'];
}

export const setSelected = (type, value) => {
  window.localStorage.setItem(type, value);
}