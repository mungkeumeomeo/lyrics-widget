export const CONTROLS = {
  font: {
    element: document.getElementById('font-controls'),
    default: 'epilogue',
    active: false,
  },
  theme: {
    element: document.getElementById('theme-controls'),
    default: 'dark',
    active: false,
  },
  opacity: {
    element: document.getElementById('opacity-controls'),
    default: 0.9,
    active: false,
  },
  playback: {
    element: document.getElementById('playback-controls'),
    active: true,  // Default active control at startup
  }
};