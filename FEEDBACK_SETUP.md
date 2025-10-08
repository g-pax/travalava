# Feedback System Setup

This document explains how to set up and configure the in-app feedback feature.

## Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Feedback system
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
IP_SALT=change-this-to-a-random-string-in-production
```

### Getting Your Service Role Key

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the "service_role" key (not the anon/public key)
4. Paste it as `SUPABASE_SERVICE_ROLE_KEY` in your environment variables

### IP Salt

Generate a random string for `IP_SALT` to ensure IP hashing is secure:

```bash
openssl rand -base64 32
```

## Database Setup

1. Run the SQL schema in `supabase.sql` in your Supabase SQL editor:
   - This creates the `feedback` table with proper indexes and RLS policies
   - Sets up the necessary database structure

2. Screenshots are automatically stored in your existing Cloudflare R2 bucket in the `/feedback/` folder
   - No additional storage setup needed
   - Uses the same R2 configuration as the rest of your image uploads

## Features

### Feedback Widget

- **Floating Button**: Appears on all pages in the bottom-right corner (only for authenticated users)
- **Authentication Required**: Only logged-in users can submit feedback
- **Form Fields**:
  - Type: Bug Report, Feature Request, or Other
  - Message: Free-text feedback (max 2000 characters)
  - Screenshot: Optional screen capture using native browser APIs

### Screenshot Capture

- Uses `navigator.mediaDevices.getDisplayMedia()` for screen capture
- **Smart Capture**: Temporarily hides the feedback dialog to capture the page behind it
- Fallback gracefully if permission denied or unsupported
- Automatically compresses images to JPEG format
- Size limit: 1.5MB maximum

### Automatic Context Collection

The system automatically captures:
- Current URL and route
- **Authenticated User ID** from Supabase Auth
- App version and Git SHA (from environment variables)
- User agent and viewport information
- Locale and timezone
- Feature flags (if `window.__FF__` is set)
- Breadcrumbs (if `window.__BREADCRUMBS__` is set)

### Security Features

- **Authentication Required**: Only authenticated users can submit feedback
- **Row Level Security**: Users can only access their own feedback
- **Rate Limiting**: 5 submissions per 10 minutes per IP
- **PII Redaction**: Automatically removes emails and phone numbers from messages
- **Secure Storage**: Screenshots stored in Cloudflare R2 in `/feedback/` folder
- **IP Hashing**: IPs are hashed with salt before storage

## API Endpoints

### POST `/api/feedback`

Accepts feedback submissions with the following payload:

```typescript
{
  type: "bug" | "idea" | "other";
  message: string;
  context: {
    url: string;
    route: string;
    userId?: string;
    userAgent: string;
    viewport: { w: number; h: number; dpr: number };
    locale: string;
    timezone: string;
    appVersion?: string;
    gitSha?: string;
    env: string;
    featureFlags: object;
    breadcrumbs: any[];
  };
  screenshot?: string; // base64 data URL
}
```

## Viewing Feedback

### Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to Table Editor > feedback
3. View all submitted feedback with full context

### Screenshots

Screenshots are stored in your Cloudflare R2 bucket in the `/feedback/` folder. To view them:

1. Access through Cloudflare R2 dashboard
2. Screenshots are publicly accessible via your R2 public URL: `${NEXT_PUBLIC_R2_PUBLIC_URL}/feedback/screenshot-filename.jpg`
3. Or implement an admin interface that constructs the public URLs

## Testing

### Manual Testing Checklist

- [ ] Feedback button appears on all pages
- [ ] Modal opens and closes correctly
- [ ] All form fields work properly
- [ ] Screenshot capture works (or fails gracefully)
- [ ] Rate limiting triggers after 5 submissions
- [ ] Success/error toasts display correctly
- [ ] Feedback appears in Supabase database
- [ ] Screenshots upload to R2 /feedback/ folder

### Rate Limiting Test

To test rate limiting:

1. Submit feedback 5 times quickly
2. The 6th submission should return a 429 error
3. Wait 10 minutes and try again (should work)

## Error Handling

The system is designed to fail gracefully:

- If screenshot capture fails, feedback still submits without screenshot
- If R2 upload fails, feedback still saves without screenshot
- If rate limiting check fails, the request is allowed (fail open)
- All errors are logged for debugging

## Extending PII Redaction

To add more PII patterns, edit `src/lib/redact.ts`:

```typescript
// Add new regex patterns
const CREDIT_CARD_REGEX = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;

export function redactPII(message: string): string {
  return message
    .replace(EMAIL_REGEX, "[EMAIL_REDACTED]")
    .replace(PHONE_REGEX, "[PHONE_REDACTED]")
    .replace(CREDIT_CARD_REGEX, "[CARD_REDACTED]")
    .replace(SSN_REGEX, "[SSN_REDACTED]");
}
```

## Production Considerations

1. **Monitor Storage Usage**: Screenshots can accumulate over time
2. **Review Rate Limits**: Adjust if legitimate users are being blocked
3. **Regular Cleanup**: Consider archiving old feedback periodically
4. **Analytics**: Track feedback trends and common issues
5. **Admin Interface**: Build a dashboard for feedback management