/**
 * Tasks for local developing.
 */

// Dependencies
const fs = require('fs-extra');
const _ = require('lodash');
const configUtil = require('./config.js');
const bs = require('browser-sync');
const { argv } = require('yargs');

// Browser sync server
async function server() {
  let browserSync = bs.create();
  let { config } = configUtil.getConfig();

  // No CMS, just static server, this is the default
  if (!argv.cms) {
    return browserSync.init({
      port: 3000,
      server: './build/',
      files: './build/**/*',
      logLevel: argv.debug ? 'debug' : 'info'
    });
  }

  // Proxy the dev version of news-platform.  (assumes the host file has been set up)
  // https://github.com/MinneapolisStarTribune/news-platform
  //
  // We serve the build files in a way that can be used by the serve_static
  // function in news-platform.  This means that the path is the same, but
  // the domain changes; locally we serve it from here at localhost:3000,
  // but for production it runs from static.startribune.com.
  //
  // news-platform knows about the local domain through the ASSETS_STATIC_URL
  // environment variable.  This can be in a .env file in your locally running
  // news-platform.
  //
  // The publish.production can change location but the "route" option below
  // will need to change so local and production act the same.
  //
  // serve_static function for reference:
  // https://github.com/MinneapolisStarTribune/news-platform/blob/1a56bd11892f79e5d48a9263bed2db7c5539fc60/app/Extensions/helpers/url.php#L272
  //
  // Rewriting:
  // We also utilise the config.json to tell use about any rewriting.  This
  // is so that we can see in a real environment how the content will look
  // on the page.  For instance, a key of "article-lcd-body-content" will
  // look for the following to replace:
  //
  // <div class="article-lcd-body-content">
  //   ...
  // </div><!-- end article-lcd-body-content -->
  //
  // The value of the key is the file in the build directory.
  //
  // "cms": {
  //   "pages": [{
  //     "id": "aaaa",
  //     "rewriteMapping": {
  //       "article-lcd-body-content": "_index-content"
  //     }
  //   }]
  // },
  //
  // If no rewrite is provided, it will default to assuming
  // the class defined under cms.defaultArticleContentTemplateRewriteClass
  // will use _{ id }-content.svelte.html

  // Check config for cms section
  if (!config.cms) {
    throw new Error(
      'Unable to find a "cms" configuration section in config.json.'
    );
  }

  // Determine which page we are using
  let cmsDefault =
    _.find(config.cms.pages, { default: true }) ||
    _.find(config.cms.pages, { id: 'index' });
  let cmsPage = argv['page-id']
    ? _.find(config.cms.pages, { id: argv['page-id'] })
    : argv['article-id']
      ? argv['article-id']
      : cmsDefault;

  // Create rewrite rules
  let rewriteRules = undefined;
  if (cmsPage) {
    rewriteRules = [];
    let rewriteMapping = {};

    // Add defaults rule
    rewriteMapping[
      config.cms.defaultArticleContentTemplateRewriteClass ||
        'article-lcd-body-content'
    ] = cmsPage.articleContentTemplate
      ? `${cmsPage.articleContentTemplate}`
      : `_${cmsPage.id}-content`;

    // Add any custom rules
    if (cmsPage.rewriteMapping) {
      rewriteMapping = _.extend(rewriteMapping, cmsPage.rewriteMapping);
    }

    _.each(rewriteMapping, (component, id) => {
      rewriteRules.push({
        match: new RegExp(
          `<div class="${id}">([\\s\\S]*)<\\/div>\\s*<!-- end ${id} -->`,
          'im'
        ),
        fn: function(request, response, match) {
          let content = `build/rewrites/${component}.html`;

          // Make sure its only for the CMS pages and we have something
          // to replace it with
          if (fs.existsSync(content)) {
            let inject = fs.readFileSync(content, 'utf-8');

            // Handle rewriting any production path urls for build
            inject = inject.replace(
              new RegExp(config.publish.production.url, 'ig'),
              `/${config.publish.production.path}/`
            );

            return `<div class="${id}">${inject}</div>`;
          }

          return match;
        }
      });
    });
  }

  // Use --cms to proxy local news-platform
  return browserSync.init({
    port: 3000,
    proxy: `http://${argv.mobile ? 'vm-m' : 'vm-www'}.startribune.com/x/${
      cmsPage.articleId
    }?preview=1&cache=trash`,
    serveStatic: [
      {
        route: '/' + config.publish.production.path,
        dir: './build'
      }
    ],
    files: './build/**/*',
    rewriteRules: rewriteRules,
    logLevel: argv.debug ? 'debug' : 'info'
  });
}
server.description =
  'Run a BrowserSync local web server.  If using the --cms flag, will rewrite HTML with built templates, as defined in the config.json under cms.rewriteMapping .';
server.flags = {
  '--cms':
    'Turn on the news-platform proxy.  This requires having the cms.id set in the config.json, and having news-platform running locally with ASSETS_STATIC_URL set to http://localhost:3000',
  '--page-id=<ID>':
    'Uses a specific page ID as defined in the config.json cms pages section; use instead of --article-id; uses { default: true } cms config otherwise.',
  '--article-id=<ID>':
    'Uses a specific article ID to proxy; use instead of --page-id; uses { default: true } cms config otherwise.',
  '--mobile':
    'Requires the --cms flag.  Proxies the mobile version of your local news-platform.',
  '--debug': 'Turns on higher log level for BrowserSync'
};

// Exports
module.exports = {
  server
};
