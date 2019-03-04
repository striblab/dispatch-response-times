/**
 * Main JS file for project.
 */

/* global mapboxgl */

// Dependencies
import utils from './shared/utils.js';

// Mark page with note about development or staging
utils.environmentNoting();

// Mapbox access token
mapboxgl.accessToken =
  'pk.eyJ1Ijoic2hhZG93ZmxhcmUiLCJhIjoiS3pwY1JTMCJ9.pTSXx_LFgR3XBpCNNxWPKA';

// Reload components
import Content from '../templates/_index-content.svelte.html';

// Main component
const app = new Content({
  target: document.querySelector('.article-lcd-body-content'),
  hydrate: true,
  data: {}
});
