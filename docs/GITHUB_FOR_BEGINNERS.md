# Updating the app through GitHub and Netlify

## Easiest method: GitHub Desktop

1. Install GitHub Desktop and sign in.
2. Clone your private FormLab repository to your computer.
3. Open the downloaded FormLab v1.2 ZIP.
4. Copy the files **inside** the v1.2 folder into the cloned repository folder.
5. Choose **Replace files** when Windows asks.
6. Return to GitHub Desktop. It will list the changed files.
7. In the bottom-left Summary box, type: `Upgrade FormLab to v1.2`.
8. Click **Commit to main**.
9. Click **Push origin**.
10. Netlify detects the push, builds the app and publishes it automatically.

## Important difference

- **Commit** saves a named version on your computer.
- **Push** sends that committed version to GitHub.
- **Netlify deploy** builds the pushed GitHub version into the live website.

## Safe testing with a branch

1. In GitHub Desktop choose Current branch > New branch.
2. Name it `v1-2-test`.
3. Make or copy changes, commit and push.
4. Netlify can create a Deploy Preview without changing production.
5. Merge the branch into `main` only after testing.

## Command-line alternative

```bash
git pull origin main
git add .
git commit -m "Upgrade FormLab to v1.2"
git push origin main
```

## Rollback

Netlify keeps prior deploys. Open Deploys, choose the last working deploy, and publish that deploy while fixing the newer version.
