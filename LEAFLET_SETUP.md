# Leaflet + OpenStreetMap Setup Guide

## ✅ What's Implemented

Your FindIt app now uses **Leaflet with OpenStreetMap** and **Nominatim** for geocoding - completely free!

### Features:
- ✅ Interactive map with click-to-select location
- ✅ Address search and autocomplete (powered by Nominatim)
- ✅ Reverse geocoding (coordinates → address)
- ✅ Drag markers to adjust location
- ✅ No credit card required
- ✅ No API key required

---

## 🗺️ How It Works

### Map Display (Leaflet + OpenStreetMap)
- **100% Free** - No limits on map views
- Uses OpenStreetMap tiles (like Wikipedia for maps)

### Address Search (Nominatim)
- **Free** - Provided by OpenStreetMap
- Powers the search box in the map
- Converts addresses to coordinates and vice versa
- **Note**: Please respect the [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/) (limit requests, provide User-Agent). We have configured the User-Agent header for you.

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
   - Type an address in the search box (e.g., "New York")
   - The map will show the location with a marker

---

## 🔧 Troubleshooting

### Map not showing?
- Check browser console for errors
- Make sure `leaflet.css` is imported in `app/layout.tsx`
- Clear browser cache and restart dev server

### Search not working?
- Check your internet connection
- Nominatim might rate limit if you make too many requests too quickly (we added a debounce to prevent this)

---

## 📚 Resources

- **Nominatim Documentation**: https://nominatim.org/release-docs/develop/api/Search/
- **Leaflet Documentation**: https://leafletjs.com/
- **React-Leaflet Guide**: https://react-leaflet.js.org/

---

## 🎉 You're All Set!

Your FindIt app now has a completely free mapping solution. Enjoy building! 🚀
