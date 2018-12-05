/**
 * Main JS file for project.
 */

/* global mapboxgl, MapboxGeocoder, $ */

// Dependencies
import utils from './shared/utils.js';
import mapConfig from './shared/map-config.js';
import Popover from './shared/popover.js';
import responseTimeLayer from './shared/response-time-layer.js';
import poiLayer from './shared/poi-layer.js';

import drawMap from './shared/draw-map.js';

// Mark page with note about development or staging
utils.environmentNoting();

// Mapbox access token
mapboxgl.accessToken = mapConfig.accessToken;

// Some points and area
const twinCitiesBounds = [
  [-93.3487129795, 44.8787481227],
  [-92.9895973789, 45.0618881395]
];
const twinCitiesCenter = [-93.191872, 44.960911];

// Draw police map
drawMap({
  element: 'police-explorable-map',
  responseData: 'police',
  twinCitiesBounds,
  twinCitiesCenter,
  addGeocoder: true
});

// Draw fire map
drawMap({
  element: 'fire-explorable-map',
  responseData: 'fire',
  twinCitiesBounds,
  twinCitiesCenter
});
