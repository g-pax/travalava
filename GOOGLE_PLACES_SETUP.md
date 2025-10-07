# Google Places API Setup

## Security Update: API Route Proxy

The Google Places integration has been refactored to use secure Next.js API routes instead of direct browser calls. This provides:

- **Security**: API key is never exposed to the browser
- **CORS Compliance**: No more CORS errors
- **Rate Limiting**: Can add server-side rate limiting if needed
- **Cost Control**: Server-side field filtering and validation

## Environment Variables

### Required Changes

1. **Remove the old client-side variable** (if you had it):
   ```bash
   # REMOVE THIS - no longer needed
   # NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
   ```

2. **Add the new server-side variable**:
   ```bash
   # Add this to your .env.local file
   GOOGLE_PLACES_API_KEY=your_google_maps_api_key_here
   ```

### Production Deployment

Make sure to set the `GOOGLE_PLACES_API_KEY` environment variable in your deployment platform:

- **Vercel**: Add in Project Settings → Environment Variables
- **Netlify**: Add in Site Settings → Environment Variables
- **Railway**: Add in Project → Variables
- **Other platforms**: Follow their environment variable setup guide

## API Endpoints Created

The following secure API routes have been created:

### 1. `/api/places/search`
- **Purpose**: Search for places using Google Places Text Search API
- **Parameters**:
  - `query` (required): Search term
  - `location` (optional): "lat,lng" for location bias
  - `radius` (optional): Search radius in meters (default: 5000)
  - `type` (optional): Place type filter

### 2. `/api/places/details`
- **Purpose**: Get detailed information about a specific place
- **Parameters**:
  - `place_id` (required): Google Places Place ID

### 3. `/api/places/photo`
- **Purpose**: Proxy Google Places photos securely
- **Parameters**:
  - `photo_reference` (required): Photo reference from Places API
  - `maxwidth` (optional): Maximum width in pixels (default: 400)

## Cost Optimization Features

The API routes maintain all cost optimization features:

✅ **Minimal Field Requests**: Only essential fields requested
✅ **Client-Side Caching**: 24-hour IndexedDB cache still works
✅ **Server-Side Validation**: Invalid requests blocked before API calls
✅ **Photo Caching**: 24-hour cache headers on photo responses

## Migration Notes

### Automatic Migration
The frontend code automatically uses the new API routes. No changes needed to React components.

### API Key Security
- The old `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is no longer used for Places API
- Keep `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` only if you use Google Maps display components
- For Places API, only use the server-side `GOOGLE_PLACES_API_KEY`

### Error Handling
The new implementation provides better error messages:
- `500`: API key not configured
- `400`: Missing required parameters
- `500`: Google API errors (with details)

## Testing

To test the implementation:

1. Set the `GOOGLE_PLACES_API_KEY` environment variable
2. Restart your development server
3. Try searching for places in the activity creation form
4. Check browser Network tab - requests should go to `/api/places/*` endpoints
5. Verify no API key is visible in browser requests

## Troubleshooting

### "Google Places API key not configured"
- Check that `GOOGLE_PLACES_API_KEY` is set in your environment
- Restart your development server after adding the variable
- For production, verify the variable is set in your deployment platform

### "Search failed" or "Details fetch failed"
- Check your Google Cloud Console for API quotas and billing
- Verify the API key has Places API permissions
- Check server logs for detailed error messages

### Photos not loading
- Photos are proxied through `/api/places/photo`
- Check Network tab for 500 errors on photo requests
- Verify photo references are valid from the Places API response

## Google Cloud Console Setup

Ensure your Google Cloud project has:

1. **Places API (New)** enabled
2. **Maps JavaScript API** enabled (for map display)
3. **API key** with appropriate restrictions:
   - For `GOOGLE_PLACES_API_KEY`: Restrict to Places API only
   - For `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Restrict to Maps JavaScript API only

## Benefits

✅ **Security**: No API keys exposed in browser
✅ **Performance**: Server-side caching possible
✅ **Reliability**: No CORS issues
✅ **Cost Control**: Server-side request validation
✅ **Monitoring**: Centralized logging and error handling