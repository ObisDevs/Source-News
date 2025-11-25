# OAuth Setup Instructions

## Google OAuth Configuration

### 1. Configure Google OAuth in Supabase

1. Go to your Supabase project: https://supabase.com/dashboard/project/fgpsrnwlctxjdpnkndqw
2. Navigate to **Authentication** → **Providers**
3. Find **Google** and enable it
4. You'll need to create a Google OAuth app:

### 2. Create Google OAuth App

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen:
   - App name: Source News
   - User support email: your email
   - Developer contact: your email
6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: Source News
   - Authorized redirect URIs:
     ```
     https://fgpsrnwlctxjdpnkndqw.supabase.co/auth/v1/callback
     http://localhost:3000/auth/callback
     ```

7. Copy **Client ID** and **Client Secret**

### 3. Add Credentials to Supabase

1. Back in Supabase → Authentication → Providers → Google
2. Paste your **Client ID** and **Client Secret**
3. Save changes

### 4. Update Site URL in Supabase

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `http://localhost:3000` (for dev) or your production URL
3. Add **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/dashboard
   ```

## Phone Authentication Configuration

### 1. Enable Phone Auth in Supabase

1. Go to **Authentication** → **Providers**
2. Enable **Phone**
3. Choose SMS provider (Twilio recommended for Nigeria)

### 2. Configure Twilio (for SMS)

1. Sign up at [Twilio](https://www.twilio.com/)
2. Get your:
   - Account SID
   - Auth Token
   - Phone Number (with Nigeria support)
3. Add to Supabase Phone provider settings

### 3. Test Phone Auth

- Use format: `+234` followed by 10 digits
- Example: `+2348012345678`

## Testing

### Test Google OAuth:
1. Click "Sign in with Google" button
2. Select Google account
3. Should redirect to `/dashboard`

### Test Phone Auth:
1. Select "Phone" tab
2. Enter phone number with country code
3. Click "Continue"
4. Enter OTP code received via SMS
5. Click "Verify OTP"

## Troubleshooting

### Google OAuth not working:
- Check redirect URIs match exactly
- Verify Client ID and Secret are correct
- Check browser console for errors
- Ensure cookies are enabled

### Phone Auth not working:
- Verify phone number format (+234...)
- Check Twilio credentials
- Ensure SMS service is active
- Check Supabase logs for errors

## Production Setup

Before deploying to production:

1. Update redirect URIs to production domain
2. Update Site URL in Supabase
3. Add production domain to allowed origins
4. Test all auth flows in production environment
