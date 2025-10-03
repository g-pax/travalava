# Travalava Project Overview
- Collaborative trip planning platform built with Next.js 15 (App Router) and TypeScript.
- Uses Supabase as the backend for persistence plus React Query for data fetching/caching.
- UI built with Tailwind CSS utility classes and shadcn/ui component primitives.
- Organised under `src/features/**` for domain modules (activities, trip, etc.), with shared utilities in `src/lib`, `src/components`, and Supabase client/config under `src/supabase`.