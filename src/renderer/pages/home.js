import { currentToken } from './../authorization.js';

const songInfo = document.getElementById('song-info');
const lyricPrev = document.getElementById('lyric-prev');
const lyricMain = document.getElementById('lyric-main');
const lyricNext = document.getElementById('lyric-next');

// Find the lyrics position the user is currently at using a binary search approach
const findLyricsPosition = (startTimes, currentTime) => {
  let pos = -1;
  let lo = 0;
  let hi = startTimes.length - 1;
  while (lo <= hi) {
    let mid = Math.floor((lo + hi) / 2);
    if (currentTime < startTimes[mid]) { 
      hi = mid - 1; 
    }
    else if (currentTime > startTimes[mid]) { 
      pos = mid;
      lo = mid + 1;
    }
    else return mid;
  }
  return pos;
}

// Limit main lyric line to 2 lines (equivalent to line-clamp: 2) with ellipsis truncation
const clampLyricHeight = () => {
  while (lyricMain.scrollHeight >= lyricMain.clientHeight + 4) {
    let words = lyricMain.textContent.split(' ');
    words = words.slice(0, -1);
    words[words.length - 1] += '...';
    lyricMain.textContent = words.join(' ');
  }
}

const clampSongWidth = () => {
  const container = document.querySelector('#now-playing p');
  const scrollContainer = document.querySelector('.scroll-container');
  const songInfoDup = document.getElementById('song-info-duplicate');

  songInfoDup.textContent = '';

  console.log(`${container.scrollWidth} ${container.clientWidth}`)
  if (container.scrollWidth > container.clientWidth) {
    scrollContainer.classList.add('scroll-x');

    songInfo.innerHTML += '&nbsp;'.repeat(10);
    songInfoDup.innerHTML = songInfo.innerHTML;
  } else {
    scrollContainer.classList.remove('scroll-x');
  }
}

// Loading "animation" while Puppeteer opens the web player
let count = 0;
const intervalId = setInterval(() => {
  lyricMain.textContent = 'Fetching lyrics' + '.'.repeat(count % 4);
  ++count;
}, 500);

await window.spotify.openWebPlayer();
clearInterval(intervalId);  // Stop loading animation

let previousTrack = "";
let lyrics;
let startTimes = [];

setInterval(async () => {
  if (!currentToken.access_token) { throw new Error('Access token required.'); }

  const state = await window.api.getPlaybackState(currentToken.access_token);
  if (state) {
    const trackName = state['item']['name'];
    const trackId = state['item']['id'];
    const artists = state['item']['artists'].map(artist => artist['name']);

    // On track change
    if (trackName !== previousTrack) {
      lyrics = await window.spotify.getLyrics(trackId);
      startTimes = lyrics['lyrics']['lines'].map(line => line['startTimeMs']);
      // e.g. "Now playing: Slippery People - Talking Heads";
      songInfo.textContent = `${trackName} - ${artists.join(', ')}`;
      clampSongWidth();
    }
    previousTrack = trackName;

    if (lyrics) {
      if (lyrics['lyrics']['syncType'] === 'UNSYNCED') {
        // Unsynced lyrics
        lyricMain.textContent = 'lyrics aint synced yet'; 
      } else {
        // Synced lyrics
        let lineIndex = findLyricsPosition(startTimes, state['progress_ms']);
        lyricPrev.textContent = lineIndex > 0 ? lyrics['lyrics']['lines'][lineIndex - 1]['words'] : '';
        lyricMain.textContent = lineIndex !== -1 ? lyrics['lyrics']['lines'][lineIndex]['words'] : `\u{266A}`;
        lyricNext.textContent = lineIndex < lyrics['lyrics']['lines'].length - 1 ? 
                                lyrics['lyrics']['lines'][lineIndex + 1]['words'] : ``;
        clampLyricHeight();
      }
    } else { 
      // No lyrics available
      lyricPrev.textContent = '';
      lyricMain.textContent = "no lyrics :("; 
      lyricNext.textContent = '';
    }
  } else {
    // 204 No Content: No song playing or try relaunching Spotify app
    songInfo.textContent = '-';
    lyricPrev.textContent = '';
    lyricMain.textContent = 'Start playing something';
    lyricNext.textContent = '';
  }
}, 1000);  // Poll every second to detect song changes