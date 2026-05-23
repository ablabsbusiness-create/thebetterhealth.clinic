# Kid EMR Template

Deployable pediatric EMR template with patients, vitals, prescriptions, growth charts, vaccination records, intake approvals, PDF preview, WhatsApp sharing, and clinic branding settings.

## Deploy On Vercel

1. Push this folder to GitHub.
2. Create a new Vercel project.
3. Set the Vercel Root Directory to:

```txt
Template
```

4. Use these build settings:

```txt
Framework Preset: Vite
Install Command: npm install
Build Command: npm run build
Output Directory: dist
```

5. Add the environment variable keys below in Vercel. Use your Firebase web app values.

```txt
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
CLINIC_ACCESS_PASSWORD
CLINIC_SESSION_SECRET
```

`CLINIC_ACCESS_PASSWORD` and `CLINIC_SESSION_SECRET` are optional unless you add route-level password protection. Keep `CLINIC_SESSION_SECRET` long and random if used.

## How To Get Env Values

In Firebase:

1. Open Firebase Console.
2. Open your project.
3. Go to Project settings.
4. In General, scroll to Your apps.
5. Create or open a Web app.
6. Copy values from the `firebaseConfig` object.

Map the Firebase config to Vercel env like this:

```txt
apiKey             -> VITE_FIREBASE_API_KEY
authDomain         -> VITE_FIREBASE_AUTH_DOMAIN
projectId          -> VITE_FIREBASE_PROJECT_ID
storageBucket      -> VITE_FIREBASE_STORAGE_BUCKET
messagingSenderId  -> VITE_FIREBASE_MESSAGING_SENDER_ID
appId              -> VITE_FIREBASE_APP_ID
measurementId      -> VITE_FIREBASE_MEASUREMENT_ID
```

Example source format from Firebase:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...firebaseapp.com",
  projectId: "...",
  storageBucket: "...firebasestorage.app",
  messagingSenderId: "...",
  appId: "...",
  measurementId: "..."
};
```

For password protection:

```txt
CLINIC_ACCESS_PASSWORD
```

Choose the password/PIN staff will type to enter the EMR.

```txt
CLINIC_SESSION_SECRET
```

Create a long random value. You can generate one locally with:

```txt
node -e "console.log(crypto.randomUUID() + crypto.randomUUID())"
```

## Firebase Setup

Create a Firebase project, then create a Web App and copy the config values into the Vercel environment variables.

Enable:

- Firestore Database
- Firebase Storage

The template writes data under:

```txt
clinics/kid
```

The first visit with Firebase configured creates this branding document automatically:

```txt
clinics/kid/clinicSettings/prescriptionBranding
```

When you change the clinic name in Settings, the nav title uses that clinic title on every page. The header logo stays as the included Ab Labs logo.

## Firestore Rules For Current Frontend Setup

These rules keep the template working by allowing only the `clinics/kid` namespace. They are not a replacement for full Firebase Auth.
The same rules are included in `firestore.rules`.

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /clinics/kid {
      allow read, write: if true;
    }

    match /clinics/kid/{document=**} {
      allow read, write: if true;
    }

    match /clinicSettings/kid {
      allow read, write: if true;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Storage Rules For Current Frontend Setup

The same rules are included in `storage.rules`.

```js
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /clinics/kid/{allPaths=**} {
      allow read, write: if true;
    }

    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## Security Note

Firebase web config values are public browser config. Real data security comes from Firebase rules and authentication. For production patient data, upgrade to Firebase Auth or server-side Vercel API access, then tighten rules to authenticated/server-only access.

## Local Development

```txt
npm install
npm run dev
```

Create `.env` locally with the same keys listed above.
