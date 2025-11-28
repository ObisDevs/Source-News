# Admin Panel Guide

## Setup Instructions

### 1. Run SQL to Make User Admin

Execute this in Supabase SQL Editor:

```sql
-- Make user admin
INSERT INTO users (id, email, full_name, plan_tier, preferences)
VALUES (
  '551b99a5-eaf2-4513-b218-eda99c1d1f3b',
  'obisdev@gmail.com',
  'Admin',
  'premium',
  '{"role": "admin", "theme": "dark"}'
)
ON CONFLICT (id) 
DO UPDATE SET 
  preferences = '{"role": "admin", "theme": "dark"}',
  plan_tier = 'premium';
```

### 2. Access Admin Panel

**Login URL**: `http://localhost:3000/admin`

**Credentials**:
- Email: `obisdev@gmail.com` (hardcoded, auto-filled)
- Password: Your Supabase password

---

## Features

### 1. Admin Dashboard (`/admin/dashboard`)

**Features:**
- View all news stories (latest 50)
- See story title, source, and current image
- Edit image URL for any story
- Quick save/cancel actions

**Use Case:**
When a publisher uses a bad/broken image, admin can:
1. Click "Edit Image" button
2. Paste new image URL
3. Click "Save"
4. Image updates immediately

### 2. Ingestion Monitor (`/admin/ingestion`)

**Features:**
- View ingestion statistics:
  - Total stories in database
  - Stories ingested today
  - Stories processed (embeddings + clustering)
- Manual ingestion trigger
- Manual processing trigger
- Real-time logs

**Use Case:**
Admin can manually trigger ingestion anytime:
1. Click "Run Ingestion" button
2. Watch logs in real-time
3. See results: ingested, skipped, errors
4. Stats update automatically

---

## Admin Routes

```
/admin                    → Login page
/admin/dashboard          → News management
/admin/ingestion          → Ingestion monitor
```

---

## Security

### Hardcoded Admin ID
```typescript
const ADMIN_ID = '551b99a5-eaf2-4513-b218-eda99c1d1f3b';
```

### Auth Check
Every admin page checks:
1. User is logged in
2. User ID matches admin ID
3. Redirects to login if not authorized

### Email Hardcoded
```typescript
const ADMIN_EMAIL = 'obisdev@gmail.com';
```
- Email field is disabled
- Only password needs to be entered
- Prevents wrong email attempts

---

## Usage Examples

### Edit Story Image

1. Go to `/admin/dashboard`
2. Find story with bad image
3. Click "Edit Image"
4. Paste new URL: `https://example.com/image.jpg`
5. Click "Save"
6. Image updates in database

### Manual Ingestion

1. Go to `/admin/ingestion`
2. Click "Run Ingestion"
3. Wait for completion
4. Check logs for results
5. Stats update automatically

### Manual Processing

1. Go to `/admin/ingestion`
2. Click "Run Processing"
3. Generates embeddings for new stories
4. Clusters similar stories
5. Check logs for results

---

## API Endpoints Used

### Ingestion
```bash
POST /api/worker/ingest
Authorization: Bearer <CRON_SECRET>
```

### Processing
```bash
POST /api/worker/process
Authorization: Bearer <CRON_SECRET>
```

---

## Files Created

```
src/app/admin/
├── page.tsx                    ✅ Login page
├── dashboard/
│   └── page.tsx               ✅ News management
└── ingestion/
    └── page.tsx               ✅ Ingestion monitor

ADMIN_SETUP.sql                ✅ SQL to make user admin
```

---

## Troubleshooting

### Can't Login
- Check password is correct
- Verify user exists in Supabase Auth
- Run SQL to set admin role

### Can't Edit Images
- Check Supabase connection
- Verify user has admin role
- Check browser console for errors

### Ingestion Fails
- Check CRON_SECRET in .env
- Verify RSS feeds are accessible
- Check API logs for errors

---

## Future Enhancements

### Possible Additions:
1. **Bulk image editing** - Edit multiple stories at once
2. **Source management** - Add/remove RSS sources
3. **User management** - View/manage users
4. **Analytics dashboard** - Charts and graphs
5. **Content moderation** - Approve/reject stories
6. **Scheduled ingestion** - Set custom schedules

---

**Status**: ✅ Admin panel ready to use!

**Login**: `/admin` with password only
**Dashboard**: Manage news images
**Monitor**: Manual ingestion control
