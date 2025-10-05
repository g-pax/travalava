# Location Extraction Feature

## Overview

The activity edit and create forms now support extracting latitude and longitude coordinates from Google Maps URLs and iframe embed codes. Users can paste Google Maps links directly into the location field, and the coordinates will be automatically extracted.

## Features

### Two Separate Inputs

The location section provides two dedicated input fields:

1. **Google Maps Short URL** - Single-line input for short URLs
   - Example: `https://maps.app.goo.gl/xyz123`
   - Can also accept full Google Maps URLs
   
2. **Google Maps Iframe Embed** - Multi-line textarea for iframe code
   - Example: `<iframe src="https://www.google.com/maps/embed?pb=..." width="600" height="450"></iframe>`
   - Accepts the complete iframe HTML string

### Coordinate Extraction Patterns

The system extracts coordinates from three different Google Maps URL patterns:

- **Pattern A**: `!2d{lng}!3d{lat}` (embed URLs)
  - Example: `https://www.google.com/maps/embed?pb=!1m18!2d-0.127647!3d51.507351!...`
  
- **Pattern B**: `@lat,lng,zoom` (maps URLs)
  - Example: `https://www.google.com/maps/@51.507351,-0.127647,15z`
  
- **Pattern C**: `q=lat,lng` (query parameters)
  - Example: `https://www.google.com/maps?q=51.507351,-0.127647&z=15`

## Implementation

### Utility Functions

Located in `src/lib/google-maps-utils.ts`:

- `extractLatLngFromGoogleMapsSrc(input: string)`: Extracts coordinates from URLs or iframes
- `isGoogleMapsInput(input: string)`: Validates if input is a Google Maps URL or iframe

### Form Integration

Both `ActivityEditForm` and `ActivityCreateForm` now include:

1. **Two Input Fields**: 
   - Single-line input for short URLs (monospace font)
   - Multi-line textarea (3 rows) for iframe embed code (monospace font)
2. **Real-time Coordinate Extraction**: Automatic extraction as you type/paste
3. **Visual Confirmation**: Coordinates displayed in a styled box below inputs
4. **Smart Naming**: Short URL is used as location name when both inputs are provided
5. **Error Handling**: Specific error messages for URL vs iframe extraction failures

### Data Structure

Location data is stored as:

```typescript
{
  name: string;  // The full URL or location name
  lat: number;   // Latitude coordinate
  lon: number;   // Longitude coordinate
}
```

## Usage Example

### Workflow

1. **Option A: Using Short URL**
   - Paste a Google Maps short URL (e.g., `https://maps.app.goo.gl/xyz123`) into the first input
   - Coordinates are automatically extracted and displayed below
   - The short URL is stored as the location name

2. **Option B: Using Iframe**
   - Paste the full iframe embed code into the second input
   - Coordinates are automatically extracted and displayed below
   - The iframe code is stored as the location name (or the short URL if both are provided)

3. **Option C: Using Both**
   - Paste short URL in the first input
   - Paste iframe in the second input
   - Either one will trigger coordinate extraction
   - The short URL is prioritized as the location name
   
### Visual Feedback

After pasting valid input, you'll see a confirmation box displaying:
```
Extracted Coordinates:
Latitude: 51.507351    Longitude: -0.127647
```

The coordinates are formatted with 6 decimal places for precision and displayed in a grid layout with monospace font.

## UI/UX

- **Two Dedicated Inputs**: Separate fields for short URL and iframe for clarity
- **Monospace Font**: Both inputs use monospace font for better readability
- **Input Sizing**: 
  - Short URL: Single-line input
  - Iframe: 3-row textarea for comfortable pasting
- **Muted Labels**: Subtle text color for input labels
- **Confirmation Box**: Styled box with muted background displaying extracted coordinates
- **Grid Layout**: Two-column grid showing latitude and longitude separately
- **Coordinate Formatting**: 6 decimal places precision in monospace font
- **Error Messages**: Clear, specific red text for URL vs iframe extraction failures
- **Real-time Updates**: Coordinates update instantly as you type/paste

## Testing

Unit tests are available in `src/lib/__tests__/google-maps-utils.test.ts` covering:

- All three coordinate extraction patterns
- iframe embed code parsing
- Negative coordinate handling
- Invalid input handling
- Case-insensitive URL matching

## Future Enhancements

- Integration with Google Maps Geocoding API for plain text addresses
- Reverse geocoding to display human-readable names from coordinates
- Map preview in the form
- Coordinate validation and bounds checking

