# Wess Fitness v1.3 update guide

## What happens when code is published

`Your files -> GitHub -> Netlify build -> live website`

Supabase is separate. It stores sign-in identities and each user's saved app state.

## Publish with GitHub Desktop

1. Open GitHub Desktop.
2. Select the `Fitness-App-Pack` repository.
3. Review the changed-file list.
4. In **Summary**, enter `Upgrade Wess Fitness to v1.3`.
5. Click **Commit to main**.
6. Click **Push origin**.
7. Open Netlify, select **wessfitness**, then open **Deploys**.
8. Wait for the newest deploy to say **Published**.
9. Open the production deploy and test Today, Setup, Projection, Log and Progress.

No manual Netlify redeploy is needed after a normal GitHub push.

## Google sign-in check

The database currently has no authenticated user, so configuration alone has not yet proven the complete flow.

1. Open a private/incognito browser window.
2. Visit `https://wessfitness.netlify.app/login`.
3. Select **Continue with Google**.
4. Complete the Google account screen.
5. Confirm the app returns to `/setup`.
6. Change your display name and wait for **Cloud saved**.
7. In Supabase, check **Authentication -> Users**. One user should appear.
8. Check **Table Editor -> user_app_state**. One row should appear after saving.

If Google reports a redirect mismatch, Google Cloud must contain exactly this authorized redirect URI:

`https://zpqtrfyinvgyikrpgmto.supabase.co/auth/v1/callback`

Supabase **Authentication -> URL Configuration** must contain:

- Site URL: `https://wessfitness.netlify.app`
- Redirect URL: `https://wessfitness.netlify.app/auth/callback`

These two callback addresses are intentionally different.

## Food logging and cost

The OpenAI food-photo endpoint and package are removed. Do not add `OPENAI_API_KEY` to Netlify. Food logging remains manual: description, calories and optional macros. A complete daily total can be marked for regression.

## Roll back if a deploy looks wrong

1. Open Netlify **Deploys**.
2. Open the last known-good published deploy.
3. Choose **Publish deploy**.
4. Fix the newer GitHub commit separately.

This changes which version is live; it does not change ownership or source-code history.
