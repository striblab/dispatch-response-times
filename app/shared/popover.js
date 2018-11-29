/**
 * Pop over for map
 */

// Dependencies
import { forEach, sortBy } from 'lodash';
import { colorScale } from './color-scale.js';

/* global $, d3 */

// Main class
class Popover {
  constructor({ map }) {
    this.map = map;
    $(this.map._container).append(this.layout());
  }

  layout() {
    this.$container = $(`
      <div class="popover">
        <button type="button" class="button-link dark popover-close">x</button>
        <div class="popover-content"></div>
      </div>
    `);

    this.$content = this.$container.find('.popover-content');

    this.$close = this.$container.find('.popover-close');
    this.$close.on('click', () => {
      this.close();
    });

    return this.$container;
  }

  content(feature) {
    let output = '';
    if (!feature) {
      return '';
    }

    if (!feature.properties.incidents) {
      return '<div class="no-incidents">There were no incidents in this area in 2017.</div>';
    }

    if (feature.properties.incidents < 10) {
      output +=
        '<div class="no-incidents">There were less than 10 incidents in 2017 for this area.</div>';
    }

    output += `
      <div class="median-response">
        <span class="median-response-value">
          ${this.secondsToMinutes(feature.properties.median_response_time)}
        </span>

        <span class="median-response-label">
          Median response time for <strong>${feature.properties.incidents.toLocaleString()}</strong> high priority incidents in 2017.
        </span>
      </div>

      <div class="hex-histogram"></div>
    `;

    return output;
  }

  secondsToMinutes(seconds) {
    return (
      `${Math.floor(seconds / 60) || 0} m` +
      (seconds % 60 ? ` ${Math.round(seconds % 60)} s` : '')
    );
  }

  open(e) {
    this.$content.html(this.content(e));
    this.$container.slideDown('fast', () => {
      this.$container.addClass('active');
    });
  }

  close() {
    this.$container.slideUp('fast', () => {
      this.$container.removeClass('active');
    });
  }

  histogramData(feature) {
    let bins = [];
    forEach(feature.properties, (v, k) => {
      let m = k.match(/^histo_([0-9]+)/i);
      if (m) {
        bins.push({ bin: parseInt(m[1], 10), value: v });
      }
    });

    return sortBy(bins, 'bin');
  }

  drawHistogram(feature) {
    if (!feature.properties.incidents) {
      return;
    }

    // Get data
    let data = this.histogramData(feature);
    // Determine interval
    let interval = data[1].bin - data[0].bin;
    // Get dimensions of container
    let $chartContainer = this.$container.find('.hex-histogram');
    let containerWidth = $chartContainer.width();
    let containerHeight = $chartContainer.height();

    // Setup dimensions for chart
    let margin = { top: 10, right: 30, bottom: 30, left: 30 };
    let width = containerWidth - margin.left - margin.right;
    let height = containerHeight - margin.top - margin.bottom;

    // Scales
    let xScale = d3
      .scaleLinear()
      .range([0, width])
      .domain([data[0].bin, data[data.length - 1].bin + interval]);
    let yScale = d3
      .scaleLinear()
      .range([height, 0])
      .domain([0, Math.ceil(d3.max(data, d => d.value) * 1.1)]);

    // Container
    let svg = d3
      .select($chartContainer[0])
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', containerHeight);
    let svgGroup = svg
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    // Axis
    svgGroup
      .append('g')
      .attr('transform', 'translate(0,' + height + ')')
      .call(
        d3
          .axisBottom(xScale)
          .tickSizeOuter(0)
          .tickValues([180, 360, 540, 720, 1200])
          .tickFormat(d => {
            // The last value is anything more than it
            return d === 1200 ? '20+ m' : this.secondsToMinutes(d);
          })
      );

    svgGroup.append('g').call(
      d3
        .axisLeft(yScale)
        .tickSizeOuter(0)
        .tickFormat(d3.format('d'))
    );

    // Bars
    svgGroup
      .selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'histogram-bar')
      // Alight adjustment so that the bar doesn't bleed into axis
      .attr('x', d => xScale(d.bin === 0 ? 5 : d.bin))
      .attr('y', d => yScale(d.value))
      .attr('width', xScale(interval))
      .attr('height', d => height - yScale(d.value))
      .style('fill', d => colorScale(d.bin));

    // Median
    svgGroup
      .append('line')
      .attr('class', 'median-line')
      .attr('x1', xScale(feature.properties.median_response_time))
      .attr('y1', 0)
      .attr('x2', xScale(feature.properties.median_response_time))
      .attr('y2', height);

    svgGroup
      .append('text')
      .attr('class', 'median-label')
      .attr('x', xScale(feature.properties.median_response_time) + 5)
      .attr('y', 0)
      .attr('text-anchor', 'left')
      .text('Median response time');
  }
}

export default Popover;
