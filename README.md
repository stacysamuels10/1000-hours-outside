# Hollis's Hours Outside

A small app for tracking Hollis's time outside, toward 1000 hours a year.
Both parents can log time from their own phone.

## Run locally

Requires Node 22.

    npm install
    npm run dev       # start the app at http://localhost:5173
    npm test          # run the tests

## Deploy

The site is published with GitHub Pages from the `main` branch.

1. Merge or push changes to `main`. The workflow in `.github/workflows/deploy.yml`
   runs the tests, builds the app, and publishes it.
2. One-time setup: in the GitHub repository, go to Settings → Pages and set
   Source to "GitHub Actions".
3. The site appears at https://stacysamuels10.github.io/1000-hours-outside/

## Install on an iPhone

1. Open the site URL in Safari (it does not work the same way in other browsers).
2. Tap the Share button, then "Add to Home Screen".
3. The app opens full screen from its home screen icon.

## Turn on syncing between the two phones

Until this is done, each phone keeps its own separate data. Syncing uses a
free Supabase project to hold the shared data.

1. Create a free project at https://supabase.com.
2. In the project, open the SQL editor, paste the contents of `supabase/schema.sql`,
   and run it.
3. In the project settings, copy the Project URL and the anon public key.
4. Paste both values into `src/config.ts`.
5. Commit and push to `main`. The site redeploys automatically.

Once both phones load the site after this, they share the same data.
