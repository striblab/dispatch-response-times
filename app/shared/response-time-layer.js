/**
 * Add response time layer
 */

/* global topojson */

// Dependencis
import { flatten } from 'lodash';
import { colorSteps, colorScale } from './color-scale.js';
import policeTopo from '../../sources/hexbin-analysis-police.topo.json';
//import fireTopo from '../../sources/hexbin-analysis-fire.topo.json';

// Convert hexbins
const hexbins = {
  police: topojson.feature(
    policeTopo,
    policeTopo.objects['hexbin-analysis-police.geo']
  )
  //fire: topojson.feature(fireTopo, fireTopo.objects['hexbin-analysis-fire.geo'])
};

// Main function
function responseTimeLayer(map, responseData) {
  //console.log(policeTopo);
  //console.log(hexbins[responseData]);

  // Load pattern image
  map.loadImage(
    './assets/images/patterns/white-stripes-64.png',
    (error, image) => {
      if (error) {
        console.error(error);
      }
      map.addImage('low-incidents-pattern', image);

      // Add hexbin source
      map.addSource('responseTimes', {
        type: 'geojson',
        data: hexbins[responseData]
      });

      let styles = {
        // https://www.mapbox.com/mapbox-gl-js/style-spec/#layers-fill
        'fill-color': [
          'case',
          ['<', ['get', 'incidents'], 1],
          '#FCFCFC',
          ['==', ['get', 'incidents'], null],
          '#FCFCFC',
          ['step', ['get', 'median_response_time']]
            .concat([colorScale(0)])
            .concat(
              flatten(
                colorSteps.map(s => {
                  return [s, colorScale(s)];
                })
              )
            )
        ],
        'fill-opacity': 1
        //'fill-outline-color': '#FFFFFF'
      };

      // Put geojson under the label
      // https://www.mapbox.com/mapbox-gl-js/example/geojson-layer-in-stack/
      let layers = map.getStyle().layers;

      // Find the index of the first symbol layer in the map style
      let firstLineId;
      for (let i = 0; i < layers.length; i++) {
        if (layers[i].type === 'line') {
          firstLineId = layers[i].id;
          break;
        }
      }
      let firstSymbolId;
      for (let i = 0; i < layers.length; i++) {
        if (layers[i].type === 'symbol') {
          firstSymbolId = layers[i].id;
          break;
        }
      }

      // Add style layer
      map.addLayer(
        {
          id: 'responseTimes',
          type: 'fill',
          source: 'responseTimes',
          paint: styles
          //"filter": ["==", "$type", "Polygon"]
        },
        'road-primary'
      );

      // Add pattern layer
      // Note data-driven fill-pattern did not work
      map.addLayer(
        {
          id: 'responseTimesPatterns',
          type: 'fill',
          source: 'responseTimes',
          paint: {
            'fill-pattern': 'low-incidents-pattern',
            'fill-opacity': 0.75
          },
          filter: [
            'all',
            ['==', ['typeof', ['get', 'incidents']], 'number'],
            ['<', ['get', 'incidents'], 20],
            ['>', ['get', 'incidents'], 0]
          ]
        },
        firstSymbolId
      );

      // Add highlight layer
      map.addLayer(
        {
          id: 'responseTimeHighlight',
          type: 'line',
          source: 'responseTimes',
          paint: {
            'line-width': 4,
            'line-color': '#222222'
          },
          filter: ['==', 'hex_id', '']
        },
        firstSymbolId
      );

      // Make road lines a bit see-through
      for (let i = 0; i < layers.length; i++) {
        if (layers[i].type === 'line') {
          map.setPaintProperty(layers[i].id, 'line-opacity', 0.6);
        }
      }

      // On different zoom levels, change
      map.on('zoomend', () => {
        let z = map.getZoom();
        if (z < 11.5) {
          map.moveLayer('responseTimes', 'road-primary');
        }
        else if (z < 13) {
          map.moveLayer('responseTimes', 'road-secondary-tertiary');
        }
        else if (z >= 13) {
          map.moveLayer('responseTimes', firstLineId);
        }

        // Road line opacity
        for (let i = 0; i < layers.length; i++) {
          if (layers[i].type === 'line') {
            map.setPaintProperty(
              layers[i].id,
              'line-opacity',
              z < 13 ? 0.6 : 1
            );
          }
        }
      });
      map.fire('zoomend');
    }
  );

  // Return ids
  return {
    responseTimeLayerId: 'responseTimes',
    responseTimeLayerHighlightId: 'responseTimeHighlight'
  };
}

export default responseTimeLayer;
