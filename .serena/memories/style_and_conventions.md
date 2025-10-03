# Style and Conventions
- TypeScript throughout; React components in functional "use client" files when needed. Prefer typed hooks and interfaces declared near Supabase hooks.
- Tailwind utility classes are the primary styling mechanism; components from shadcn/ui (Card, Button, Badge, etc.) are commonly composed.
- Use React Query hooks for data access, typically exported from `src/features/**/hooks`. Keep UI components presentational and let hooks handle Supabase interaction.
- Formatting and linting handled by Biome (2-space indentation, organize imports). Maintain concise inline comments only when logic is non-trivial.