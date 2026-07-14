# Curtis App

Skeleton scaffolded from a scan of the reference Glide app (Dan Pfaff's Training Inventory). Category → Circuit → Exercise, three-level drill-down.

## Run it

```
npm install
npm run dev
```

## Where to plug things in later

- **Data / database**: `src/data/inventory.ts` currently holds static placeholder categories and circuits (names matched to the reference app) with mostly empty `exercises` arrays. Swap this module for a real fetch (Supabase, Firebase, your own API) once the database exists — keep the shape in `src/types.ts`.
- **GIFs/images**: drop files in `public/media/` and set `mediaUrl` on each exercise (e.g. `/media/prisoner-squats.gif`).
- **Auth**: the Sign In / Sign Up buttons in `src/components/Header.tsx` are non-functional placeholders.
