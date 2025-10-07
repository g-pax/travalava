# Google Places Integration

This document outlines the Google Places API integration for cost-efficient activity and restaurant creation.

## Overview

The Google Places integration provides an alternative way to create activities and restaurants by searching Google's comprehensive database. It's designed for:

- **Cost efficiency**: Minimal API calls with intelligent caching
- **Performance**: Debounced search and IndexedDB caching
- **Compatibility**: Works alongside existing manual entry forms
- **User experience**: Rich data pre-population from Google Places

## Architecture

### Core Components

1. **`google-places.ts`** - Core API wrapper and caching service
2. **`google-places-search.tsx`** - Search interface components
3. **`google-places-activity-form.tsx`** - Activity creation with Google Places
4. **`google-places-restaurant-form.tsx`** - Restaurant creation with Google Places
5. **`activity-entry-mode-toggle.tsx`** - Toggle between Google Places and manual entry
6. **`enhanced-activity-create-form.tsx`** - Integrated activity creation
7. **`enhanced-restaurant-manager.tsx`** - Integrated restaurant management

### Cost Optimization Features

- **Intelligent Caching**: 24-hour IndexedDB cache for search results and details
- **Debounced Search**: 300ms delay to prevent excessive API calls
- **Minimal Field Requests**: Only essential fields to reduce cost per request
- **Search Result Limits**: Limited to 8 results for search, 5 for compact view
- **Background Cleanup**: Automatic cache expiration and cleanup

### API Usage

The integration uses these Google Places API endpoints:

1. **Text Search API** (`/textsearch/json`)
   - Most cost-effective for general searches
   - Used for initial place discovery
   - Supports location bias and type filtering

2. **Place Details API** (`/details/json`)
   - Called only when user selects a place
   - Retrieves detailed information (phone, website, reviews)
   - Uses specific field selection to control costs

## Usage

### Activity Creation

```tsx
import { EnhancedActivityCreateForm } from './enhanced-activity-create-form';

<EnhancedActivityCreateForm
  tripId={tripId}
  tripCurrency={tripCurrency}
  tripLocation={{ lat: 48.8566, lng: 2.3522 }} // Optional location bias
  defaultMode="google" // or "manual"
  onSuccess={handleSuccess}
/>
```

### Restaurant Management

```tsx
import { EnhancedRestaurantManager } from './enhanced-restaurant-manager';

<EnhancedRestaurantManager
  restaurants={restaurants}
  onRestaurantsChange={setRestaurants}
  tripLocation={{ lat: 48.8566, lng: 2.3522 }}
  defaultMode="google"
/>
```

### Standalone Google Places Search

```tsx
import { GooglePlacesSearch } from './google-places-search';

<GooglePlacesSearch
  onPlaceSelect={(place, details) => {
    // Handle place selection
  }}
  searchType="restaurant" // or "activity" or "both"
  placeholder="Search for restaurants..."
  initialLocation={{ lat: 48.8566, lng: 2.3522 }}
/>
```

## Data Flow

1. **User Search**: User types query (minimum 3 characters)
2. **Debounced Request**: After 300ms delay, search request is made
3. **Cache Check**: System checks IndexedDB for cached results
4. **API Call**: If not cached, Google Places API is called
5. **Result Display**: Results are shown with photos and ratings
6. **Place Selection**: User selects a place
7. **Details Fetch**: Additional details are fetched if needed
8. **Form Pre-fill**: Form is populated with Google Places data
9. **Cache Update**: Results and details are cached for future use

## Configuration

### Environment Variables

**IMPORTANT**: The implementation now uses secure server-side API routes. Set this environment variable:

```env
# Server-side API key (secure)
GOOGLE_PLACES_API_KEY=your_google_maps_api_key_here

# Keep this only if you use Google Maps display components
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### API Key Requirements

Your Google Maps API key needs these APIs enabled:
- Places API (New)
- Maps JavaScript API (for existing maps functionality)

### Security Benefits

✅ **API Key Security**: Never exposed to browser
✅ **CORS Compliance**: No more CORS errors
✅ **Server-side Validation**: Invalid requests blocked
✅ **Cost Control**: Server-side field filtering

### Cost Management

Current configuration limits:
- Search results: 8 per query
- Cache duration: 24 hours
- Debounce delay: 300ms
- Photo size: 400px max width

## Error Handling

The integration handles various error scenarios:

- **API Key Missing**: Graceful fallback with error message
- **Network Errors**: User-friendly error display
- **Rate Limiting**: Cached results prevent repeated requests
- **Invalid Places**: Validation and fallback to manual entry

## Performance Considerations

- **IndexedDB**: Persistent cache across browser sessions
- **Photo Optimization**: Configurable photo sizes
- **Lazy Loading**: Photos loaded on demand
- **Type Filtering**: Server-side filtering reduces irrelevant results

## Future Enhancements

Potential improvements for further cost optimization:

1. **Session Tokens**: Implement session tokens for Place Details requests
2. **Autocomplete Service**: Consider Autocomplete for even lower costs
3. **Geolocation Bias**: Use user location for better search results
4. **Batch Requests**: Combine multiple place details requests
5. **Progressive Loading**: Load basic info first, details on demand

## Monitoring

To monitor API usage and costs:

1. Check Google Cloud Console for API usage
2. Monitor IndexedDB cache hit rates
3. Track search-to-selection conversion rates
4. Analyze most searched place types

## Troubleshooting

### Common Issues

1. **No Results**: Check API key and permissions
2. **Slow Loading**: Verify network connection and API quotas
3. **Cache Issues**: Clear IndexedDB cache in browser dev tools
4. **Type Mismatches**: Ensure proper TypeScript types are imported

### Debug Mode

Enable debug logging by setting:

```javascript
localStorage.setItem('debug-google-places', 'true');
```

This will log cache hits, API calls, and search performance metrics to the console.