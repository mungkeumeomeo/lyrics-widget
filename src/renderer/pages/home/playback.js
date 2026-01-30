/*
Playback controls
*/
import { invoke } from './invoke.js';
import { setProgressHitbox, startProgress, stopProgress } from './progress-bar.js';
import { currentToken } from '../../authorization.js';

const playbackBtns = document.querySelectorAll('.playback-btn');
const playPauseBtn = document.getElementById('play-pause');
let isPlaying = false;
let playbackModified = true;  // Flag if user modified playback using in-app controls (as opposed to Spotify's)
let hasPremium = true;
const SKIP_MS = 5000;  // Milliseconds to fast forward / backward

export const checkSubscription = async () => {
  // Disable playback controls if user does not have Spotify Premium
  const user = await invoke(window.api.getCurrentUser(currentToken.access_token));
  hasPremium = (user && user['data']['product'] === 'premium');
  if (!hasPremium) disablePlayback();
};

// Playback buttons enable/disable
export const enablePlayback = () => { 
  if (hasPremium) {
    playbackBtns.forEach(btn => btn.disabled = false);
    setProgressHitbox(true);
  }
};

export const disablePlayback = () => { 
  playbackBtns.forEach(btn => btn.disabled = true);
  setProgressHitbox(false);  // Prevent users from skipping to another position
};

export const checkForPlaybackChange = (isPlayingState) => {
  if (
    playbackModified ||           // Playback modified using in-app controls
    isPlaying !== isPlayingState  // Playback modified using Spotify controls
  ) {
    onPlaybackChange(isPlayingState);
  } 
  playbackModified = false;
}

const onPlaybackChange = (isPlayingState) => {
  // Update isPlaying if playback modified using Spotify controls
  if (!playbackModified) isPlaying = isPlayingState;
  if (isPlaying) {
    playPauseBtn.innerHTML = '<pause-icon />';
    playPauseBtn.title = 'Pause';
    startProgress();
  } else {
    playPauseBtn.innerHTML = '<play-icon />';
    playPauseBtn.title = 'Play';
    stopProgress();
  }
};

// Wiring all the playback buttons
// Play/pause button logic
playPauseBtn.addEventListener('click', async () => {
  playbackModified = true;
  isPlaying = !isPlaying;
  if (!isPlaying) {
    playPauseBtn.innerHTML ='<play-icon />';
    playPauseBtn.title = 'Play';
    await invoke(window.api.pausePlayback(currentToken.access_token));
  } else {
    playPauseBtn.title = 'Pause';
    playPauseBtn.innerHTML ='<pause-icon />';
    await invoke(window.api.startPlayback(currentToken.access_token));
  }
});

// Skip to previous track
const prevTrackBtn = document.getElementById('prev-track');
prevTrackBtn.addEventListener('click', async () => {
  await invoke(window.api.skipToPrevious(currentToken.access_token));
  displayLyrics();
});

// Skip to next track
const nextTrackBtn = document.getElementById('next-track');
nextTrackBtn.addEventListener('click', async () => {
  await invoke(window.api.skipToNext(currentToken.access_token));
  displayLyrics();
});

// Rewind
const rewindBtn = document.getElementById('rewind');
rewindBtn.addEventListener('click', async () => {
  const response = await invoke(window.api.getPlaybackState(currentToken.access_token));
  if (!response) return;
  const state = response['data'];
  const pos = state['progress_ms'] - SKIP_MS;
  await invoke(window.api.seekToPosition(currentToken.access_token, Math.max(0, pos)));
});

// Fast forward
const fastForwardBtn = document.getElementById('fast-forward');
fastForwardBtn.addEventListener('click', async () => {
  const response = await invoke(window.api.getPlaybackState(currentToken.access_token));
  if (!response) return;
  const state = response['data'];
  const pos = state['progress_ms'] + SKIP_MS;
  await invoke(window.api.seekToPosition(currentToken.access_token, pos));
});