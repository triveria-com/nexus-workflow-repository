# nexus-workflow-repository

Public repository of Triveria NEXUS Workflows.

Each workflow is a single Markdown file with YAML frontmatter, stored under
[`workflows/`](workflows/). The repository is published to GitHub Pages as a
small static site: a homepage listing every workflow, and a per-workflow page
that renders the frontmatter (title, summary, questions) and the Markdown body.
Each workflow page has an **Import to NEXUS** button that opens the workflow
directly in the NEXUS environment selected from the dropdown in the header
(Dev or Public Test).

## Adding a new workflow

1. Add a new `workflows/<slug>.md` file, following the frontmatter shape in
   [`workflows/pcf-workflow.md`](workflows/pcf-workflow.md) (`slug`, `title`,
   `summary`, and an optional `questions` list).
2. Push to `main`. The `Deploy GitHub Pages` GitHub Action regenerates
   `workflows/data.json` (the file the site fetches at runtime) and publishes
   the site automatically.

## Local preview

```sh
npm install
npm run build      # generates workflows/data.json from workflows/*.md
npx serve .         # or any static file server; open the printed URL
```

## One-time repository setup

In **Settings → Pages**, set "Build and deployment" → **Source** to
**GitHub Actions**. The included workflow at
[`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)
handles the rest on every push to `main`.
