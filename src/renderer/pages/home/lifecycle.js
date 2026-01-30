/*
Manages app's lifecycle
*/
import { navigateTo } from "../../router.js";

export let halted = false;
const intervalIds = [];
const animationIds = [];

export const createInterval = (func, delay) => {
  const id = setInterval(func, delay);
  intervalIds.push(id);
}

export const createAnimationFrame = (callback) => {
  const id = requestAnimationFrame(callback);
  animationIds.push(id);
}

export const fail = () => {
  if (halted) return;
  halted = true;
  navigateTo('error', { reload:false, cache:false });

  // Cleanup
  cleanUp();
}

export const cleanUp = () => {
  // Clear intervals
  intervalIds.forEach(id => clearInterval(id));
  animationIds.forEach(id => cancelAnimationFrame(id));

  // Remove all event listeners by cloning the nodes
  const nodes = [
    ...playbackBtns,
    ...document.querySelectorAll('.edit-btn'),
    ...document.querySelectorAll('.font-btn'),
    ...document.querySelectorAll('.theme-btn'),
    document.getElementById('opacity-slider'),
    ...document.querySelectorAll('#action-bar button'),
  ];
  nodes.forEach(node => {
    node.replaceWith(node.cloneNode(true));
  });
}