# WebApp Setup Guide

## Environment Configuration

### 1. Create `.env.local` file

Create a `.env.local` file in the `WebApp` directory with the following content:

```env
# Django API Base URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Important**: 
- Replace `http://localhost:8000` with your actual Django API URL
- For production, use your production API URL (e.g., `https://api.yourdomain.com`)
- Make sure there's no trailing slash

### 2. Verify Django API is Running

Before starting the Next.js app, ensure your Django API server is running:

```bash
# In the API directory
cd API
python manage.py runserver
```

The Django server should be running on `http://localhost:8000` (or your configured port).

### 3. Verify CORS Settings

Make sure your Django API has CORS configured correctly in `API/API/settings.py`:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5000",
]

CORS_ALLOW_CREDENTIALS = True
```

Add your Next.js URL to this list if it's different.

### 4. Start Next.js Development Server

```bash
# In the WebApp directory
cd WebApp
npm install  # If you haven't already
npm run dev
```

The Next.js app should start on `http://localhost:5000` (or port 3000 if using default).

## Troubleshooting

### "Failed to fetch" Error

If you're getting a "Failed to fetch" error:

1. **Check Django server is running**:
   ```bash
   # In API directory
   python manage.py runserver
   ```

2. **Verify API URL**:
   - Check `.env.local` file exists and has correct `NEXT_PUBLIC_API_URL`
   - Open browser console and check the logged API URL
   - Verify the URL is accessible (try opening it in browser)

3. **Check CORS settings**:
   - Make sure your Next.js URL is in `CORS_ALLOWED_ORIGINS`
   - Verify `CORS_ALLOW_CREDENTIALS = True`
   - Check that `corsheaders` middleware is installed and configured

4. **Check Network Tab**:
   - Open browser DevTools → Network tab
   - Try to login and check the failed request
   - Look at the request URL, headers, and error message

5. **Check Django logs**:
   - Look at Django server console for any errors
   - Check for CORS errors or authentication errors

### Login Issues

If login is not working:

1. **Verify user is staff or superuser**:
   ```bash
   # In Django shell
   python manage.py shell
   >>> from django.contrib.auth.models import User
   >>> user = User.objects.get(username='your_username')
   >>> user.is_staff  # Should be True
   >>> user.is_superuser  # Should be True (or is_staff should be True)
   ```

2. **Check API endpoint**:
   - Verify `/api/authentication/owner/login/` endpoint exists
   - Test with curl or Postman:
     ```bash
     curl -X POST http://localhost:8000/api/authentication/owner/login/ \
       -H "Content-Type: application/json" \
       -d '{"login_identifier": "your_username", "password": "your_password"}'
     ```

3. **Check CSRF token**:
   - Django requires CSRF token for POST requests
   - The app should handle this automatically
   - If issues persist, check browser console for CSRF errors

## Production Setup

For production:

1. **Set environment variables**:
   ```env
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   ```

2. **Update CORS settings** in Django:
   ```python
   CORS_ALLOWED_ORIGINS = [
       "https://yourdomain.com",
       "https://www.yourdomain.com",
   ]
   ```

3. **Build Next.js app**:
   ```bash
   npm run build
   npm start
   ```

## Testing

1. **Test API connection**:
   - Open browser console
   - Check for `[API Client] Base URL: ...` log message
   - Verify it matches your expected API URL

2. **Test login**:
   - Try logging in with a staff/superuser account
   - Check browser console for any errors
   - Check Django server logs for request logs

3. **Test authentication**:
   - After login, verify you're redirected to dashboard
   - Check that user info is displayed in header
   - Try accessing a protected route directly (should redirect to login)

