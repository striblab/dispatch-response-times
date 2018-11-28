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

// Geocoding event issue
// See: https://github.com/mapbox/mapbox-gl-geocoder/issues/99
let lastGeocode;

// Create map
const map = new mapboxgl.Map({
  container: 'explorable-map',
  style: mapConfig.style,
  attributionControl: false,
  scrollZoom: false
});

// Center
map.fitBounds([
  [-93.3487129795, 44.8787481227],
  [-92.9895973789, 45.0618881395]
]);

// Add controls
map.addControl(new mapboxgl.NavigationControl());

// Geocoder container
let $geocoderContainer = $('.address-search');

// Geocoding control
let geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  country: 'us',
  bbox: [-93.351288, 44.874126, -93.16143, 45.060676]
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

  // Create popover
  let popover = new Popover({ map });
  map.on('click', responseTimeLayerId, e => {
    if (!e) {
      map.setFilter(responseTimeLayerHighlightId, ['==', 'hex_id', '']);
      popover.close();
      return;
    }

    // Unsure why, but click doesn't already try to find features
    var bbox = [[e.point.x - 1, e.point.y - 1], [e.point.x + 1, e.point.y + 1]];
    var features = map.queryRenderedFeatures(bbox, {
      layers: [responseTimeLayerId]
    });

    if (!features || !features.length) {
      map.setFilter(responseTimeLayerHighlightId, ['==', 'hex_id', '']);
      popover.close();
      return;
    }

    map.setFilter(responseTimeLayerHighlightId, [
      '==',
      'hex_id',
      features[0].properties.hex_id
    ]);
    popover.open(features[0]);
    popover.drawHistogram(features[0]);
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
    // Don't do anything if same geocode
    if (result.center.toString() === lastGeocode) {
      return;
    }

    // TODO: This doesn't seem to work.  It doesn't work on
    // first geocode, then gets wrong point on next one.
    //
    // // See if we have data
    // let features = map.queryRenderedFeatures(result.geometry.coordinates, {
    //   layers: [mapConfig.dataLayer]
    // });
    // console.log(features);
    // if (features && features.length) {
    //   popover.open({ features });
    // }
    // else {
    //   popover.close();
    // }
    popover.close();

    // Mark last geocode
    lastGeocode = result.center.toString();
  });
});
