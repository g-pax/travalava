# Restaurant Feature

This feature provides standalone restaurant management for trips, allowing restaurants to be created independently and linked to multiple activities.

## Architecture

### Database Schema
- `restaurants` - Standalone restaurant entities with Google Places compliance
- `activity_restaurants` - Many-to-many junction table for activity links

### Key Features
- ✅ Standalone restaurant management at `/trips/[id]/restaurants`
- ✅ Google Places integration with automatic data expiry
- ✅ Many-to-many activity linking
- ✅ Search and filtering
- ✅ Row-level security (RLS) enforcement

## Components

### Pages
- **RestaurantsPage** (`/trips/[id]/restaurants`) - Main restaurant list with search/filter
- **RestaurantDetailPage** (`/trips/[id]/restaurants/[id]`) - Individual restaurant view

### Core Components
- **RestaurantCard** - Display restaurant information with actions
- **RestaurantCreateDialog** - Create new restaurants (Google Places + manual)
- **RestaurantEditDialog** - Edit existing restaurant details
- **ActivityRestaurantSelector** - Link existing restaurants to activities
- **ActivityLinkManager** - Manage activity links from restaurant detail view

### Hooks
- **useRestaurants** - Fetch restaurants for a trip with filtering
- **useRestaurant** - Fetch single restaurant with activity links
- **useRestaurantsByActivity** - Fetch restaurants linked to specific activity
- **useCreateRestaurant** - Create new restaurant
- **useUpdateRestaurant** - Update restaurant details
- **useDeleteRestaurant** - Delete restaurant and all links
- **useLinkRestaurantToActivity** - Create activity link
- **useUnlinkRestaurantFromActivity** - Remove activity link

## Usage Examples

### Basic Restaurant Management
```tsx
import { useRestaurants, RestaurantCard } from '@/features/restaurants';

function RestaurantList({ tripId }: { tripId: string }) {
  const { data: restaurants } = useRestaurants(tripId);

  return (
    <div className="grid gap-4">
      {restaurants.map(restaurant => (
        <RestaurantCard
          key={restaurant.id}
          restaurant={restaurant}
          tripId={tripId}
          showActivityLinks
        />
      ))}
    </div>
  );
}
```

### Activity Integration
```tsx
import { ActivityRestaurantSelector } from '@/features/restaurants';

function ActivityEditForm({ activity }: { activity: Activity }) {
  return (
    <form>
      {/* Other activity fields */}

      <ActivityRestaurantSelector
        activityId={activity.id}
        tripId={activity.trip_id}
      />
    </form>
  );
}
```

### Creating Restaurants
```tsx
import { RestaurantCreateDialog } from '@/features/restaurants';

function AddRestaurantButton({ tripId }: { tripId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Add Restaurant
      </Button>

      <RestaurantCreateDialog
        tripId={tripId}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
```

## Google Places Integration

### Compliance Features
- `place_id` stored permanently for re-geocoding
- Location coordinates (`lat`/`lon`) automatically expire after 30 days
- `location_updated_at` tracks when coordinates were last refreshed
- Background cleanup function removes expired location data

### Usage
```tsx
// Coordinates are available if within 30-day window
if (restaurant.lat && restaurant.lon) {
  // Use coordinates for mapping
  const mapUrl = `https://maps.google.com/?q=${restaurant.lat},${restaurant.lon}`;
} else if (restaurant.place_id) {
  // Re-fetch coordinates using place_id if needed
  const details = await googlePlaces.getPlaceDetails(restaurant.place_id);
}
```

## Data Flow

1. **Restaurant Creation**
   - User creates restaurant via Google Places or manual entry
   - Restaurant stored in `restaurants` table with trip scope
   - Location data marked with current timestamp

2. **Activity Linking**
   - User links restaurant to activity via `ActivityRestaurantSelector`
   - Link stored in `activity_restaurants` junction table
   - Multiple activities can link to same restaurant

3. **Data Expiry**
   - Location coordinates expire after 30 days per Google requirements
   - `place_id` remains for future coordinate re-fetching
   - Background job cleans expired location data

## Migration from Legacy System

See `RESTAURANT_MIGRATION.md` for detailed migration instructions from the old activity-embedded restaurant system.

### Quick Migration
1. Replace `InlineRestaurantManager` with `ActivityRestaurantSelector`
2. Update imports to use new restaurant feature
3. Create restaurants separately, then link to activities
4. Update schemas to use new restaurant types

## Security

### Row Level Security (RLS)
- Users can only access restaurants in trips they're members of
- All CRUD operations enforce trip membership
- Activity linking requires membership in both trip and activity's trip

### Data Validation
- Zod schemas validate all input data
- Type safety throughout the component tree
- Proper error handling with user-friendly messages

## Performance

### Optimizations
- Query caching with React Query
- Pagination support for large restaurant lists
- Efficient indexing on trip_id, place_id, and location fields
- Normalized data prevents duplication

### Monitoring
- Query performance tracked via React Query DevTools
- Error tracking with Sentry integration
- User actions logged for analytics