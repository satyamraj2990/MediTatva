# 🧪 Testing Guide - MediTatva Dashboard Navigation

## Quick Test Instructions

### 1. Access the Dashboard

**Server URL:** http://localhost:8080

**Login Credentials:**
- Role: Pharmacy
- Navigate to `/pharmacy/dashboard`

### 2. Navigation Tests

#### Test Case 1: Sidebar Navigation
1. Click on **"Analytics & Reports"** → Should load instantly with fade animation
2. Click on **"Inventory Management"** → Should switch smoothly, no white flash
3. Click on **"Patient Chat"** → Instant transition
4. Click on **"AI Insights"** → Smooth change
5. Click on **"Billing & Invoices"** → No page reload
6. Click on **"Nearby Medical Stores"** → Should load map component

✅ **Expected:** All transitions < 100ms, no white screen, no page reload

#### Test Case 2: Rapid Navigation
1. Quickly click through all 6 sidebar options in sequence
2. Click back and forth between tabs rapidly

✅ **Expected:** No lag, no flicker, smooth animations throughout

#### Test Case 3: Direct URL Access
1. Open browser devtools (F12)
2. Copy these URLs and paste directly in address bar:
   - `http://localhost:8080/pharmacy/dashboard/analytics`
   - `http://localhost:8080/pharmacy/dashboard/chat`
   - `http://localhost:8080/pharmacy/dashboard/nearby-stores`

✅ **Expected:** Each URL loads directly without redirect or flash

#### Test Case 4: Browser Back/Forward
1. Navigate: Analytics → Chat → AI Insights
2. Click browser **Back** button twice
3. Click browser **Forward** button

✅ **Expected:** Navigation history works, smooth transitions

### 3. State Persistence Tests

#### Test Case 5: Authentication Persistence
1. Login and navigate to any tab
2. Switch between different tabs
3. Check localStorage in devtools

✅ **Expected:** `isAuthenticated` and `userRole` remain set

#### Test Case 6: Location State (Nearby Stores)
1. Navigate to **"Nearby Medical Stores"**
2. Allow location access when prompted
3. Wait for location detection and store search
4. Switch to **"Analytics & Reports"**
5. Switch back to **"Nearby Medical Stores"**

✅ **Expected:** Location and stores data preserved, no re-fetch

### 4. Google Maps Integration Tests

#### Test Case 7: Map Loading
1. Go to **"Nearby Medical Stores"**
2. Allow location permissions
3. Click **"Find Stores"** button
4. Wait for map to load

✅ **Expected:**
- Map loads with no errors
- Blue marker for user location (pulsing)
- Green numbered markers for pharmacies
- Auto-fit to show all markers

#### Test Case 8: Map Interactions
1. Click on your location marker (blue)
   → Should show "Your Location" info window
2. Click on any pharmacy marker (green)
   → Should show store name, address, distance
3. Click **"Hide Map"** button
   → Map should disappear
4. Click **"Show Map"** button
   → Map should reappear

✅ **Expected:** All interactions work smoothly

### 5. Performance Tests

#### Test Case 9: Initial Load Time
1. Open DevTools → Network tab
2. Hard refresh page (Ctrl+Shift+R)
3. Check load time in Network tab

✅ **Expected:** Page loads in < 3 seconds

#### Test Case 10: Tab Switch Performance
1. Open DevTools → Performance tab
2. Start recording
3. Click through 3-4 different tabs
4. Stop recording
5. Check frame rate

✅ **Expected:** Consistent 60 FPS, no long tasks

### 6. Visual/Animation Tests

#### Test Case 11: Transition Smoothness
1. Watch closely while clicking between tabs
2. Observe the fade + slide animation

✅ **Expected:**
- Smooth fade out of old content
- Smooth fade in of new content
- Slight upward slide on enter
- No jank or stutter

#### Test Case 12: Active State Indicator
1. Click each sidebar option
2. Observe the glowing blue indicator on the left
3. Observe the blue dot on the right

✅ **Expected:** Indicator smoothly animates to active item

### 7. Error Handling Tests

#### Test Case 13: Invalid Route
1. Manually type in browser: `http://localhost:8080/pharmacy/dashboard/invalid`

✅ **Expected:** Redirects to Analytics or shows 404

#### Test Case 14: Location Denied (Nearby Stores)
1. Go to **"Nearby Medical Stores"**
2. When prompted, **Deny** location access
3. Observe error message

✅ **Expected:** User-friendly error message, ability to retry

## 📊 Results Checklist

Mark each test as you complete it:

- [ ] Test Case 1: Sidebar Navigation
- [ ] Test Case 2: Rapid Navigation
- [ ] Test Case 3: Direct URL Access
- [ ] Test Case 4: Browser Back/Forward
- [ ] Test Case 5: Authentication Persistence
- [ ] Test Case 6: Location State
- [ ] Test Case 7: Map Loading
- [ ] Test Case 8: Map Interactions
- [ ] Test Case 9: Initial Load Time
- [ ] Test Case 10: Tab Switch Performance
- [ ] Test Case 11: Transition Smoothness
- [ ] Test Case 12: Active State Indicator
- [ ] Test Case 13: Invalid Route
- [ ] Test Case 14: Location Denied

## 🐛 If You Find Issues

### Common Issues & Fixes

**Issue:** White screen still appears
**Fix:** 
```bash
# Clear browser cache and Vite cache
rm -rf node_modules/.vite
# Hard refresh browser (Ctrl+Shift+R)
```

**Issue:** Google Maps not loading
**Fix:** 
1. Check browser console for API errors
2. Verify API key is valid
3. Ensure billing is enabled on Google Cloud

**Issue:** Navigation not working
**Fix:**
```bash
# Check for TypeScript errors
npm run type-check
# Restart dev server
```

## 📝 Report Template

If you find any issues, report using this format:

```
**Issue:** [Brief description]
**Test Case:** [Which test case number]
**Browser:** [Chrome/Firefox/Safari + version]
**Steps to Reproduce:**
1. 
2. 
3. 

**Expected:** [What should happen]
**Actual:** [What actually happens]
**Console Errors:** [Any errors from browser console]
```

## ✅ Success Criteria

All tests pass if:
- ✅ Zero white screen flashes
- ✅ All navigation < 100ms
- ✅ Smooth animations throughout
- ✅ State persists across tabs
- ✅ Google Maps loads and works
- ✅ No console errors
- ✅ 60 FPS performance

---

**Happy Testing! 🚀**
