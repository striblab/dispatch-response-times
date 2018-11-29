/**
 * Response time color scale
 */

/* global d3 */

// Steps
let colorSteps = [300, 360, 420, 480];

// Scale
let colorScale = d3
  .scaleThreshold()
  .domain(colorSteps)
  .range(d3.schemeYlGnBu[colorSteps.length + 1]);

// Export
export { colorSteps, colorScale };
