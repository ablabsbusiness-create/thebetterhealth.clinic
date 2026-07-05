# The Better Lungs Clinic EMR

Standalone Vite web app for The Better Lungs Clinic EMR.

## Local development

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file from `.env.example` and fill in the cloud service values.

3. Start the dev server:

```bash
npm run dev
```

## Vercel deployment

The root site builds this EMR into `/emr/lungs`, so the public URL is:

```bash
https://www.thebetterhealth.clinic/emr/lungs/
```

Set these environment variables in the shared Vercel project settings before deploying:

- `VITE_LUNGS_FIREBASE_API_KEY`
- `VITE_LUNGS_FIREBASE_AUTH_DOMAIN`
- `VITE_LUNGS_FIREBASE_PROJECT_ID`
- `VITE_LUNGS_FIREBASE_STORAGE_BUCKET`
- `VITE_LUNGS_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_LUNGS_FIREBASE_APP_ID`
- `VITE_LUNGS_FIREBASE_MEASUREMENT_ID`
- `CLINIC_ACCESS_PASSWORD`
- `CLINIC_SESSION_SECRET`

Use the Firebase web app values for the Lungs EMR Firebase project here. Kids uses the matching `VITE_KID_FIREBASE_*` variables in the same Vercel project.

`CLINIC_ACCESS_PASSWORD` is the actual clinic login password. `CLINIC_SESSION_SECRET` should be a long random secret used to sign the secure session cookie.

Build command:

```bash
npm run build
```

Output directory:

```bash
dist
```
