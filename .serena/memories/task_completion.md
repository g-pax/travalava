# Task Completion Checklist
- Run `npm run lint` and `npm run test` when changes affect logic; include `npm run e2e` for UI flows if relevant.
- Verify UI changes within the dev server (`npm run dev`) before shipping.
- Ensure Supabase-related hooks invalidate/refresh React Query caches after mutations.
- Provide concise summary of changes plus suggested follow-up actions in pull requests.