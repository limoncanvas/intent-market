# Quick Submit Guide

## 🚀 Fast Track to Colosseum Submission

### 1. Register Agent (Get API Key)

```bash
node scripts/register-agent.js intent-market-agent
```

**SAVE THE API KEY!** You'll need it for everything.

### 2. Set API Key

```bash
export COLOSSEUM_API_KEY=your_api_key_here
```

### 3. Connect to GitHub

```bash
# Create repo on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/intent-market.git
git branch -M main
git push -u origin main
```

### 4. Submit to Colosseum

```bash
# Set your repo URL
export GITHUB_REPO_URL=https://github.com/YOUR_USERNAME/intent-market

# Submit
node scripts/submit-to-colosseum.js
```

### 5. Update with Demo (when ready)

```bash
export DEMO_URL=https://your-demo.vercel.app
node scripts/submit-to-colosseum.js
```

### 6. Final Submit (when complete)

```bash
curl -X POST https://agents.colosseum.com/api/my-project/submit \
  -H "Authorization: Bearer $COLOSSEUM_API_KEY"
```

That's it! 🎉
