# Pages

Multiple pages can easily be managed by naming things similarly. For instance, the default page is `index`, which correspondes to:

- `templates/index.svelte.html`
  - `templates/_index-content.svelte.html`: Note that this is hard/non-automatic link that is managed in the template.
- `js/index.js`
- `styles/index.scss`

To add another page, simple create new files, while replacing the `index` part.

## Share styles or JS

If you want to share files across pages, say, using the same styles, update the templates as needed.

- Specifically for styles, in `templates/shares/_head.svelte.html`, you can edit the line that adds the corresponding styles.

## Multiple pages and CMS integration

See [CMS section](./cms.md).
