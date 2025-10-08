# In-App Feedback Feature — AI Agent Implementation Prompt

**Role:** You are a senior full-stack engineer. Implement an in-app feedback feature for a Next.js app using Supabase for persistence. Do not add third-party telemetry or vendors. No Sentry, no analytics SDKs, no screenshot libraries. Use only built-in Web APIs, Next.js, TypeScript/React, and `@supabase/supabase-js`.

## Tech Assumptions
- Next.js 13+ App Router, TypeScript, React.
- Supabase already provisioned. Environment variables provided: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- Styling minimal with Tailwind or basic CSS. No external UI libraries.

## Feature Requirements
1. **Client UI**
   - Floating “Feedback” button visible on all pages.
   - Modal with:
     - Type: `bug | idea | other`
     - Multiline message
     - Optional toggle: “Attach screenshot” (default on)
   - On submit: POST JSON to `/api/feedback`.
   - Automatically attach context from the browser:
     - `url`, `route`, `userId` (from `window.__USER_ID__` if present), `appVersion`, `gitSha`, `env`, `userAgent`, `viewport {w,h,dpr}`, `locale`, `timezone`, `featureFlags` (from `window.__FF__` if present), `breadcrumbs` (from `window.__BREADCRUMBS__?.slice(-50)` if present).
   - **Screenshot capture** without third‑party libraries:
     - If enabled, attempt single-frame capture via `navigator.mediaDevices.getDisplayMedia({ video: true })`, draw first frame to a `<canvas>`, convert to JPEG `dataURL`, then immediately stop tracks. If permission denied or unsupported, proceed without screenshot.
   - Basic success/failure UX; disable submit while sending.

2. **API Route** `POST /api/feedback`
   - Parse JSON body: `{ type, message, context, screenshot? }`.
   - Validate `type` in `['bug','idea','other']`, `message` non-empty.
   - Redact PII in `message` (emails, phone numbers).
   - **Rate limit** by hashed IP: allow up to 5 submissions per 10 minutes.
   - If `screenshot` is a `data:image/*;base64,...` URL:
     - Decode and upload to **private** Supabase Storage bucket `feedback`.
     - Save the object key (not a public URL).
   - Insert a row into `public.feedback`.
   - Return `{ ok: true }` on success; appropriate 4xx/5xx on failure.

3. **Database Schema** (place in `supabase.sql` and run separately)
```sql
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  type text check (type in ('bug','idea','other')) not null,
  severity text check (severity in ('S1','S2','S3','S4')) default 'S3',
  message text not null,
  url text,
  route text,
  user_id uuid,
  user_agent text,
  viewport jsonb,
  locale text,
  timezone text,
  app_version text,
  git_sha text,
  env text default 'prod',
  feature_flags jsonb default '{}'::jsonb,
  breadcrumbs jsonb,
  screenshot_path text,   -- storage object key
  ip_hash text,
  created_at timestamptz default now()
);

create index if not exists feedback_created_at_idx on public.feedback (created_at desc);
create index if not exists feedback_route_idx on public.feedback (route);
create index if not exists feedback_user_idx on public.feedback (user_id);

alter table public.feedback enable row level security;
-- No public client inserts; we write with service role key server-side.
create policy "admins_read_only" on public.feedback for select
  to authenticated
  using (false);
```

4. **Storage**
- Create bucket `feedback` (private). Do not expose public read.
- Server uploads screenshots with service role. Admin UI can use signed URLs later.

5. **Security & Privacy**
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.
- Redact PII in messages server-side with regex (emails, phone numbers). Structure code to add IBAN/CC patterns later.
- Cap screenshot size to ≤ 1.5 MB; reject larger with 413.
- Trim strings to reasonable lengths (e.g., `message` 2000 chars, `url` 1000).
- Fail closed: if screenshot upload fails, still store feedback without screenshot.

6. **Project Structure**
```
/app
  /api/feedback/route.ts
/components
  FeedbackButton.tsx
/lib
  supabaseServer.ts        # createClient with service role key
  redact.ts                # PII redaction helpers
  ratelimit.ts             # IP-based rate limit using Supabase queries
/supabase.sql              # schema for reference
```

7. **Implementation Details**
- `supabaseServer.ts`: singleton `createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)`.
- `redact.ts`: `export function redactPII(s: string): string` replacing emails/phones with placeholders.
- `ratelimit.ts`: `export async function isRateLimited(ipHash: string): Promise<boolean>` querying rows where `ip_hash = $1` and `created_at >= now() - interval '10 min'`; return true if count > 5.
- `/api/feedback/route.ts`:
  - Hash IP using SHA‑256 with server secret salt `IP_SALT`.
  - Optional screenshot handling: decode base64, upload to bucket `feedback/fb/<timestamp>-<random>.jpg` with `contentType: 'image/jpeg'`.
  - Insert row and return JSON.
- `FeedbackButton.tsx`:
  - Modal UI, controlled component.
  - Screenshot capture:
```ts
async function captureScreenshot(): Promise<string | undefined> {
  if (!("mediaDevices" in navigator) || !navigator.mediaDevices.getDisplayMedia) return undefined;
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const [track] = stream.getVideoTracks();
    // @ts-ignore - ImageCapture may not be typed in all TS lib versions
    const image = new ImageCapture(track);
    const bitmap = await image.grabFrame();
    track.stop();
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width; canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return undefined;
  }
}
```

8. **Environment Variables**
```
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
IP_SALT=some-long-random-string
```

9. **Acceptance Criteria**
- Feedback button appears on all pages; modal submits successfully.
- Server returns `{ ok: true }` and row is visible in Supabase.
- Rate limiting works: 6th submission within 10 minutes returns 429.
- If screenshot permission is denied, submission still succeeds without screenshot.
- No PII stored in `message` for common email/phone patterns.
- No third-party SDKs beyond `@supabase/supabase-js`.
- Minimal performance overhead; no render-blocking assets.

10. **Tests**
- Unit: `redactPII` for email/phone formats.
- Unit: `captureScreenshot` returns `undefined` in unsupported browsers.
- Integration: API returns 400 for missing message, 429 when over limit, 413 when screenshot too large.
- Manual: Deny screen capture, submit; Allow capture, submit; Submit 6 times rapidly; Long message trimmed.

11. **Deliverables**
- Implement files as per structure.
- Minimal CSS/Tailwind classes inline.
- README section with:
  - Setting env vars, creating the storage bucket, and deployment notes.
  - How to preview admin rows in Supabase Studio.
  - Security notes and how to extend redaction patterns.
