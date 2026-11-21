# Quad Excursions · Nuovo sito

Independent implementation of the approved “Homepage · Layout migliorato”
canvas design. It renders imported pages directly, without embedding the
mockup or importing code/assets from another artifact.

## Behavior

- `site-pages/manifest.json` is the route/content inventory.
- `documents-plugin.ts` serves documents in development and prerenders them
  into `dist/public` for static publication.
- Original titles, descriptions, canonical URLs and language alternates are
  retained. This **separate staging artifact is intentionally noindex**;
  a later approved root-domain cutover must review indexing and canonicals.
- Shared approved CSS and mobile-header structure apply across imported pages.
- Search uses the self-contained local search index.
- Contact/group forms validate locally and open a prefilled WhatsApp message.
  They never claim to have sent anything; no personal data is stored.
- All purchasing/account entry points are assistance/inquiry links.
  This site does not provide customer accounts, online payments or live
  reservation calendars.
- Consent preferences control third-party embeds. No booking embed is restored.

The original `quad-excursions` artifact and DNS are unchanged.

## Local checks

The managed artifact workflow supplies `PORT` and `BASE_PATH`.

```sh
pnpm --filter @workspace/quad-excursions-design run typecheck
pnpm --filter @workspace/quad-excursions-design run build
node artifacts/quad-excursions-design/scripts/verify-build.mjs
```

After importing additional public CSS snapshots, run
`node artifacts/quad-excursions-design/scripts/prepare-assets.mjs`
to make their font/image references relative and prefix-independent.
