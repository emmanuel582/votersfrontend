# votersfrontend

School Awards voting app — deploy on [Vercel](https://vercel.com).

## Setup

1. Import this repo in Vercel (framework: Vite).
2. Add environment variables from `.env.example`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` → your Render backend URL (e.g. `https://votersbackend.onrender.com`)
3. Deploy — `vercel.json` handles SPA routing (no 404 on refresh).
