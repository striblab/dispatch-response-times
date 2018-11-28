/**
 * Webpack config for building project
 * https://webpack.js.org/
 */
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const _ = require('lodash');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

// For whatever reason babel doesn't seem to work with the Svelte
// loaders unless the config is here
const browsersList = path.join(process.cwd(), 'browserslist');
let browserTargets;
if (fs.existsSync(browsersList)) {
  browserTargets = fs
    .readFileSync(browsersList, 'utf-8')
    .split('\n')
    .filter(l => {
      return l && l[0] !== '#' && l[0] !== '/';
    })
    .join(', ');
}

// Loader configs
const loaders = {
  svelte: {
    loader: 'svelte-loader',
    options: {
      hydratable: true,
      store: true
    }
  },
  babel: {
    loader: 'babel-loader',
    options: {
      cacheDirectory:
        process.env.NODE_ENV === 'development' || process.env.DEBUG
          ? false
          : true,
      presets: [
        [
          '@babel/preset-env',
          {
            debug:
              process.env.NODE_ENV === 'development' || process.env.DEBUG
                ? true
                : false,
            targets: {
              browsers: browserTargets ? browserTargets : 'ie >= 10'
            }
          }
        ]
      ],
      plugins: ['lodash']
    }
  }
};

module.exports = {
  mode:
    ~['development', 'production', 'none'].indexOf(process.env.NODE_ENV) ||
    'production',
  devtool: 'source-map',
  // Needs a key so that [name] can be used in output.
  entry: _.mapKeys(glob.sync('./app/*.js'), v => {
    return path.basename(v, '.js');
  }),
  output: {
    path: path.resolve(__dirname, './build/js'),
    filename: '[name].bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        use: [loaders.babel]
      },
      {
        test: /\.(svelte\.html|svelte)$/,
        use: [loaders.babel, loaders.svelte]
      }
    ]
  },
  optimization: {
    minimizer: [
      new UglifyJSPlugin({
        sourceMap: true,
        uglifyOptions: {
          ecma: 5,
          compress: true,
          safari10: true,
          mangle: {
            safari10: true
          }
        }
      })
    ]
  }
};
