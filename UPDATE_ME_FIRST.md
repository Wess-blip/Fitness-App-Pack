# Wess Fitness v1.3 - what to do first

The update is already implemented in this repository and the linked Supabase security migrations are already applied.

1. Read `docs/V1_3_UPDATE_GUIDE.md`.
2. Test the app locally if desired with `npm ci`, then `npm test` and `npm run build`.
3. Commit and push the tested files to the GitHub branch linked to Netlify.
4. Wait for the Netlify deploy to show **Published**.
5. Open `https://wessfitness.netlify.app/login` in a private window and complete one Google sign-in.

Do not add an OpenAI key. Food-photo AI was deliberately removed to avoid usage charges.
