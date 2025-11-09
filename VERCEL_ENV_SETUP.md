# Vercel Environment Variables Setup

## Production Environment Variables

To configure the frontend to connect to the production backend, you need to set the following environment variable in Vercel:

### Required Environment Variable

**Variable Name:** `NEXT_PUBLIC_API_URL`  
**Value:** `https://consoleapi.electrocomsolutions.in`

**Important:** 
- Replace `consoleapi.electrocomsolutions.in` with your actual backend domain if different
- Use `https://` (not `http://`) for production
- Make sure there's no trailing slash at the end
- Example: `https://consoleapi.electrocomsolutions.in` ✅ (correct)
- Example: `https://consoleapi.electrocomsolutions.in/` ❌ (wrong - trailing slash)

### How to Set in Vercel

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project (console.electrocomsolutions.in)
3. Go to **Settings** → **Environment Variables**
4. Add a new environment variable:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://consoleapi.electrocomsolutions.in` (or your actual backend URL)
   - **Environment:** Select "Production" (and "Preview" if needed)
5. Click **Save**
6. **Important:** Go to **Deployments** tab and **Redeploy** your latest deployment (or trigger a new deployment) for the changes to take effect
   - Environment variables are only available in new deployments
   - Existing deployments will continue to use the old values

### Backend Configuration

Make sure your Django backend (`consoleapi.electrocomsolutions.in`) has the following settings:

#### 1. ALLOWED_HOSTS

In your Django `.env` file or environment variables, set:
```
ALLOWED_HOSTS=consoleapi.electrocomsolutions.in,localhost,127.0.0.1
```

Or in `settings.py`, ensure:
```python
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',') if os.getenv('ALLOWED_HOSTS') else []
```

#### 2. CORS Configuration

```python
CORS_ALLOWED_ORIGINS = [
    # ... other origins ...
    "https://console.electrocomsolutions.in",
]

CSRF_TRUSTED_ORIGINS = [
    # ... other origins ...
    "https://console.electrocomsolutions.in",
]
```

#### 3. Session Cookie Security (for HTTPS)

If your backend uses HTTPS, set in `.env`:
```
SESSION_COOKIE_SECURE=True
```

This ensures session cookies are only sent over HTTPS connections.

### Important Notes

- The environment variable must be set in Vercel for production builds
- After setting the variable, you must redeploy the application
- The backend must have CORS configured to allow requests from `https://console.electrocomsolutions.in`
- Make sure the backend URL uses `https://` (not `http://`) for production

### Verification

After setting up:
1. The frontend should connect to `https://consoleapi.electrocomsolutions.in`
2. Check browser console (F12 → Console tab) for any CORS errors
3. Verify that login and API calls work correctly
4. Check the Network tab to see the actual API requests being made

### Troubleshooting

#### Issue: Still seeing "Cannot connect to API server at http://localhost:8000"

**Solution:**
1. Make sure you set `NEXT_PUBLIC_API_URL` in Vercel environment variables
2. **Important:** Redeploy your application after setting the environment variable
3. Environment variables are only available in new deployments
4. Check the browser console to see what API URL is being used

#### Issue: CORS errors in browser console

**Solution:**
1. Verify that `https://console.electrocomsolutions.in` is in `CORS_ALLOWED_ORIGINS` on the backend
2. Verify that `https://console.electrocomsolutions.in` is in `CSRF_TRUSTED_ORIGINS` on the backend
3. Restart the Django server after updating CORS settings
4. Check that `CORS_ALLOW_CREDENTIALS = True` is set

#### Issue: Session/Cookie issues

**Solution:**
1. If using HTTPS, set `SESSION_COOKIE_SECURE=True` in backend `.env`
2. Ensure `SESSION_COOKIE_SAMESITE = 'Lax'` (already configured)
3. Check that cookies are being set in the browser (Application → Cookies in DevTools)

### Quick Checklist

- [ ] Set `NEXT_PUBLIC_API_URL` in Vercel (Production environment)
- [ ] Redeploy the application on Vercel
- [ ] Update backend `ALLOWED_HOSTS` to include `consoleapi.electrocomsolutions.in`
- [ ] Update backend `CORS_ALLOWED_ORIGINS` to include `https://console.electrocomsolutions.in`
- [ ] Update backend `CSRF_TRUSTED_ORIGINS` to include `https://console.electrocomsolutions.in`
- [ ] Restart Django server after backend changes
- [ ] Verify API URL in browser console (should show production URL, not localhost)
- [ ] Test login functionality

