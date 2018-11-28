# Publishing

Overall, the strategy to publish is to host on `static.startribune.com` (S3) and then embed via an iframe, or utilize the CMS's LCD system to manage markup in the CMS and host external resources like JS, CSS, and images on S3.

## Commands

The following command-line `gulp` commands will help you along the way. Make sure to use `gulp tasks` to see up to date list of all tasks.

- `gulp deploy`: This is the big one that will rebuild the project and push up to S3. Use flags like `--staging` or `--production` to publish to a specific place, depending on what your `config.json` looks like (see _Configuration_ below).
- `gulp cms:lcd`: This will output some common values used for the LCD in the CMS.

### AWS/S3 integration

The simplest way to publish to S3 is to use the `gulp deploy` command, though you could manually copy the files up if needed to. To make sure the deploy and publish commands work, you will need to have some AWS credentials setup. These can be set as enivonrment variables, and specifically can be set in the `.env` file.

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- OR `AWS_DEFAULT_PROFILE`

For further reading on setting up access, see [Configureing the JS-SDK](http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/configuring-the-jssdk.html).

## Embed

If this project is best used as an embed via iframe or just a standalone, read below.

### Strib-tag

_strib-tags_ are "macros" used in the CMS. This is the preferred way to embed the project, assuming it gets published to `static.startribune.com`.

Go to [embed-a-writer](http://static.startribune.com/news/tools/embed-it/) and use the _Star Tribune embed_.

### Raw embed

You can also simply use an iframe with some HTML. Specifically, utilize [pym.js](http://blog.apps.npr.org/pym.js/) so that the iframe becomes resopnsive to the content.

```html
<div data-pym-src="https://static.startribune.com/news/projects/all/dispatch-response-times">Loading...</div>
<script src="https://static.startribune.com/assets/libs/pym.js/1.3.2/pym.v1.min.js" type="text/javascript"></script>
```

## CMS

See [CMS page](./cms.md).

## Configuration

Publishing is configured in the `config.json` file. The `publish` property can have the following keys: `default`, `testing`, `staging`, and `production`. It is suggested to use default in place of the `staging` as the default gets used when no flag is specified (see below). Each key should correspond to an object with `bucket`, `path`, and `url`. **IMPORTANT**: The `url` should be a fully qualified URL that ends with a `/`. This URL will get inserted into some meta tags on the page by default. For example:

```js
{
  "publish": {
    "default": {
      "bucket": "static.startribune.com",
      "path": "news/projects-staging/all/dispatch-response-times/",
      "url": "http://static.startribune.com/news/projects-staging/all/dispatch-response-times/"
    },
    "production": {
      "bucket": "static.startribune.com",
      "path": "news/projects/all/dispatch-response-times/",
      "url": "http://static.startribune.com/news/projects/all/dispatch-response-times/"
    }
  }
}
```

Using the flags `--testing`, `--staging`, or `--production` will switch context for any relevant `publish` or `deploy` commands. Note that if the flag is not configured, the `default` will be used.

### Publishing token

The publishing function, uses a token that helps ensure a name collision with another project doesn't overwrite files unwittingly. The `publishToken` in `config.json` is used as an identifier. This gets deployed to S3 and then checked whenever publishing happens again.

If you see an error message that states that the tokens do not match, make sure that the location you are publishing to doesn't have a different project at it, or converse with teammates or administrators about the issue.
