# Deploy Pulse on Vercel

This copy has been converted from the original ChatGPT Sites/Vinext build setup to a standard Next.js build that Vercel can deploy.

## Vercel settings

- Framework preset: **Next.js**
- Build command: leave at the default (`next build` / `npm run build`)
- Output directory: leave blank/default
- Install command: leave default (`npm install`)
- Node.js: use a supported Node 22 release

## Before enabling connected health data

The dashboard itself can deploy without OAuth credentials. The health connection routes need the environment variables documented in `.env.example`/`SETUP.md`, and the OAuth callback URL must match the final Vercel domain.

The original private ChatGPT Sites authentication headers are not supplied by Vercel. If you want the hosted Vercel version to have user sign-in before connecting health data, add a Vercel-compatible authentication provider before using it with real personal health data.
