/**
 * Some helpful functions for CMS integration
 */

// Dependencies
const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const gutil = require('gulp-util');
const { copy } = require('copy-paste');
const argv = require('yargs').argv;
const configUtil = require('./config.js');
const webpackConfig = require('../webpack.config.js');

// Some basics check of CMS config
async function cmsConfig() {
  let { config, error, location } = configUtil.getConfig();
  if (error) {
    throw new gutil.PluginError('cms', error);
  }

  gutil.log(`
Config found at:
  ${gutil.colors.cyan(location)}
`);

  if (config.cms) {
    gutil.log(`
CMS configuration found:
${gutil.colors.cyan(JSON.stringify(config.cms, null, '  '))}
`);
  }
  else {
    gutil.log(
      gutil.colors.yellow(`
Unable to locate the "cms" key in the config; see ./docs/cms.md; this should be something like:
`) +
        gutil.colors.cyan(`
  "cms": {
    "defaultArticleContentTemplateRewriteClass": "article-lcd-body-content",
    "pages": [
      {
        "id": "index",
        "articleId": "222222222",
        "lcd": "11111111",
        "default": true
      },
      {
        "id": "page-two",
        // Shared styles
        "styles": "index",
        "articleId": "33333333",
        "lcd": "4444444",
        "rewriteRules": {
          "custom-class": "_template-id-to-replace"
        }
      }
    ]
  }
    `)
    );
  }
}
cmsConfig.description =
  'Output information about the CMS config in config.json.';

// Get the values for common LCD.
async function lcd() {
  let { config, error } = configUtil.getConfig();
  if (error) {
    throw new gutil.PluginError('cms', error);
  }

  // Check for cms
  if (!config || !config.cms || !config.cms.pages) {
    throw new gutil.PluginError(
      'cms',
      'Unable to find the "cms" or "cms.pages" section in the config.'
    );
  }

  // Gather probably parts
  let pages = config.cms.pages.map(page => {
    let parts = {};
    let prodPath =
      config.publish &&
      config.publish.production &&
      config.publish.production.path
        ? config.publish.production.path
        : undefined;

    // Scripts.  Webpack config is hard to discern if used in a dynamic way
    parts.scripts = prodPath
      ? `${prodPath}/js/${webpackConfig.output.filename.replace(
        '[name]',
        page.id
      )}`
      : undefined;

    // Just hardcoded, since the definition is in the gulp task
    parts.styles = prodPath
      ? `${prodPath}/styles/${page.id}.bundle.css`
      : undefined;

    // Script libraries
    parts['script libraries'] =
      config.js && config.js.globals && config.js.globals.length
        ? `<script src="${config.js.globals.join(
          '"></script>\n<script src="'
        )}"></script>`
        : undefined;

    // Style libraries
    parts['style libraries'] =
      config.styles && config.styles.globals && config.styles.globals.length
        ? `<link rel="stylesheet" type="text/css" href="${config.styles.globals.join(
          '" />\n<link rel="stylesheet" type="text/css" href="'
        )}" />`
        : undefined;

    // Content
    let contentId = page.articleContentTemplate
      ? page.articleContentTemplate
      : `_${page.id}-content`;
    parts.contentLocation = path.join('build', 'rewrites', `${contentId}.html`);
    parts.hasContent = fs.existsSync(
      path.join(__dirname, '..', parts.contentLocation)
    );
    parts.content = parts.hasContent
      ? fs.readFileSync(
        path.join(__dirname, '..', parts.contentLocation),
        'utf-8'
      )
      : undefined;

    page.parts = parts;
    return page;
  });

  // Final output
  gutil.log(`
The following are common values used in the LCD for CMS integration
for this project.

  ${gutil.colors.gray(
    'Note that this is a best guess and may change if\n you have customized the template or project.'
  )}`);

  // Each page
  pages.forEach(page => {
    gutil.log(`

ID: ${gutil.colors.green(page.id)}
=============
Article ID: ${gutil.colors.green(page.articleId)}
LCD: ${gutil.colors.green(page.lcd)}

content:
${
  page.parts.hasContent
    ? gutil.colors.cyan(
      'Contents of file: <' + page.parts.contentLocation + '>'
    )
    : gutil.colors.gray(
      'Unable to get contents, either there is no content template that corresponds to this page ID or the articleContentTemplate is not defined, or the build file is not there (run "gulp").'
    )
}

scripts:
${
  page.parts.scripts
    ? gutil.colors.cyan(page.parts.scripts)
    : gutil.colors.gray(
      'No scripts found, this is either an issue with the Webpack config, \n or there is not a "publish.production" entry in the config.'
    )
}

styles:
${
  page.parts.styles
    ? gutil.colors.cyan(page.parts.styles)
    : gutil.colors.gray(
      'No styles found, make sure there is a "publish.production" entry in the config.'
    )
}

script libraries:
${gutil.colors.cyan(page.parts['script libraries'])}

style libraries:
${
  page.parts['style libraries']
    ? gutil.colors.cyan(page.parts['style libraries'])
    : gutil.colors.gray(
      'No style libraries, include by putting in "styles.global" in the config.'
    )
}
`);
  });

  // Copy
  let defaultPage = _.find(pages, { default: true });
  let copyPage =
    argv.get && argv.get.split('|').length === 2
      ? _.find(pages, { id: argv.get.split('|')[0] })
      : defaultPage;
  let copyPart =
    argv.get && argv.get.split('|').length === 2
      ? argv.get.split('|')[1]
      : argv.get;

  if (argv.get && copyPage && copyPage.parts[copyPart]) {
    await copy(copyPage.parts[copyPart]);
    gutil.log(`
Copied "${argv.get}" to the clipboard.
    `);
  }
  else if (!argv.get) {
    gutil.log(`
Use the --get="property" or --get="id|property" option to copy a value to the clipboard.
    `);
  }
  else {
    gutil.log(`
${gutil.colors.yellow(
    'Unable to find the property "' + argv.get + '" to copy.'
  )}
    `);
  }
}
lcd.description = 'Output LCD values for this project.  This is a best guess.';
lcd.flags = {
  '--get=<LCD_FIELD>':
    '(Optional) Provide the LCD field, such as "content" to copy that value to your clipboard if possible.  for multiple pages, use the format "page-id|lcd-field".'
};

// Exports
module.exports = {
  config: cmsConfig,
  lcd
};
