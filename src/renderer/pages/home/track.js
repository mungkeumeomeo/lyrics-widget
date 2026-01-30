/*
Manages the current track that is being streamed by the user
*/

export function createTrack(state) {
  return {
    id: state ? state['item']['id'] : '',
    name: state ? state['item']['name'] : '',
    artists: state ? state['item']['artists'].map(artist => artist['name']) : [],
    duration: state ? state['item']['duration_ms'] : 0,
    coverUrl: state ? state['item']['album']['images'][0]['url'] : '',
    lyrics: null,
    isUnsynced: false,
    startTimes: [],
  };
};

export function updateLyrics(track, lyrics) {
  track.lyrics = lyrics;
  if (lyrics) {
    track.isUnsynced = lyrics['lyrics']['syncType'] === 'UNSYNCED';

    // If lyrics are unsynced, distribute lyrics equally
    let startTimes = [];
    if (track.isUnsynced) {
      startTimes = [];
      const len = lyrics['lyrics']['lines'].length;
      const step = Math.floor(track.duration / len);
      for (let i = 0; i < len; i++) {
        startTimes.push(i * step);
      }
    } else {
      startTimes = lyrics['lyrics']['lines'].map(line => line['startTimeMs']);
    }
    track.startTimes = startTimes;
  } else {
    track.isUnsynced = false;
    track.startTimes = [];
  }
};

export let currentTrack = createTrack();

export const setCurrentTrack = (track) => currentTrack = track;