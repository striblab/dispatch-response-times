/**
 * Utility functions.
 */

/* global window, document */

// Dependencies
import queryString from 'query-string';
import _ from 'lodash';

/**
 * Enable pym.
 *
 * @param  {object} options Object with the following keys:
 *           - pym: Enable pym.js, defaults to true
 *           - pymOptions: Options to pass to pym, defaults to:
 *             { polling: 500 }
 * @return {object} Pym child object
 */
function enablePym(options = {}) {
  let pym = options.pym || window.pym;
  if (!pym) {
    throw new Error('Pym object could not be found.');
  }

  let pymOptions = options.pymOptions || { polling: 500 };

  return pym.Child(pymOptions);
}

/**
 * Parse query.
 *
 * @param  {string} search The string to search, defaults to:
 *           document.location.search
 * @return {object} Parsed query as object.
 */
function parseQuery(search) {
  search = _.isUndefined(search) ? document.location.search : search;
  return queryString.parse(search);
}

/**
 * Auto-enable pym.  Looks for pym=* option in query string.
 *
 * @param  {object} enableOptions Options for @see enablePym()
 * @param  {string} search Search string for @see parseQuery()
 * @return {object|undefined} Pym child object if enabled, undefined if not.
 */
function autoEnablePym(enableOptions = {}, search) {
  let query = parseQuery(search);
  if (query.pym) {
    return enablePym(enableOptions);
  }
}

/**
 * Determine environment.
 *
 * @param  {object} environments Object describing how to parse the location
 *           determine the environment.  Something like:
 *           { develop: {
 *              match: /develop/,
 *              note: 'Note...'
 *           }}
 * @param  {object} location Location to test against, uses
 *           window.location.href by default
 * @return {object} Environment
 */
function environment(environments, location) {
  environments = environments || {
    develop: {
      match: /localhost.*|127\.0\.0\.1.*|stribtest.*/i,
      note: 'Development version; this is a work in progress.'
    },
    preview: {
      match: /startribune.*\/.*preview=/i,
      note: 'Preview version; this is not meant for publishing or sharing.'
    },
    staging: {
      match: /static\..*\/.*staging.*\//i,
      note:
        'Staging version; this is a work in progress and not meant for publishing or sharing and may not be accurate '
    },
    production: { default: true }
  };

  // Determine default
  let defaultEnvironment = _.findKey(environments, e => e.default);

  // Allow to pass location manually
  location = _.isUndefined(location) ? window.location.href : location;

  // Find environment
  let environment = _.findKey(environments, e => {
    return _.isRegExp(e.match) && !e.default ? location.match(e.match) : false;
  });

  let found = environments[environment || defaultEnvironment];
  found.id = environment || defaultEnvironment;
  return found;
}

/**
 * Environment noting.  Renders HTML on to the page with any notes.
 *
 * @param  {object} environments Object describing how to parse the location
 *           determine the environment, @see environment()
 * @param  {object} location Location to test against, @see environment()
 * @return {object} Environment
 */
function environmentNoting(environments, location) {
  let e = environment(environments, location);

  // If default, nothing to do.
  if (e.default) {
    return;
  }

  // Create content
  let div = document.createElement('div');
  let body = document.getElementsByTagName('body')[0];
  div.className = `environment-note environment-note-${e.id}`;
  div.innerHTML = `
    <div class="environment-note-title">${e.id}</div>
    <div class="environment-note-note">${e.note}</div>
  `;
  body.insertBefore(div, body.childNodes[0]);
}

/**
 * Super basic deep clone that will only work with primitive objects.
 *
 * @param  {object|array} input Any array or object to clone.
 * @return {object|array} Cloned object
 */
function deepClone(input) {
  return JSON.parse(JSON.stringify(input));
}

let staticEmbedded;
/**
 * Basic check to see if page is embedded in another.
 *
 * @param  {boolean} cache Whether to use the cache, defaults to true.
 * @return {boolean} Whether embedded
 */
function isEmbedded(cache = true) {
  if (!cache || (cache && _.isUndefined(staticEmbedded))) {
    try {
      staticEmbedded = window.self !== window.top;
    }
    catch (e) {
      staticEmbedded = true;
    }
  }

  return staticEmbedded;
}

let staticGeolocation;
/**
 * Check to see if geolocation is available.
 *
 * Unfortunately HTTPS is needed, but in some browsers,
 * the API is still available.  We could run the API, but then the user
 * gets a dialog.  :(
 *
 * @param  {boolean} cache Whether to use the cache, defaults to true.
 * @return {boolean} Whether geolocation
 */
function hasGeolocation(cache = true) {
  if (!cache || (cache && _.isUndefined(staticGeolocation))) {
    staticGeolocation = window.navigator && 'geolocation' in window.navigator;
  }

  return staticGeolocation;
}

/**
 * Geolocation promise wrapper.
 *
 * @param  {boolean} watch Whether to watch for changes.
 * @param  {object} geolocateOptions Options to pass to geolocation function.
 * @return {Promise} An object with { lat, lng, watchId }, if error
 *           the watchId will be attached to error.
 */
function geolocate(watch = false, geolocateOptions) {
  geolocateOptions = geolocateOptions || {
    maximumAge: 5000,
    timeout: 50000,
    enableHighAccuracy: true
  };
  let watchId;

  return new Promise((resolve, reject) => {
    if (hasGeolocation()) {
      // iphone acts weird sometimes about this.  This is some hacky way
      // to ensure it works ok, but who knows.
      // https://stackoverflow.com/questions/3397585/navigator-geolocation-getcurrentposition-sometimes-works-sometimes-doesnt
      window.navigator.geolocation.getCurrentPosition(
        function() {},
        function() {},
        {}
      );

      // Depending on watch, swtich method
      watchId = window.navigator.geolocation[
        watch ? 'watchPosition' : 'getCurrentPosition'
      ](
        position => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            watchId,
            position: position
          });
        },
        error => {
          staticGeolocation = false;
          error = error
            ? error
            : new Error('Unable to find your position for unknown reason.');
          error.watchId = watchId;
          reject(error);
        },
        geolocateOptions
      );
    }
    else {
      reject(new Error('Geolocation not available'));
    }
  });
}

/**
 * Stop geolocation watching function.
 *
 * @param  {object|string} watchId Id from geolocation watching @see geolocate()
 * @return {undefined}
 */
function stopGeolocateWatch(watchId) {
  if (watchId && hasGeolocation()) {
    window.navigator.geolocation.clearWatch(watchId);
  }
}

let staticLocalStorage;
/**
 * Whether browser supports local storage.
 *
 * @param  {boolean} cache Whether to use the cache, defaults to true.
 * @return {boolean} Whether support
 */
function hasLocalStorage(cache = true) {
  if (!cache || (cache && _.isUndefined(staticLocalStorage))) {
    try {
      window.localStorage.setItem('test', 'test');
      window.localStorage.removeItem('test');
      staticLocalStorage = true;
    }
    catch (e) {
      staticLocalStorage = false;
    }
  }

  return staticLocalStorage;
}

/**
 * Scroll to an element.  Uses a few different methods:
 *
 *  1) If page is embbeded (@see isEmbedded() ), and pym child
 *     is passed in options, then use pym.
 *  2) If the [scrollTo](https://github.com/flesler/jquery.scrollTo)
 *     function is available with jQuery, use that.
 *  3) Otherwise, try to use the native scrollIntoView function
 *
 * @param  {DOMElement|jQuery|string} id This can be a DOM element, a jQuery
 *           object, or a string Id to search for.
 * @param  {DOMElement|jQuery|string} parent The parent to scroll with, if
 *           left undefined, uses window.
 * @param  {object} options Various options.
 *           - pym: Pym Child object if this is embedded in with pym.
 *           - duration: How long to animate, if the method supports it.
 * @return {undefined}
 */
function goToElement(id, parent, options = {}) {
  const el = _.isElement(id)
    ? id
    : id[0] && _.isElement(id[0])
      ? id[0]
      : document.getElementById(id);
  let $parent = window.$
    ? _.isUndefined(parent)
      ? window.$(window)
      : window.$(parent)
    : undefined;
  options.duration = options.duration || 1250;

  if (!el) {
    return;
  }

  if (isEmbedded() && options.pym) {
    options.pym.scrollParentToChildEl(el);
  }
  else if ($parent && window.$ && window.$.fn.scrollTo) {
    $parent.scrollTo(window.$(el), options);
  }
  else if (el.scrollIntoView) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}

/**
 * Round a number.
 *
 * @param  {number} input The number to round.
 * @param  {integer} decimals Number of decimals to round to.
 * @return {number} Rounded number, or if input was not a number, the original
 *           value
 */
function round(input, decimals = 0) {
  return _.isNumber(input)
    ? Math.round(input * Math.pow(10, decimals)) / Math.pow(10, decimals)
    : input;
}

let staticAndroid;
/**
 * Is Android browser.
 *
 * @param  {string} input Optional provide user agent search, otherwise
 *           use navigator.userAgent.
 * @param  {boolean} cache Whether to use the cache, defaults to true.
 * @return {boolean} Whether Android browser
 */
function isAndroid(userAgent, cache = true) {
  userAgent =
    userAgent || (window.navigator ? window.navigator.userAgent : undefined);

  if (!cache || (cache && _.isUndefined(staticAndroid))) {
    staticAndroid = userAgent ? !!userAgent.match(/android/i) : false;
  }

  return staticAndroid;
}

let staticIOS;
/**
 * Is iOS browser.
 *
 * @param  {string} input Optional provide user agent search, otherwise
 *           use navigator.userAgent.
 * @param  {boolean} cache Whether to use the cache, defaults to true.
 * @return {boolean} Whether iOS browser
 */
function isIOS(userAgent, cache = true) {
  userAgent =
    userAgent || (window.navigator ? window.navigator.userAgent : undefined);

  if (!cache || (cache && _.isUndefined(staticIOS))) {
    staticIOS = userAgent ? !!userAgent.match(/(iphone|ipad)/i) : false;
  }

  return staticIOS;
}

let staticWindowsPhone;
/**
 * Is Windows Phone browser.
 *
 * @param  {string} input Optional provide user agent search, otherwise
 *           use navigator.userAgent.
 * @param  {boolean} cache Whether to use the cache, defaults to true.
 * @return {boolean} Whether Windows Phone browser
 */
function isWindowsPhone(userAgent, cache = true) {
  userAgent =
    userAgent || (window.navigator ? window.navigator.userAgent : undefined);

  if (!cache || (cache && _.isUndefined(staticWindowsPhone))) {
    staticWindowsPhone = userAgent
      ? !!userAgent.match(/window.?s\s+phone/i)
      : false;
  }

  return staticWindowsPhone;
}

let staticIsMobile;
/**
 * Is a mobile browser.
 *
 * @param  {string} input Optional provide user agent search, otherwise
 *           use navigator.userAgent.
 * @param  {boolean} cache Whether to use the cache, defaults to true.
 * @return {boolean} Whether mobile browser
 */
function isMobile(userAgent, cache = true) {
  userAgent =
    userAgent || (window.navigator ? window.navigator.userAgent : undefined);

  if (!cache || (cache && _.isUndefined(staticIsMobile))) {
    staticIsMobile =
      isAndroid(userAgent, cache) ||
      isIOS(userAgent, cache) ||
      isWindowsPhone(userAgent, cache);
  }

  return staticIsMobile;
}

/**
 * Google analytics page update
 * @see https://developers.google.com/analytics/devguides/collection/analyticsjs/single-page-applications
 *
 * @param  {string} path Optional the path to update, otherwise will use
 *           the document.location values.
 * @return {undefined}
 */
function gaPage(path) {
  if (window.ga) {
    path = path
      ? path
      : document.location.pathname +
        document.location.search +
        document.location.hash;

    window.ga('set', 'page', path);
    window.ga('send', 'pageview');
  }
}

/**
 * Google analytics event wrapper
 * @see https://developers.google.com/analytics/devguides/collection/analyticsjs/events
 *
 * @param  {object} options Options to pass to event, this can include.
 *           - category (required) Typically the object that was interacted with (e.g. 'Video')
 *           - action (required) The type of interaction (e.g. 'play')
 *           - label Useful for categorizing events (e.g. 'Fall Campaign')
 *           - value A numeric value associated with the event (e.g. 42)
 * @return {undefined}
 */
function gaEvent({ category, action, label, value, nonInteraction }) {
  if (window.ga) {
    if (!category) {
      throw new Error('category option is needed for a gaEvent');
    }
    if (!action) {
      throw new Error('action option is needed for a gaEvent');
    }

    window.ga(
      'send',
      'event',
      category,
      action,
      label,
      value,
      nonInteraction
        ? {
          nonInteraction
        }
        : undefined
    );
  }
}

// Export a generator for the class.
export default {
  enablePym,
  autoEnablePym,
  environment,
  environmentNoting,
  parseQuery,
  deepClone,
  isEmbedded,
  hasGeolocation,
  geolocate,
  stopGeolocateWatch,
  hasLocalStorage,
  goToElement,
  round,
  isAndroid,
  isIOS,
  isWindowsPhone,
  isMobile,
  gaPage,
  gaEvent
};
