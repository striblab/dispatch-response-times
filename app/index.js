/**
 * Main JS file for project.
 */

/* global mapboxgl */

// Dependencies
import utils from './shared/utils.js';
import Content from '../templates/_index-content.svelte.html';

// Mark page with note about development or staging
utils.environmentNoting();

// Mapbox access token
mapboxgl.accessToken =
  'pk.eyJ1Ijoic2hhZG93ZmxhcmUiLCJhIjoiS3pwY1JTMCJ9.pTSXx_LFgR3XBpCNNxWPKA';

// Share hack
let shareEls = [];
let shareEl = document.querySelector('.share-placeholder');
while (shareEl.firstChild) {
  shareEls.push(shareEl.firstChild);
  shareEl.removeChild(shareEl.firstChild);
}
const attachShare = () => {
  shareEls.forEach(el => {
    document.querySelector('.share-placeholder').appendChild(el);
  });
};

// Main component
window.__interactiveApp = new Content({
  target: document.querySelector('.article-lcd-body-content'),
  hydrate: true,
  data: {
    attachShare
  }
});
