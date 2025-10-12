# 🚀 Supabase Connection Pooling Setup

## Why Use Connection Pooling?

✅ **Better Performance** - Reuses existing connections  
✅ **No Timeouts** - Stable, persistent connections  
✅ **Handles Load** - Supports more concurrent users  
✅ **Production Ready** - Recommended by Supabase  

---

## Quick Setup (3 Steps)

### Step 1: Get Your Connection Pooling URL

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to: **Settings** → **Database**
4. Scroll to **Connection Pooling** section
5. Find **Connection string** (should show port `6543`)
6. Click **Copy** button

**Example URL:**
```
postgresql://postgres.dwszcyxcheyzsbmoxiaj:YOUR_PASSWORD@db-pool.dwszcyxcheyzsbmoxiaj.supabase.co:6543/postgres
```

### Step 2: Update Your `.env` File

Open `backend/.env` and update the `DATABASE_URL`:

```env
# ✅ Use this (Connection Pooling - port 6543)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db-pool.dwszcyxcheyzsbmoxiaj.supabase.co:6543/postgres

# ❌ Don't use this (Direct - port 5432)
# DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.dwszcyxcheyzsbmoxiaj.supabase.co:5432/postgres
```

**Key Differences:**
| Feature | Direct (5432) | Pooling (6543) |
|---------|---------------|----------------|
| Host | `db.xxx.supabase.co` | `db-pool.xxx.supabase.co` |
| Port | `5432` | `6543` |
| Stability | ⚠️ Can timeout | ✅ Very stable |
| Use case | Migrations, admin | Production apps |

### Step 3: Restart Your Server

```bash
# Stop the server (Ctrl+C if running)
# Start again
npm start
```

You should see:
```
✅ PostgreSQL connected
✅ Connected to Supabase PostgreSQL database
```

---

## Troubleshooting

### ❌ Still seeing connection errors?

**Check these:**

1. **Verify URL format:**
   ```
   postgresql://[USER]:[PASSWORD]@db-pool.[PROJECT].supabase.co:6543/postgres
   ```

2. **Confirm port is 6543:**
   - Look for `:6543/` in your URL
   - NOT `:5432/`

3. **Check hostname:**
   - Should be `db-pool.xxx`
   - NOT just `db.xxx`

4. **Verify password:**
   - No spaces or special characters causing issues
   - Try resetting password in Supabase if needed

5. **IP Whitelist:**
   - Go to: Database → Connection Pooling
   - Check if IP restrictions are enabled
   - Add your IP if needed

### ❌ "Connection terminated unexpectedly"

This usually means you're still using **direct connection (port 5432)**.  
✅ **Solution**: Switch to Connection Pooling (port 6543)

### ❌ "Too many connections"

✅ **Solution**: Connection Pooling handles this automatically!

---

## Configuration Details

Your current `database.js` is configured for optimal performance:

```javascript
max: 10,                    // 10 connections per instance
idleTimeoutMillis: 30000,   // Close idle after 30s
keepAlive: true,            // Keep connections healthy
```

This works perfectly with Supabase Connection Pooling! 🎉

---

## Need More Help?

- 📚 [Supabase Connection Pooling Docs](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- 📚 [Database Configuration Guide](./DATABASE_SETUP.md)
- 💬 Check server logs for detailed error messages

---

## ✅ Verification Checklist

- [ ] Got Connection Pooling URL from Supabase Dashboard
- [ ] URL contains `db-pool.xxx.supabase.co`
- [ ] Port is `6543` (not `5432`)
- [ ] Updated `.env` file with new URL
- [ ] Restarted the server
- [ ] Seeing "✅ Connected to Supabase PostgreSQL database"
- [ ] No timeout errors in logs

**If all checked, you're good to go!** 🚀

