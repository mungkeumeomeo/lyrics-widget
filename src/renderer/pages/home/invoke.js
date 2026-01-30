/*
Performs Spotify API calls safely, fails when a response is not ok
*/
import { halted, fail } from './lifecycle.js';

export const invoke = async (promise) => {
  if (halted) return null;

  const response = await promise;
  if (!response?.ok) {
    fail();
    return null;
  } else {
    return response;
  }
};