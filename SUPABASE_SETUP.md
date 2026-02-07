# Supabase Setup Guide

## Overview

Intent Market uses Supabase as its database backend. Supabase provides a PostgreSQL database with automatic backups, real-time capabilities, and a built-in REST API.

## Setup Steps

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in your project details:
   - **Name**: Intent Market (or your choice)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
5. Wait for the project to be created (~2 minutes)

### 2. Get Your Connection String

Once your project is created:

1. Go to **Settings** → **Database**
2. Scroll down to **Connection string**
3. Select **URI** tab
4. Copy the connection string (it looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

### 3. Configure Backend

1. Copy the connection string
2. Open `backend/.env` file
3. Add your Supabase connection string:

```env
SUPABASE_DB_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

**Important**: Replace `[YOUR-PASSWORD]` with your actual database password.

### 4. Run Database Migrations

The database tables will be created automatically when you start the backend server. The `initDb()` function in `backend/src/db/init.ts` will create all necessary tables.

Alternatively, you can run the SQL directly in Supabase:

1. Go to **SQL Editor** in Supabase dashboard
2. Run the SQL from `backend/src/db/init.ts` (the CREATE TABLE statements)

### 5. Verify Connection

Start your backend:

```bash
cd backend
npm run dev
```

You should see:
```
✅ Database connected
✅ Database tables initialized
🚀 Intent Market API running on port 3001
```

## Alternative: Using Supabase Parameters

Instead of a connection string, you can use individual parameters:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your-password
DB_NAME=postgres
DB_PORT=5432
```

## Security Best Practices

1. **Never commit `.env` files** - They're already in `.gitignore`
2. **Use environment variables** - Don't hardcode credentials
3. **Rotate passwords regularly** - Update your Supabase database password periodically
4. **Use connection pooling** - Supabase handles this automatically
5. **Enable Row Level Security (RLS)** - Consider enabling RLS in Supabase for additional security

## Supabase Features You Can Use

### 1. Real-time Subscriptions

Supabase supports real-time database changes. You can enable this for:
- New intents appearing in real-time
- Match updates
- Agent profile changes

### 2. REST API

Supabase automatically generates a REST API for your tables. You can use this as an alternative to the Node.js backend.

### 3. Authentication

Supabase has built-in authentication. You could integrate this for user management.

### 4. Storage

Supabase provides file storage for:
- Agent avatars
- Intent attachments
- Match documents

## Troubleshooting

### Connection Refused

- Check your connection string is correct
- Verify your Supabase project is active
- Ensure your IP is not blocked (check Supabase dashboard)

### SSL Errors

- Supabase requires SSL connections
- The code automatically handles SSL in production
- If you see SSL errors, check your connection string format

### Table Already Exists

- This is normal if tables were already created
- The `CREATE TABLE IF NOT EXISTS` statements prevent errors
- You can safely ignore these messages

## Migration from Local PostgreSQL

If you're migrating from a local PostgreSQL database:

1. Export your data:
   ```bash
   pg_dump -h localhost -U postgres intent_market > backup.sql
   ```

2. Import to Supabase:
   - Use Supabase SQL Editor
   - Or use `psql` with your Supabase connection string:
   ```bash
   psql "your-supabase-connection-string" < backup.sql
   ```

## Support

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Supabase GitHub: https://github.com/supabase/supabase
