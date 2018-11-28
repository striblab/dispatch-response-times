/**
 * Test for front-end app utils.js
 */

/**
 * @jest-environment jsdom
 */

// Available from Jest
// https://facebook.github.io/jest/docs/en/api.html#content
// https://facebook.github.io/jest/docs/en/expect.html#content

// Implicit dependencies
/* global describe, it, expect, jest */

// Dependenciest to test
import utils from '../../app/shared/utils.js';

// Test core utils object
describe('utils', () => {
  it('should load', () => {
    expect(utils).toBeTruthy();
  });
});

// Test enablePym function
describe('enablePym', () => {
  it('should be a function', () => {
    expect(utils.enablePym).toBeDefined();
  });

  it('should throw error if pym provided as undefined', () => {
    global.window.pym = undefined;
    expect(() => {
      utils.enablePym({ pym: undefined });
    }).toThrow();
  });

  it('should throw error if pym is not in window', () => {
    global.window.pym = undefined;
    expect(() => {
      utils.enablePym();
    }).toThrow();
  });

  it('should return object if pym is in window', () => {
    global.window.pym = { Child: jest.fn(() => true) };
    expect(utils.enablePym()).toBeTruthy();
  });
});

// Test auto-enable function
describe('autoEnablePym', () => {
  it('should be a function', () => {
    expect(utils.autoEnablePym).toBeDefined();
  });

  it('should return undefined if not in query', () => {
    expect(utils.autoEnablePym(undefined, 'nopym')).toBeUndefined();
  });

  it('should throw if pym in query but pym not in window', () => {
    global.window.pym = undefined;
    expect(() => {
      utils.autoEnablePym(undefined, 'pym=true');
    }).toThrow();
  });

  it('should return object if pym in query and pym is in window', () => {
    global.window.pym = { Child: jest.fn(() => true) };
    expect(utils.autoEnablePym(undefined, 'pym=true')).toBeTruthy();
  });
});

// Test parseQuery function
describe('parseQuery', () => {
  it('should return empty object', () => {
    expect(utils.parseQuery()).toEqual({});
    expect(utils.parseQuery('')).toEqual({});
    expect(utils.parseQuery(null)).toEqual({});
    expect(utils.parseQuery(undefined)).toEqual({});
  });
  it('should return properties', () => {
    expect(utils.parseQuery('null')).toEqual({ null: null });
    expect(utils.parseQuery('property=2')).toEqual({ property: '2' });
    expect(utils.parseQuery('prop1=1&prop2=2')).toEqual({
      prop1: '1',
      prop2: '2'
    });
  });
  it('should return arrays for multiple values', () => {
    expect(utils.parseQuery('arr=1&arr=2')).toEqual({ arr: ['1', '2'] });
  });
});

// Test environment function
describe('environment', () => {
  it('should be a function', () => {
    expect(utils.environment).toBeDefined();
  });

  it('should default to production', () => {
    expect(utils.environment(undefined, '').id).toBe('production');
  });

  it('should handle localhost', () => {
    expect(utils.environment(undefined, 'http://localhost/').id).toBe(
      'develop'
    );
    expect(utils.environment(undefined, 'http://127.0.0.1/').id).toBe(
      'develop'
    );
    expect(utils.environment(undefined, 'http://localhost:3000/').id).toBe(
      'develop'
    );
    expect(
      utils.environment(undefined, 'http://localhost:3000/?preview=1').id
    ).toBe('develop');
    expect(
      utils.environment(undefined, 'https://localhost:3000/path/?thing=1').id
    ).toBe('develop');
    expect(utils.environment(undefined, 'localhost:3000').id).toBe('develop');
    expect(
      utils.environment(
        undefined,
        'ttps://s3.amazonaws.com/stribtest-bucket/news/projects/project'
      ).id
    ).toBe('develop');
  });

  it('should handle staging', () => {
    expect(
      utils.environment(
        undefined,
        'http://static.startribune/news/staging/project/index.html?thing=2'
      ).id
    ).toBe('staging');
    expect(
      utils.environment(
        undefined,
        'http://static.startribune.com/news/projects-staging/all/project/'
      ).id
    ).toBe('staging');
  });

  it('should handle preview', () => {
    expect(utils.environment(undefined, 'startribune/?preview=1').id).toBe(
      'preview'
    );
    expect(
      utils.environment(
        undefined,
        'http://vm-www.startribune/x/123456/?preview=1'
      ).id
    ).toBe('preview');
    expect(
      utils.environment(
        undefined,
        'http://vm-www.startribune/x/123456/?other=thing&preview=23232'
      ).id
    ).toBe('preview');
  });
});

// Test deepClone function
describe('deepClone', () => {
  it('should throw error on undefined', () => {
    expect(() => {
      utils.deepClone(undefined);
    }).toThrow();
  });

  it('should clone primitive types', () => {
    expect(utils.deepClone(1)).toBe(1);
    expect(utils.deepClone('1')).toBe('1');
    expect(utils.deepClone('abc')).toBe('abc');
    expect(utils.deepClone(null)).toBe(null);
  });

  it('should clone an object', () => {
    expect(utils.deepClone({ a: 'b' })).toEqual({ a: 'b' });
    expect(utils.deepClone({ a: { b: 'c' } })).toEqual({ a: { b: 'c' } });
    expect(utils.deepClone({ a: { b: ['c', 'd'] } })).toEqual({
      a: { b: ['c', 'd'] }
    });
  });

  it('should clone an array', () => {
    expect(utils.deepClone([1, 2, 3])).toEqual([1, 2, 3]);
    expect(utils.deepClone([{ a: 'b' }, { c: 'd' }])).toEqual([
      { a: 'b' },
      { c: 'd' }
    ]);
  });
});

// Test isEmbedded function
describe('isEmbedded', () => {
  it('should exist', () => {
    expect(utils.isEmbedded).toBeTruthy();
  });

  it('should return false', () => {
    expect(utils.isEmbedded()).toBe(false);
  });
});

// Test hasGeolocation function
describe('hasGeolocation', () => {
  it('should exist', () => {
    expect(utils.hasGeolocation).toBeTruthy();
  });

  it('should return false', () => {
    expect(utils.hasGeolocation()).toBe(false);
  });
});

// Test geolocate function
describe('geolocate', () => {
  it('should exist', () => {
    expect(utils.geolocate).toBeTruthy();
  });

  // it('should return promise', () => {
  //   expect(utils.geolocate().then).toBeTruthy();
  // });

  // it('should reject', () => {
  //   return expect(utils.geolocate()).rejects.toThrow();
  // });
});

// Test stopGeolocateWatch function
describe('stopGeolocateWatch', () => {
  it('should exist', () => {
    expect(utils.stopGeolocateWatch).toBeTruthy();
  });
});

// Test hasLocalStorage function
describe('hasLocalStorage', () => {
  it('should exist', () => {
    expect(utils.hasLocalStorage).toBeTruthy();
  });

  it('should return true with jsdom', () => {
    expect(utils.hasLocalStorage()).toBe(true);
  });
});

// Test goToElement function
describe('goToElement', () => {
  it('should exist', () => {
    expect(utils.goToElement).toBeTruthy();
  });
});

// Test round function
describe('round', () => {
  it('should round numbers', () => {
    expect(utils.round(0)).toBe(0);
    expect(utils.round(111.11)).toBe(111);
    expect(utils.round(111.88)).toBe(112);
    expect(utils.round(111.11111, 3)).toBe(111.111);
    expect(utils.round(1111, -2)).toBe(1100);
    expect(utils.round(-1111, -2)).toBe(-1100);
  });

  it('should pass through non numbers', () => {
    expect(utils.round(null)).toBe(null);
    expect(utils.round(undefined)).toBe(undefined);
    expect(utils.round('1')).toBe('1');
    expect(utils.round([1])).toEqual([1]);
    expect(utils.round({ a: 'b' })).toEqual({ a: 'b' });
  });
});

// Test isAndroid function
describe('isAndroid', () => {
  it('should exist', () => {
    expect(utils.isAndroid).toBeTruthy();
  });
  it('should not find android without user agent', () => {
    global.window.navigator = { userAgent: undefined };
    expect(utils.isAndroid(undefined, false)).toBe(false);
  });
  it('should find android in given user agent', () => {
    expect(utils.isAndroid('Is a Android browser', false)).toBe(true);
  });

  // Can't seem to override navigator
  // it('should find android in navigator user agent', () => {
  //   global.window.navigator = { userAgent: 'THIS IS AN ANDROID/things' };
  //   expect(utils.isAndroid(undefined, false)).toBe(true);
  // });
});

// Test isIOS function
describe('isIOS', () => {
  it('should exist', () => {
    expect(utils.isIOS).toBeTruthy();
  });
  it('should not find ios without user agent', () => {
    global.window.navigator = { userAgent: undefined };
    expect(utils.isIOS(undefined, false)).toBe(false);
  });
  it('should find ios in given user agent', () => {
    expect(utils.isIOS('Is an iPhone', false)).toBe(true);
    expect(utils.isIOS('Is an IPad, oh yes', false)).toBe(true);
  });
});

// Test isWindowsPhone function
describe('isWindowsPhone', () => {
  it('should exist', () => {
    expect(utils.isWindowsPhone).toBeTruthy();
  });
  it('should not find windows phone without user agent', () => {
    global.window.navigator = { userAgent: undefined };
    expect(utils.isWindowsPhone(undefined, false)).toBe(false);
  });
  it('should find windows phone in given user agent', () => {
    expect(utils.isWindowsPhone('Is a Windows PHONE', false)).toBe(true);
    expect(utils.isWindowsPhone('Is a WINDOW\'s phone', false)).toBe(true);
  });
});

// Test isMobile function
describe('isMobile', () => {
  it('should exist', () => {
    expect(utils.isMobile).toBeTruthy();
  });
  it('should not find mobile phone without user agent', () => {
    global.window.navigator = { userAgent: undefined };
    expect(utils.isMobile(undefined, false)).toBe(false);
  });
  it('should find mobile phone in given user agent', () => {
    expect(utils.isMobile('Is a Windows PHONE', false)).toBe(true);
    expect(utils.isMobile('android', false)).toBe(true);
    expect(utils.isMobile('iphone this is', false)).toBe(true);
  });
});

// Test gaPage function
describe('gaPage', () => {
  it('should exist', () => {
    expect(utils.gaPage).toBeTruthy();
  });
  it('doesn\'t throw if no ga', () => {
    global.window.ga = undefined;
    expect(() => {
      utils.gaPage();
    }).not.toThrow();
  });
  it('adds to ga', () => {
    global.window._ga = [];
    global.window.ga = jest.fn((...args) => global.window._ga.push([...args]));
    utils.gaPage('example-path');

    expect(global.window._ga).toEqual([
      ['set', 'page', 'example-path'],
      ['send', 'pageview']
    ]);
  });
});

// Test gaEvent function
describe('gaEvent', () => {
  it('should exist', () => {
    expect(utils.gaEvent).toBeTruthy();
  });

  it('doesn\'t throw if no ga', () => {
    global.window.ga = undefined;

    expect(() => {
      utils.gaEvent({ category: 'c', action: 'a' });
    }).not.toThrow();
  });

  it('throw if category is not provided', () => {
    global.window._ga = [];
    global.window.ga = jest.fn((...args) => global.window._ga.push([...args]));

    expect(() => {
      utils.gaEvent({});
    }).toThrow();
  });

  it('throw if action is not provided', () => {
    global.window._ga = [];
    global.window.ga = jest.fn((...args) => global.window._ga.push([...args]));

    expect(() => {
      utils.gaEvent({ category: 'c' });
    }).toThrow();
  });

  it('adds to ga', () => {
    global.window._ga = [];
    global.window.ga = jest.fn((...args) => global.window._ga.push([...args]));
    utils.gaEvent({
      category: 'c',
      action: 'a',
      label: 'l',
      value: 1,
      nonInteraction: true
    });

    expect(global.window._ga).toEqual([
      [
        'send',
        'event',
        'c',
        'a',
        'l',
        1,
        {
          nonInteraction: true
        }
      ]
    ]);
  });
});
