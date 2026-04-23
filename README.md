# The Better Health Clinic App

Static multi-page clinic app built with Vite.

## Local development

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file from `.env.example` and fill in the Firebase values.

3. Start the dev server:

```bash
npm run dev
```

## Vercel deployment

Deploy this project as a Vite static site on Vercel. The site is configured to be served from `/app`, so the public URL will be `https://thebetterhealth.clinic/app`.

Set these environment variables in the Vercel project settings before deploying:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

Build command:

```bash
npm run build
```

Output directory:

```bash
dist
```
