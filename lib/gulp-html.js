/**
 * HTML gulp tasks
 */

// Dependencies
const path = require('path');
const gulp = require('gulp');
const gutil = require('gulp-util');
const rename = require('gulp-rename');
const noopener = require('gulp-noopener');
const htmlhint = require('gulp-htmlhint');
const a11y = require('gulp-a11y');
const _ = require('lodash');
const transform = require('gulp-transform');
const { argv } = require('yargs');
const configUtil = require('./config.js');
const BuildData = require('./build-data.js');

// Register svelte includes
require('svelte/ssr/register')({
  extensions: ['.html', '.svelte', '.svelte.html'],
  generate: 'ssr',
  hydratable: true,
  preserveComments: true
});

// Get data
async function getData() {
  let { config } = configUtil.getConfig();
  let buildData = new BuildData(
    _.extend(
      {},
      {
        config: { data: config },
        argv: { data: argv },
        _: { data: _ }
      },
      config.data ? config.data : {},
      {
        // Pull out production url so that we can use it in
        // templates, and then allow browser sync to rewrite it
        // for local developent.  This is specifically helpful
        // for cms integration.
        production: { data: config.publish.production || {} }
      }
    ),
    {
      logger: m => {
        gutil.log(`[${gutil.colors.cyan('html')}] [build-data] ${m}`);
      },
      ignoreInitialCache: argv.cache === false,
      cache: path.join(__dirname, '..', '.cache-build-data'),
      localOutput: path.join(__dirname, '..', 'assets', 'data')
    }
  );
  return await buildData.fetch();
}

// Renders pages with Svelte.
async function htmlSvelte() {
  let { config } = configUtil.getConfig();
  let data = await getData();
  let pagesDir = path.join(process.cwd(), 'templates');

  // Get list of templates that may be used in browserSync's
  // rewrite mapping.
  let rewrites = [];
  if (config.cms && config.cms.pages) {
    config.cms.pages.forEach(p => {
      rewrites.push(
        p.articleContentTemplate
          ? `templates/${p.articleContentTemplate}.svelte.html`
          : `templates/_${p.id}-content.svelte.html`
      );
      if (p.rewriteMapping) {
        rewrites = rewrites.concat(
          _.map(
            _.values(p.rewriteMapping),
            v => `templates/${v.replace(/\.html/, '.svelte.html')}`
          )
        );
      }
    });
  }

  return gulp
    .src(_.filter(_.flatten(['templates/**/!(_)*.svelte.html', rewrites])), {
      allowEmpty: true
    })
    .pipe(
      transform('utf8', (content, file) => {
        // Clear cache first, otherwise watching won't work
        clearRequireCache(pagesDir);
        let s = require(file.path);
        let d = _.cloneDeep(data);

        // Update some data based on template
        d.id = path.basename(file.path, '.svelte.html');
        d.cms =
          (config.cms && config.cms.pages
            ? _.find(config.cms.pages, { id: d.id })
            : {}) || {};

        // Render
        let r = s.render(d);

        // for the includes, we don't want to add the page wrapper.
        return isInclude(file.path)
          ? `${r.css ? r.css.code : ''} ${r.html}`
          : sveltePage(r);
      })
    )
    .pipe(
      rename(function(path) {
        path.basename = path.basename
          .replace(/^_/, 'rewrites/_')
          .replace('.svelte', '');
      })
    )
    .pipe(gulp.dest('build/'));
}
htmlSvelte.description =
  'Main function to build HTML files.  Utilizes Svelte to build components.';
htmlSvelte.flags = {
  '--no-cache': 'Ignores cache in collecting the build data.'
};

// Simple linting, meant for live building
function lintSimple() {
  return gulp
    .src('build/**/!(_)*.html')
    .pipe(noopener.warn())
    .pipe(htmlhint('.htmlhintrc'))
    .pipe(htmlhint.reporter('htmlhint-stylish'));
}
lintSimple.description =
  'Simple HTML linting meant for quick building processes.  Assumes HTML is built in the build folder.';

// Full HTML linting
function lint() {
  return gulp
    .src('build/**/!(_)*.html')
    .pipe(noopener.warn())
    .pipe(htmlhint('.htmlhintrc'))
    .pipe(htmlhint.reporter())
    .pipe(a11y())
    .pipe(a11y.reporter());
}
lint.description =
  'Full HTML linting, including accessibility linting.  Assumes HTML is built in the build folder.';

// Make full html from svelte render
function sveltePage({ html, head, css }) {
  return `<!doctype html>
<html lang="en">
	<head>
    ${head}

		<style>
			${css.code}
		</style>
  </head>

	<body>
		${html}
	</body>
</html>
`;
}

// Clear require cache
function clearRequireCache(prefix) {
  if (prefix) {
    _.each(require.cache, (c, ci) => {
      if (ci.indexOf(prefix) === 0) {
        delete require.cache[ci];
      }
    });
  }
}

// Determine if a path is an include, prefix with _
function isInclude(filepath) {
  return filepath ? filepath.split('/').pop()[0] === '_' : false;
}

// Exports
module.exports = {
  getData,
  htmlSvelte,
  lint,
  lintSimple
};
