# Composites Industry Hub — RSS Edition

Shareable, publicly accessible daily news for the composites & carbon fiber industry.
**No API key required.** Pulls from 10 free RSS feeds, auto-refreshes daily via Vercel cron.

## Sources included
- CompositesWorld
- JEC Group
- Reinforced Plastics
- AZO Materials
- Aviation Week
- Automotive World
- Materials Today
- Windpower Monthly
- Aerospace Manufacturing
- Construction News

## Deploy in 5 minutes (no coding)

### Step 1 — Upload to GitHub

1. Go to https://github.com/new
2. Name: `composites-hub` · set to **Public** · click **Create repository**
3. Click **"uploading an existing file"**
4. Upload ALL files keeping folder structure:
   ```
   vercel.json
   package.json
   public/index.html
   api/refresh.js
   api/news.js
   ```
5. Click **Commit changes**

### Step 2 — Deploy to Vercel

1. Go to https://vercel.com — sign in with GitHub
2. **Add New → Project** → select `composites-hub` → **Import**
3. Leave all settings default → **Deploy**
4. ~60 seconds later you have a live public URL ✓

**No environment variables needed.** The site works immediately with no configuration.

### Step 3 — Share

Your URL (e.g. `composites-hub.vercel.app`) is public.
Anyone can visit it — no login, no paywall.

---

## How it works

| What | How |
|------|-----|
| Daily refresh | Vercel cron calls `/api/refresh` at 06:00 UTC every day |
| News fetch | Pulls RSS from 10 industry sources in parallel |
| Categorisation | Keyword rules auto-tag articles by sector |
| Caching | Vercel edge cache serves repeat visitors instantly |
| Manual refresh | ↻ button on the page triggers a fresh fetch |

## Costs
- **Vercel:** Free (Hobby plan)
- **RSS feeds:** Free (all public)
- **Total:** £0 / $0

## Customising
- Add/remove feeds: edit the `FEEDS` array in `api/refresh.js`
- Change refresh time: edit `"schedule"` in `vercel.json` (cron syntax, UTC)
- Adjust category keywords: edit `CATEGORY_RULES` in `api/refresh.js`
