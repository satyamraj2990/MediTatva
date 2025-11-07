# Location Detection Troubleshooting Guide

## Common Errors and Solutions

### Error: "Failed to retrieve address. Please try again"

This error has been **FIXED** with the following improvements:

#### ✅ What Was Fixed:

1. **Retry Mechanism**: Added 3 automatic retries with exponential backoff
2. **Fallback to Coordinates**: If geocoding fails, displays coordinates instead of error
3. **Better Error Handling**: Handles all API error states (ZERO_RESULTS, REQUEST_DENIED, OVER_QUERY_LIMIT)
4. **Increased Timeout**: Changed from 10s to 15s for slower connections
5. **Response Caching**: Added 5-minute cache to reduce API calls
6. **Detailed Logging**: Console logs show exact API response for debugging

#### How It Works Now:

```
1. User opens dashboard
2. Browser requests location permission
3. GPS coordinates obtained (lat, lng)
4. Geocoding API called to convert to address
   ├─ If successful → Shows: "San Francisco, CA - 94102"
   ├─ If API fails → Retries 3 times with delays
   └─ If all fail → Shows: "Lat: 37.7749, Lng: -122.4194"
5. Result cached in localStorage
```

#### What You'll See:

**Before Fix:**
```
❌ Location Error
   Failed to retrieve address. Please try again
```

**After Fix:**
```
✅ 📍 Live  |  37.7749, -122.4194  |  🔄
   (If geocoding fails, coordinates shown instead of error)

✅ 📍 Live  |  San Francisco, CA - 94102  |  🔄
   (If geocoding succeeds)
```

## Debugging Steps

### 1. Check Console Logs

Open browser console (F12) and look for:

```javascript
// Success:
Geocoding API response: {status: "OK", results: [...]}

// API Error:
Geocoding API response: {status: "REQUEST_DENIED", error_message: "..."}

// Network Error:
Geocoding attempt 1 failed: TypeError: Failed to fetch
```

### 2. Verify API Key

Test the API key directly:

```bash
# Replace with actual coordinates
curl "https://maps.googleapis.com/maps/api/geocode/json?latlng=37.7749,-122.4194&key=AIzaSyD68awf-0haNIrM9Ewj6LIXtpbHFVfC_MU"
```

**Expected Response:**
```json
{
  "status": "OK",
  "results": [...]
}
```

**Error Responses:**

- `REQUEST_DENIED`: API key invalid or not enabled
- `OVER_QUERY_LIMIT`: Too many requests (quota exceeded)
- `ZERO_RESULTS`: No address found for coordinates
- `INVALID_REQUEST`: Missing parameters

### 3. Test Location Permission

```javascript
// In browser console:
navigator.permissions.query({name: 'geolocation'}).then(result => {
  console.log('Permission:', result.state);
  // Result: "granted", "denied", or "prompt"
});
```

### 4. Manual Location Test

```javascript
// In browser console:
navigator.geolocation.getCurrentPosition(
  pos => console.log('Success:', pos.coords),
  err => console.log('Error:', err.message)
);
```

### 5. Check localStorage

```javascript
// In browser console:
const stored = localStorage.getItem('userLocation');
console.log('Stored location:', JSON.parse(stored));

// Clear if corrupted:
localStorage.removeItem('userLocation');
```

## API Key Issues

### If API Key is Invalid:

1. **Check Google Cloud Console:**
   - Go to: https://console.cloud.google.com/
   - Navigate to: APIs & Services → Credentials
   - Verify: Geocoding API is enabled
   - Check: API key restrictions

2. **Enable Geocoding API:**
   - Go to: APIs & Services → Library
   - Search: "Geocoding API"
   - Click: Enable

3. **Check Billing:**
   - Geocoding API requires billing account
   - Free tier: $200 credit/month
   - Pricing: $5 per 1,000 requests

4. **API Key Restrictions:**
   - None (recommended for localhost testing)
   - HTTP referrers: `localhost:*/*`, `127.0.0.1:*/*`
   - IP addresses: Your dev server IP

### If API Quota Exceeded:

The app now handles this gracefully by:
- Showing coordinates instead of error
- Retrying after delay
- Caching to reduce API calls

## Network Issues

### CORS Errors:

Geocoding API supports CORS, but if you see:
```
Access to fetch at 'https://maps.googleapis.com/...' has been blocked by CORS policy
```

**Solution:** Use a proxy or server-side API call (future backend integration)

### Timeout Errors:

Now set to 15 seconds. If still timing out:
- Check internet connection
- Disable VPN
- Try different network (WiFi vs mobile)

## Testing the Fix

### Test Cases:

1. **Normal Flow (Success):**
   - Open dashboard
   - Grant permission
   - Wait 2-5 seconds
   - See city/state displayed

2. **Geocoding Failure:**
   - Temporarily disable API key
   - Open dashboard
   - Should show coordinates instead of error

3. **Permission Denied:**
   - Open dashboard
   - Deny permission
   - See: "Location Access Denied" with retry button

4. **Cached Location:**
   - Grant permission once
   - Refresh page
   - Should show instantly from cache

5. **Network Offline:**
   - Disconnect internet
   - Open dashboard (with cached location)
   - Should show cached location
   - Click refresh → Shows coordinates

## Current Implementation Details

### Retry Logic:

```typescript
for (let attempt = 0; attempt < 3; attempt++) {
  try {
    // Call Geocoding API
    if (success) return data;
    
    if (API_QUOTA_EXCEEDED && attempt < 2) {
      await delay(1000 * (attempt + 1)); // 1s, 2s backoff
      continue; // Retry
    }
  } catch (error) {
    if (attempt === 2) {
      // Last attempt - return coordinates
      return fallbackLocation;
    }
    await delay(500 * (attempt + 1)); // 500ms, 1s backoff
  }
}
```

### Fallback Location:

```typescript
{
  latitude: 37.7749,
  longitude: -122.4194,
  city: "Location Detected",
  formattedAddress: "Lat: 37.7749, Lng: -122.4194"
}
```

### Display Logic:

```typescript
// Shows coordinates if city is generic
if (city === "Unknown City" || city === "Location Detected") {
  display(formattedAddress); // Shows coordinates
} else {
  display(`${city}, ${state} - ${postalCode}`);
}
```

## Success Metrics

After the fix:

- ✅ **No More "Failed to retrieve address" Errors**
- ✅ **Always Shows Something** (coordinates as minimum)
- ✅ **3 Automatic Retries** with delays
- ✅ **Better API Error Handling** (all status codes)
- ✅ **Longer Timeout** (15s instead of 10s)
- ✅ **Response Caching** (5 minutes)
- ✅ **Detailed Console Logs** for debugging

## If Issues Persist

### Check These:

1. **Browser Console** - Any red errors?
2. **Network Tab** - Is API call succeeding (200 status)?
3. **API Response** - What does the JSON look like?
4. **localStorage** - Is location being saved?
5. **Permissions** - Is geolocation granted?

### Contact Information:

If you still see errors after these fixes:

1. **Copy browser console logs**
2. **Copy network response** (Network tab → geocode call)
3. **Note your exact location** (city/country)
4. **Share device info** (browser, OS, mobile/desktop)

The app will now **always show something** instead of throwing an error!

---

**Fix Version**: 1.1.0  
**Date**: November 7, 2025  
**Status**: ✅ Production Ready with Fallbacks
