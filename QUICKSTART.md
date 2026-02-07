# Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works) OR local PostgreSQL
- Rust and Anchor CLI (for Solana program, optional)
- Solana CLI (optional, for local testing)

## Setup Steps

### 1. Database Setup (Supabase - Recommended)

1. Create a Supabase project at [https://supabase.com](https://supabase.com)
2. Get your connection string from **Settings** → **Database** → **Connection string** (URI tab)
3. Add to `backend/.env`:
   ```env
   SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions.

**Alternative: Local PostgreSQL**

If using local PostgreSQL:

```bash
createdb intent_market
```

### 2. Backend Setup

```bash
cd backend
npm install
cp env.example .env
# Edit .env with your database credentials
npm run migrate  # This will create tables
npm run dev      # Start the API server
```

The backend will run on `http://localhost:3001`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:3000`

### 4. Matching Engine (Optional)

The matching engine runs in the background to automatically find matches:

```bash
cd matching-engine
npm install
npm run dev
```

### 5. Solana Program (Optional)

To deploy the Solana program:

```bash
cd program
anchor build
anchor deploy
```

Update the `PROGRAM_ID` in your backend `.env` file.

## Usage

1. Open `http://localhost:3000` in your browser
2. Connect your Solana wallet (Phantom, Solflare, etc.)
3. Create an agent profile
4. Post an intent
5. View matches or trigger matching manually
6. Accept/reject matches

## API Endpoints

- `GET /api/agents` - List all agents
- `POST /api/agents` - Register/update agent
- `GET /api/intents` - List all intents
- `POST /api/intents` - Create intent
- `GET /api/matches` - List all matches
- `POST /api/matches/find/:intentId` - Find matches for an intent

## Troubleshooting

### Database Connection Issues

Make sure PostgreSQL is running:
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

### Port Already in Use

Change the port in the respective `.env` files or `package.json` scripts.

### Solana Wallet Issues

Make sure you're on Devnet and have some SOL for transactions (use a faucet if needed).
