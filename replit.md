# Quad Excursions

Migrazione autorizzata di quadexcursions.com da Framework360 a Replit, con documenti pubblici originali, grafica e percorsi URL conservati.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/quad-excursions run dev` — sito pubblico; usare il workflow gestito per avviarlo
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Il sito pubblico importato non richiede un database. Il backend condiviso resta disponibile per le funzioni da collegare.
- `node scripts/src/import-quad.mjs && node scripts/src/finalize-quad.mjs` — importazione pubblica ripetibile; riutilizza i documenti già recuperati, registra gli errori e applica gli adattamenti

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/quad-excursions/site-pages/` — documenti HTML per URL e relativo inventario
- `artifacts/quad-excursions/migration-plugin.ts` — risposte HTML per percorso, redirect originali, 404 e generazione delle pagine di produzione
- `artifacts/quad-excursions/src/enhance.ts` — interazioni sui documenti originali senza sostituirne il contenuto
- `artifacts/quad-excursions/public/migrated-assets/` — immagini, font e fogli di stile originali salvati localmente
- `artifacts/quad-excursions/migration-report.json` — esito dell'importazione, dipendenze esterne e URL non recuperati
- `generated-artifacts/` — sorgenti di lavoro e inventario scaricabile; esclusi da Git e dalla pubblicazione

## Architecture decisions

- Preservare i documenti HTML completi per fedeltà grafica e indicizzazione senza JavaScript; React gestisce soltanto le interazioni.
- Non modificare gli slug, nemmeno quelli con refusi: la continuità SEO è una richiesta esplicita.
- Non importare lo stato della piattaforma scaduta, gli script gestionali, i token frontend o il tracciamento Framework360.
- Calendari Regiondo, video YouTube e mappe rimangono servizi esterni; gli iframe sono caricati solo dopo consenso.

## Product

Sito informativo multilingue, catalogo di escursioni e prodotti, blog, contatti, ricerca locale, FAQ, gallerie e collegamenti ai calendari Regiondo originali.

La copia pubblica non equivale a una migrazione dei dati gestionali: clienti, ordini, prenotazioni storiche e newsletter richiedono un'esportazione del proprietario. Login, carrello e invio diretto dei moduli non sono attivi; l'interfaccia lo dichiara e offre contatto email/WhatsApp senza fingere invii o pagamenti.

## User preferences

Il proprietario chiede una copia esatta del sito per la migrazione, non un restyling, con tutti i contenuti recuperabili e gli URL SEO conservati.

## Gotchas

- Consultare il rapporto prima di dichiarare completa la migrazione: il sorgente restituisce 404/429 per alcuni URL secondari.
- Non pubblicare o cambiare DNS senza la verifica delle prenotazioni, dei moduli e dei dati privati.
- Un controllo HTTP del calendario Regiondo è stato bloccato dal servizio anti-bot; non dichiarare verificato il completamento delle prenotazioni.
- L'importazione aggiorna i documenti originali; eseguire sempre anche la finalizzazione per consenso iframe, metadati e disabilitazione delle vecchie password.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
