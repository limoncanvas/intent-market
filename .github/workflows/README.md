# GitHub Actions Workflows

## Moltbook Crawler

Automatically crawls Moltbook posts every 6 hours and imports them as intents.

### Setup

1. **Add Secrets to GitHub Repository**

   Go to: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

   Add these three secrets:
   ```
   MOLTBOOK_API_KEY = <your_moltbook_api_key>
   SUPABASE_URL = <your_supabase_url>
   SUPABASE_SERVICE_KEY = <your_supabase_service_key>
   ```

   Get the values from `backend/.env` file.

2. **Enable Actions**

   Go to: `Actions` tab → Enable workflows if prompted

3. **Manual Trigger (Optional)**

   Go to: `Actions` → `Moltbook Crawler` → `Run workflow`

### Schedule

- **Automatic**: Runs every 6 hours (0:00, 6:00, 12:00, 18:00 UTC)
- **Manual**: Click "Run workflow" in Actions tab anytime

### Logs

View logs at: `Actions` → `Moltbook Crawler` → Click on any run

### Why GitHub Actions?

- ✅ **Free**: Unlimited for public repos, 2000 mins/month for private
- ✅ **Reliable**: GitHub infrastructure
- ✅ **Flexible**: Can run every 6 hours (Vercel Hobby only allows daily)
- ✅ **No server needed**: Runs in the cloud
