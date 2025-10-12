# Database Connection Setup Guide

## Supabase Connection Options

Supabase provides two types of connection strings:

### 1. **Direct Connection (Port 5432)** ⚠️ Not Recommended for Production
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.dwszcyxcheyzsbmoxiaj.supabase.co:5432/postgres
```
- Direct connection to PostgreSQL
- Limited connections (can cause timeouts)
- Less stable for high-traffic apps
- Use only for: Database migrations, admin tools, direct SQL access

### 2. **Connection Pooling (Port 6543)** ✅ **RECOMMENDED**
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db-pool.dwszcyxcheyzsbmoxiaj.supabase.co:6543/postgres
```
- Uses PgBouncer for connection pooling
- Better performance and stability
- Automatic session reuse
- No timeout issues
- **Use this for your application!**

## How to Get Connection Pooling String

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to: **Database** → **Connection Pooling**
4. Copy the **Connection string** (uses port `6543`)
5. Update your `.env` file

## Setting Up Your `.env` File

Create a `.env` file in the `backend` directory:

```env
# ✅ RECOMMENDED: Use Connection Pooling (port 6543)
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db-pool.dwszcyxcheyzsbmoxiaj.supabase.co:6543/postgres

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Server Configuration
PORT=5000
NODE_ENV=development
```

### Important Notes:

- Replace `[YOUR_PASSWORD]` with your actual Supabase database password
- Notice the hostname changes from `db.xxx` to `db-pool.xxx`
- Port changes from `5432` to `6543`
- Keep your JWT_SECRET secure and random

## Connection String Format

```
postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?[OPTIONS]
```

**Example with all parts:**
```
postgresql://postgres:myP@ssw0rd123@db-pool.dwszcyxcheyzsbmoxiaj.supabase.co:6543/postgres
```

## Troubleshooting

### Connection Timeout Errors
✅ **Solution**: Use Connection Pooling (port 6543) instead of direct connection

### IPv6 Timeout Issues
✅ **Solution**: Already handled in `database.js` with `dns.setDefaultResultOrder('ipv4first')`

### Too Many Connections Error
✅ **Solution**: 
- Use Connection Pooling (port 6543)
- Reduce `max` in pool configuration
- Ensure connections are properly released

### ECONNRESET / Connection Terminated
✅ **Solution**:
- Use Connection Pooling (port 6543)
- Enable `keepAlive` (already configured)
- Set appropriate `idleTimeoutMillis`

## Verifying Your Connection

After updating your `.env`, restart the server. You should see:

```
✅ PostgreSQL connected
✅ Connected to Supabase PostgreSQL database
```

If you see connection errors, verify:
1. ✅ Using Connection Pooling URL (port 6543)
2. ✅ Password is correct (no special characters issues)
3. ✅ IP is whitelisted in Supabase (if restrictions enabled)
4. ✅ `.env` file is in the `backend` directory

## Current Pool Configuration

Our `database.js` is configured with:
- **Max connections**: 10 (adjust based on your needs)
- **Idle timeout**: 30 seconds (auto-close unused connections)
- **Connection timeout**: 30 seconds
- **Query timeout**: 60 seconds
- **Keep alive**: Enabled (maintains connection health)
- **IPv4 first**: Enabled (avoids IPv6 issues)

## Production Recommendations

1. ✅ **Always use Connection Pooling** (port 6543)
2. ✅ Use strong, random JWT_SECRET
3. ✅ Set `NODE_ENV=production`
4. ✅ Enable IP restrictions in Supabase dashboard
5. ✅ Monitor connection pool usage
6. ✅ Use environment variables (never commit `.env`)

## Need Help?

- [Supabase Documentation](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Connection Pooling Guide](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- Check server logs for detailed error messages

