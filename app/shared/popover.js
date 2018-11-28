/**
 * Pop over for map
 */

// Dependencies
import { forEach, sortBy } from 'lodash';

/* global $ */

// Publish location
const publishLocation =
  'http://static.startribune.com/news/projects/all/2018-2040-plan/';

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
    if (!feature) {
      return '';
    }

    if (!feature.properties.incidents) {
      return '<div class="no-incidents">There were no incidents in this area.</div>';
    }

    return `
      <div class="median-response">
        <span class="median-response-value">
          ${this.secondsToMinutes(feature.properties.median_response_time)}
        </span>

        <span class="median-response-label">
          Median response time for ${feature.properties.incidents.toLocaleString()} high priority incidents in 2017.
        </span>
      </div>

      <div class="hex-histogram"></div>
    `;
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
    let margin = { top: 10, right: 10, bottom: 30, left: 30 };
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
          .ticks(4)
          .tickFormat(this.secondsToMinutes)
      );

    svgGroup.append('g').call(d3.axisLeft(yScale));

    // Bars
    svgGroup
      .selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'histogram-bar')
      .attr('x', d => xScale(d.bin))
      .attr('y', d => yScale(d.value))
      .attr('width', xScale(interval))
      .attr('height', d => height - yScale(d.value));
  }
}

export default Popover;
