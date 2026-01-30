/*
Manages all things progress bar
*/
import { invoke } from './invoke.js';
import { createAnimationFrame } from "./lifecycle.js";
import { currentTrack } from './track.js';

const progressBar = document.getElementById('progress-bar');
const PROGRESS_BAR_WIDTH = document.getElementById('home-page').offsetWidth;
let trackProgressMs = 0;     // Current track progress
let playbackProgressMs = 0;  // Overall playback progress
let progressId = null;

// Progress bar
const progressHitbox = document.getElementById('progress-hitbox');
progressHitbox.addEventListener('click', (event) => {
  if (!progressHitbox.classList.contains('enabled')) return;

  // Temporarily stop animation immediately
  stopProgress();

  const mouseX = event.clientX;  // Mouse position relative to the viewport
  const pos = Math.round((mouseX / PROGRESS_BAR_WIDTH) * currentTrack.duration);
  invoke(window.api.seekToPosition(currentToken.access_token, pos));

  // Sync progress and force manual repaint for a smooth progress bar
  syncProgress(pos);
  progressBar.style.width = `${Math.min(pos / currentTrack.duration, 1) * PROGRESS_BAR_WIDTH}px`

  setTimeout(startProgress, 1000);
});

export const startProgress = () => {
  cancelAnimationFrame(progressId);
  progressId = createAnimationFrame(renderProgress);
};

export const stopProgress = () => cancelAnimationFrame(progressId);

// Sync progress every LYRICS_INTERVAL_MS, otherwise estimate progress
export const syncProgress = (progress_ms) => {
  trackProgressMs = progress_ms;
  playbackProgressMs = performance.now();
};

const renderProgress = () => {
  // Estimate progress
  const elapsed = performance.now() - playbackProgressMs;  
  const currentMs = trackProgressMs + elapsed;
  progressBar.style.width = `${Math.min(currentMs / currentTrack.duration, 1) * PROGRESS_BAR_WIDTH}px`;

  progressId = requestAnimationFrame(renderProgress);
};

export const setProgressHitbox = (enabled) => {
  if (enabled) { document.getElementById('progress-hitbox').classList.add('enabled'); }
  else { document.getElementById('progress-hitbox').classList.remove('enabled') };
}