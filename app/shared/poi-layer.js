/**
 * Add police and fire stations
 */

// Dependencis
import mplsFireStations from '../../sources/mpls-fire-stations.geo.json';
import mplsPoliceStations from '../../sources/mpls-police-stations.geo.json';

// Main function
function poiLayer(map) {
  // Mpls fire stations
  map.addSource('mplsFireStations', {
    type: 'geojson',
    data: mplsFireStations
  });
  map.addLayer({
    id: 'mplsFireStations',
    type: 'circle',
    source: 'mplsFireStations',
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 4, 18, 9],
      'circle-opacity': 1,
      'circle-color': '#222222'
    }
  });
  map.addLayer({
    id: 'mplsFireStationsLabel',
    type: 'symbol',
    source: 'mplsFireStations',
    layout: {
      //'icon-image': 'fire-15-00000',
      'text-field': 'Mpls Fire {STATION_NU}',
      'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
      'text-offset': [0, 0.6],
      'text-anchor': 'top',
      'text-size': 11
    }
  });

  // Mpls police stations
  console.log(mplsPoliceStations);
  map.addSource('mplsPoliceStations', {
    type: 'geojson',
    data: mplsPoliceStations
  });
  map.addLayer({
    id: 'mplsPoliceStations',
    type: 'circle',
    source: 'mplsPoliceStations',
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 4, 18, 9],
      'circle-opacity': 1,
      'circle-color': '#222222'
    }
  });
  map.addLayer({
    id: 'mplsPoliceStationsLabel',
    type: 'symbol',
    source: 'mplsPoliceStations',
    layout: {
      //'icon-image': 'fire-15-00000',
      'text-field': 'Mpls Police {BUILDING_N}',
      'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
      'text-offset': [0, 0.6],
      'text-anchor': 'top',
      'text-size': 11
    }
  });
}

export default poiLayer;
