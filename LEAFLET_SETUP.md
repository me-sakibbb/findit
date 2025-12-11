# Leaflet + OpenStreetMap Setup Guide

## ✅ What's Implemented

Your FindIt app now uses **Leaflet with OpenStreetMap** instead of Google Maps - completely free!

### Features:
- ✅ Interactive map with click-to-select location
- ✅ Address search and autocomplete (powered by OpenCage)
- ✅ Reverse geocoding (coordinates → address)
- ✅ Drag markers to adjust location
- ✅ No credit card required
- ✅ 2,500 free geocoding requests per day

---

## 🔑 Get Your Free OpenCage API Key

### Step 1: Sign Up
1. Go to: https://opencagedata.com/users/sign_up
2. Enter your email and create a password
3. No credit card required!

### Step 2: Get API Key
1. After signing up, you'll be redirected to your dashboard
2. Your API key will be displayed immediately
3. Copy the API key

### Step 3: Add to Your Project
1. Create a `.env.local` file in your project root (if it doesn't exist)
2. Add this line:
   ```env
   NEXT_PUBLIC_OPENCAGE_API_KEY=your_api_key_here
   ```
3. Replace `your_api_key_here` with your actual API key

---

## 🗺️ How It Works

### Map Display (Leaflet + OpenStreetMap)
- **100% Free** - No limits on map views
- Uses OpenStreetMap tiles (like Wikipedia for maps)
- No API key needed for map display

### Address Search (OpenCage)
- **Free Tier**: 2,500 requests per day
- Powers the search box in the map
- Converts addresses to coordinates and vice versa

---

## 📝 Example `.env.local`

```env
# OpenCage API Key (required for address search)
NEXT_PUBLIC_OPENCAGE_API_KEY=abc123def456ghi789

# Your other environment variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
BLOB_READ_WRITE_TOKEN=your_blob_token
```

---

## 🚀 Testing

1. Run your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/post/lost` or `/post/found`

3. Click "Select location from map..."

4. Try these features:
   - Click anywhere on the map to select a location
   - Type an address in the search box
   - The map will show the location with a marker

---

## 🎯 What If I Don't Have an API Key?

The app will still work! Without an OpenCage API key:
- ✅ Map displays and works perfectly
- ✅ You can click to select locations
- ✅ Markers show on the map
- ❌ Address search won't work (search box disabled)
- ⚠️ Location names will show as coordinates (e.g., "23.8103, 90.4125")

---

## 📊 Free Tier Limits

**OpenCage Free Tier:**
- 2,500 requests per day
- 1 request per second
- Perfect for development and small apps

**What counts as a request:**
- Each address search = 1 request
- Each reverse geocode (click on map) = 1 request
- Map views = 0 requests (completely free!)

**Typical Usage:**
- 100 users posting items per day = ~200 requests
- Well within the free tier!

---

## 🔧 Troubleshooting

### Map not showing?
- Check browser console for errors
- Make sure `leaflet.css` is imported in `app/layout.tsx`
- Clear browser cache and restart dev server

### Search not working?
- Verify your OpenCage API key is correct
- Check it's in `.env.local` with the exact name: `NEXT_PUBLIC_OPENCAGE_API_KEY`
- Restart your dev server after adding the key

### Markers not appearing?
- Check browser console for Leaflet icon errors
- The component includes CDN links for marker icons

---

## 📚 Resources

- **OpenCage Documentation**: https://opencagedata.com/api
- **Leaflet Documentation**: https://leafletjs.com/
- **React-Leaflet Guide**: https://react-leaflet.js.org/

---

## 🎉 You're All Set!

Your FindIt app now has a completely free mapping solution. Enjoy building! 🚀
