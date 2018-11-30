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
//import MapMarker from './shared/marker.js';

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

// Geocoding event issue
// See: https://github.com/mapbox/mapbox-gl-geocoder/issues/99
let lastGeocode;

// Create map
const map = new mapboxgl.Map({
  container: 'explorable-map',
  style: mapConfig.style,
  attributionControl: false,
  scrollZoom: false,
  minZoom: 10,
  maxZoom: 15,
  center: twinCitiesCenter,
  zoom: 11
});

// Center
map.fitBounds(twinCitiesBounds);

// Add controls
map.addControl(new mapboxgl.NavigationControl());

// Allow scroll zoom on full screen
let fullscreenControl = new mapboxgl.FullscreenControl();
map.addControl(fullscreenControl);
window.document.addEventListener(fullscreenControl._fullscreenchange, () => {
  if (fullscreenControl._fullscreen) {
    map.scrollZoom.enable();
  }
  else {
    map.scrollZoom.disable();
  }
});

// Geocoder container
let $geocoderContainer = $('.address-search');

// Geocoding control
let geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  country: 'us',
  bbox: [
    twinCitiesBounds[0][0],
    twinCitiesBounds[0][1],
    twinCitiesBounds[1][0],
    twinCitiesBounds[1][1]
  ],
  flyTo: false
});
$geocoderContainer.append(geocoder.onAdd(map));

// When ready
map.on('load', () => {
  // Response time layer
  let { responseTimeLayerId, responseTimeLayerHighlightId } = responseTimeLayer(
    map
  );

  // Add pois (fire/police stations)
  poiLayer(map);

  // Close popover and unhighligh
  let closePopover = () => {
    map.setFilter(responseTimeLayerHighlightId, ['==', 'hex_id', '']);
    popover.close();
  };

  // Open popover
  let openPopover = point => {
    // Unsure why, but click doesn't already try to find features
    let features = map.queryRenderedFeatures([point.x, point.y], {
      layers: [responseTimeLayerId]
    });

    // Unhilight and close
    if (!features || !features.length) {
      closePopover();
      return;
    }

    // Highlight and open
    map.setFilter(responseTimeLayerHighlightId, [
      '==',
      'hex_id',
      features[0].properties.hex_id
    ]);
    popover.open(features[0]);
    popover.drawHistogram(features[0]);
    return true;
  };

  // Create popover
  let popover = new Popover({ map });
  map.on('click', responseTimeLayerId, e => {
    if (!e || !e.point) {
      map.setFilter(responseTimeLayerHighlightId, ['==', 'hex_id', '']);
      popover.close();
      return;
    }

    openPopover(e.point);
  });

  // Mouseover events
  map.on('mouseenter', responseTimeLayerId, () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', responseTimeLayerId, () => {
    map.getCanvas().style.cursor = '';
  });

  // Handle geocoder results
  geocoder.on('result', ({ result }) => {
    closePopover();

    // queryRenderedFeatures only looks at current view port so we have to do
    // some stupid ness
    map.flyTo(
      {
        center: result.center,
        zoom: 13
      },
      {
        source: 'geocode-hack'
      }
    );
    map.once('moveend', e => {
      if (!e || !e.source === 'geocode-hack') {
        return;
      }

      // Don't do anything if same geocode
      // if (result.center.toString() === lastGeocode) {
      //   return;
      // }

      // Open popover
      openPopover(map.project(result.center));

      // Mark last geocode
      lastGeocode = result.center.toString();
    });
  });
});
