/**
 * Add police and fire stations
 */

// Dependencis
import { extend } from 'lodash';
import mplsFireStations from '../../sources/mpls-fire-stations.geo.json';
import mplsPoliceStations from '../../sources/mpls-police-stations.geo.json';

// Main function
function poiLayer(map, responseData) {
  let layers = map.getStyle().layers;
  let firstSymbolId;
  for (let i = 0; i < layers.length; i++) {
    if (layers[i].type === 'symbol') {
      firstSymbolId = layers[i].id;
      break;
    }
  }

  // Layout and paints
  let circlePaint = {
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 4, 18, 9],
    'circle-opacity': 1,
    'circle-color': '#222222'
  };
  let symbolTextMinZoom = 12;
  let symbolLayout = {
    'text-field': 'Station',
    'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
    'text-offset': [0, 0.6],
    'text-anchor': 'top',
    'text-size': {
      stops: [[0, 0], [symbolTextMinZoom, 10], [symbolTextMinZoom + 2, 12]]
    }
  };
  let symbolPaint = {
    'text-halo-color': 'rgba(255, 255, 255, 0.8)',
    'text-halo-width': 1,
    'text-halo-blur': 0.5
  };

  // Mpls fire stations
  if (!responseData || responseData === 'fire') {
    map.addSource('mplsFireStations', {
      type: 'geojson',
      data: mplsFireStations
    });
    map.addLayer(
      {
        id: 'mplsFireStations',
        type: 'circle',
        source: 'mplsFireStations',
        paint: circlePaint
      },
      firstSymbolId
    );
    map.addLayer({
      id: 'mplsFireStationsLabel',
      type: 'symbol',
      source: 'mplsFireStations',
      minzoom: symbolTextMinZoom,
      layout: extend(symbolLayout, {
        'text-field': 'Mpls Fire {STATION_NU}'
      }),
      paint: symbolPaint
    });
  }

  // Mpls police stations
  if (!responseData || responseData === 'police') {
    map.addSource('mplsPoliceStations', {
      type: 'geojson',
      data: mplsPoliceStations
    });
    map.addLayer(
      {
        id: 'mplsPoliceStations',
        type: 'circle',
        source: 'mplsPoliceStations',
        paint: circlePaint
      },
      firstSymbolId
    );
    map.addLayer({
      id: 'mplsPoliceStationsLabel',
      type: 'symbol',
      source: 'mplsPoliceStations',
      minzoom: symbolTextMinZoom,
      layout: extend(symbolLayout, {
        'text-field': 'Mpls Police {BUILDING_N}'
      }),
      paint: symbolPaint
    });
  }
}

export default poiLayer;
