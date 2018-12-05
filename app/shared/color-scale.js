/**
 * Response time color scale
 */

/* global d3 */
// We use CDN for browser, but want to share this with Node
if (global && !global.d3 && typeof require !== 'undefined') {
  global.d3 = require('d3');
}

// Steps
let colorSteps = [60 * 6, 60 * 7, 60 * 8, 60 * 9, 60 * 10];

// Scale
let colorScale = d3
  .scaleThreshold()
  .domain(colorSteps)
  .range(d3.schemeYlGnBu[colorSteps.length + 1]);

// Export
module.exports = { colorSteps, colorScale };
