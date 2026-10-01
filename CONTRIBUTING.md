# Contributing to Security Cards

Thanks for taking the time to contribute.

Security Cards is a collection of library and version specific security guidance
for developers and AI coding agents. The cards live on
[securitycards.rewarelabs.com](https://securitycards.rewarelabs.com). Please read the
[disclaimer](https://securitycards.rewarelabs.com/disclaimer/) before you rely on any
card for real security work.

## Ways to contribute

There are three main ways to help. Choose the path that matches your contribution:

1. **Fix a card.** Spot something wrong or unclear in an existing card? [Open a card-fix
   issue](https://github.com/Reware-Labs/securitycards/issues/new?template=card-content-fix.yml),
   or send a pull request with the fix. See "Editing cards" below for the format.
2. **Request a new card.** Want a card for a library or version we do not cover yet?
   [Open a new-card request](https://github.com/Reware-Labs/securitycards/issues/new?template=new-card-request.yml).
   Cards are generated from a separate pipeline (see the note below), so new cards come
   in as requests rather than direct pull requests.
3. **Improve the docs or tooling.** The README, the agent usage guide, and the scripts in
   `scripts/` are all fair game. [Open a docs or tooling issue](https://github.com/Reware-Labs/securitycards/issues/new?template=docs-or-tooling.yml)
   to discuss a larger change first, or send a focused pull request.

## How card content works

The cards under `data/` are generated and synced from a separate generation repo. You will
see this in the history as `chore(data): sync from securitycards-generation` commits.

Small content fixes to existing cards are welcome as pull requests here, and maintainers
carry those fixes back to the generation source so they are not lost on the next sync. If
you want a brand new card, please open a request issue instead of adding files by hand, so
it can be generated and reviewed the same way as the rest of the catalog.

## Local development

You need Node.js 22.12 or later and npm.

```bash
git clone https://github.com/Reware-Labs/securitycards.git
cd securitycards
npm install
npm run dev
```

Open [http://localhost:4321](http://localhost:4321) in your browser.

Before opening a pull request, run the full checks:

```bash
npm run validate
```

## Editing cards

Cards are Markdown files at `data/<language>/<library>/<version-slug>/<category>.md`. The
format is checked by `scripts/lint-cards.mjs`, so each card needs:

- A `### Title` heading for the card.
- A `**Use when**` block that says when the guidance applies.
- A `**Secure rules**` block.
- At least one rule written as `**Rule 1: ...**`, numbered in order.

Two rollup files sit next to the cards and must stay in step with any change:

- `0_security_blueprint.md`
- `1_all_categories.md`

After you change card content, refresh the generated skill catalog:

```bash
npm run sync:skill-catalog
```

The catalog is checked by `npm run validate:skill`, which also runs as part of
`npm run validate`.

For a card correction, keep the change narrow and include a reliable source when the
guidance depends on library behavior, such as the library's official documentation,
source code, or a security advisory. Keep the card's version scope accurate; guidance
that applies to another version belongs in that version's directory.

## Proposing a new card

New cards are generated and synced from a separate repository. Please use the
[new-card request form](https://github.com/Reware-Labs/securitycards/issues/new?template=new-card-request.yml)
instead of adding a new card directory here. Include the exact library version and
package or lockfile identifier where possible. Links to official documentation, source
code, and advisories help us review the request.

## Pull request checklist

- Run `npm run validate` and make sure it passes.
- Keep the card, the `0_security_blueprint.md` and `1_all_categories.md` rollups, and the
  skill catalog in sync.
- Keep the change focused and describe what you changed and why.
- Be ready to respond to review comments.

## Finding something to work on

Browse issues labelled
[`help wanted`](https://github.com/Reware-Labs/securitycards/labels/help%20wanted) for
work that is ready for a contributor. Request forms may also use this label to make
them easier to find, but a request still needs maintainer triage before it becomes a
ready task. If you want to take a work item, leave a comment so others know it is being
worked on. We are happy to help you get started.

## Conduct

Please be respectful and constructive in issues, pull requests, and reviews.
