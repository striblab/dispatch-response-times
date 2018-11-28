# CMS integration and publishing

If this project is meant to live within the [Star Tribune CMS](https://cms.clickability.com/cms), overall, this means that the markup and content are stored within the CMS, while the styling and javascript is managed externally, probably on S3.

## Setup

To test the content through a local [news-platform](https://github.com/MinneapolisStarTribune/news-platform/), make sure the following is true:

- Ensure that `ASSETS_STATIC_URL` environment variable set to `http://localhost:3000/` for `news-platform`. This is necessary to use the local version of the assets in this project.
- `news-platform` is installed and running.

### News-platform

`news-platform` TODO

### CMS pages

To setup an article to take advantage of this workflow, for each page needed:

1.  Create an article.
    - Set "Web Page View" (unsure?) to "Yes"
    - (coming soon) Set the `Template overide` that is something like `Full page article vXX`.
1.  Create a connected LCD
    - See below for more about fields, but overall, these should be something like:
      - `content`: Main body of content, this is likely the `build/_index-content.html` file that is rendered.
      - `styles`: `news/projects/all/generator-test/styles.bundle.css`
      - `scripts`: `news/projects/all/generator-test/app.bundle.js`
      - `script libraries` or `style libraries`
1.  Update `config.json`

### Configuration

Configuration to connect the project for development is managed in `config.json`. It should have at least one `pages` entry. For example:

```
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
```

So that we can develop in the `news-platform` environment, we use BrowserSync's rewrite rules to change content as its served. This allows us to put the content of our local templates into the page served through `news-platform`.

#### Shared assets across pages

By using the `styles` or `js` properties in the configuration for a page, you can specify the styles or scripts that are used in that page. For instance, if you put `index` for all the `styles` in the pages, then that one style file will be used for all pages.

You can also, edit the templates directly if you want.

## Publishing

`gulp cms:info` TODO

`gulp cms:lcd` TODO
