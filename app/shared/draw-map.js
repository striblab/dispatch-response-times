/**
 * Main JS file for project.
 */

/* global mapboxgl, MapboxGeocoder, $ */

// Dependencies
import mapConfig from './map-config.js';
import Popover from './popover.js';
import responseTimeLayer from './response-time-layer.js';
import poiLayer from './poi-layer.js';

// Draw map
function drawMap(options = {}) {
  let {
    element,
    twinCitiesBounds,
    twinCitiesCenter,
    responseData,
    addGeocoder
  } = options;

  // Geocoding event issue
  // See: https://github.com/mapbox/mapbox-gl-geocoder/issues/99
  let lastGeocode;

  // Create map
  const map = new mapboxgl.Map({
    container: element,
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
  let geocoder;
  if (addGeocoder) {
    geocoder = new MapboxGeocoder({
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
  }

  // When ready
  map.on('load', () => {
    // Response time layer
    let {
      responseTimeLayerId,
      responseTimeLayerHighlightId
    } = responseTimeLayer(map, responseData);

    // Add pois (fire/police stations)
    poiLayer(map, responseData);

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
    if (geocoder) {
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
    }
  });

  return map;
}

export default drawMap;
