# Security cards

Repository: `https://github.com/feathersjs/feathers#v5.0.46`
Category: secret handling

## secret handling

### Configure Secure Storage Mechanisms for Client Authentication Tokens

**Use when**

Developing client-side applications with Feathers and configuring the `@feathersjs/authentication-client` module for token persistence.

**Secure rules**

**Rule 1: Explicitly configure a secure storage backend or memory-only storage engine instead of relying on default browser local storage for sensitive access tokens.**

When initializing the Feathers authentication client, supply an appropriate storage option such as `MemoryStorage` to prevent unauthorized client-side script extraction of tokens stored in `localStorage`.

```ts
import { feathers } from '@feathersjs/feathers'
import authentication, { MemoryStorage } from '@feathersjs/authentication-client'

const app = feathers()

app.configure(authentication({
  storage: new MemoryStorage(),
  storageKey: 'feathers-jwt'
}))
```

**Rule 2: Exclude private or sensitive application data from JWT payloads.**

Feathers JSON Web Tokens are signed rather than encrypted. Do not store sensitive secrets, keys, or private fields inside token payloads where they can be inspected on the client side.

```ts
// Secure: Store only necessary public identifiers
const payload = { sub: user.id };
```


### Load Secrets and API Credentials from External Configuration or Environment Variables

**Use when**

When configuring application authentication secrets, database connections, and third-party OAuth provider credentials.

**Secure rules**

**Rule 1: Load authentication and OAuth secrets from environment variables**

Map every sensitive value—JWT signing secret, OAuth client ID, and OAuth client secret—to environment variables in **`config/custom-environment-variables.json`** (or a compatible secret store) and load them at runtime with `@feathersjs/configuration`. This keeps credentials out of source control and lets you rotate them without code changes.

```ts
// .env  ────────────────────────────────────────────────────────────────
FEATHERS_SECRET=S3cr3tJWTKey
GITHUB_CLIENT_ID=gh_oauth_id
GITHUB_CLIENT_SECRET=gh_oauth_secret

// config/custom-environment-variables.json  ───────────────────────────
{
  "authentication": {
    "secret": "FEATHERS_SECRET",
    "oauth": {
      "github": {
        "key": "GITHUB_CLIENT_ID",
        "secret": "GITHUB_CLIENT_SECRET"
      }
    }
  }
}

// src/app.ts  ──────────────────────────────────────────────────────────
import * as dotenv from 'dotenv'          // loads .env → process.env
dotenv.config()

import configuration from '@feathersjs/configuration'
import { feathers } from '@feathersjs/feathers'

const app = feathers()
app.configure(configuration())            // merges config + env

console.log('JWT secret:', app.get('authentication').secret) // ✔ loaded from FEATHERS_SECRET
```

**Rule 2: Store Firebase service-account credentials in server-side configuration**

Keep the Firebase service-account JSON strictly on the backend:

* Add the full service-account object to `config/default.json` (or an environment-specific override).
* Load it at runtime with `@feathersjs/configuration` and `app.get('firebase')`.
* Initialize the Firebase Admin SDK with `firebase.credential.cert` so credentials never leave the server.

```js
// config/default.json
{
  "firebase": {
    "type": "service_account",
    "project_id": "my-firebase-project",
    "private_key": "-----BEGIN PRIVATE KEY-----\n...",
    "client_email": "firebase-adminsdk@my-firebase-project.iam.gserviceaccount.com"
  }
}

// src/firebase.js
const firebase = require('firebase-admin');

module.exports = app => {
  const serviceAccount = app.get('firebase');          // loaded from server config
  firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount)
  });
};
```


### Redact and Exclude Sensitive User Data from Response Payloads and Logs

**Use when**

When serializing database models or rendering API responses for external clients to prevent unauthorized exposure of sensitive user attributes and authentication credentials.

**Secure rules**

**Rule 1: Sanitize user data using external resolvers to remove sensitive fields before sending payloads to external clients.**

Use external resolvers to explicitly return undefined for sensitive user properties such as password hashes so they are never sent in API response payloads to external clients.

```typescript
export const userExternalResolver = resolve<User, HookContext>({
  // Ensure password is never sent to external clients
  password: async () => undefined
})
```

**Rule 2: Exclude sensitive local database files and coverage artifacts from version control.**

Ensure test database paths and local coverage output directories are explicitly listed in `.gitignore` to prevent leaking internal database records and temporary test state into code repositories.

```text
/data/
/test/data/
/.nyc_output/
```
