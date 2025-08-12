
# Security Measures

This document outlines key security implementations within the Lexity application.

## Authentication Error Sanitization

To prevent information leakage through authentication error messages, we sanitize all raw error responses from our authentication provider (Supabase) before they are displayed to the user.

**Implementation:**

- A utility function, `mapAuthError`, is located at `src/lib/utils/auth-error-mapper.ts`.
- This function contains a map of known raw error substrings to safe, user-friendly messages.
- For example, both "Invalid login credentials" and "User not found" are mapped to the generic "Incorrect email or password."
- The `auth.store.ts` file uses this mapper to process any error messages before setting them in the global state, ensuring that UI components only ever receive sanitized messages.

This approach prevents attackers from using error messages to determine whether a specific email address is registered on the platform.

## Content Security Policy (CSP)

We implement a strict, nonce-based Content Security Policy (CSP) to mitigate the risk of Cross-Site Scripting (XSS) and other content injection attacks.

**Implementation:**

- The CSP is dynamically generated for each request within `src/app/layout.tsx`.
- A cryptographic nonce is generated on the server for each request.
- The `'strict-dynamic'` directive is used for `script-src`, which allows scripts with a valid nonce to load other necessary scripts, providing a high level of security without being overly restrictive for modern, dynamic applications.

**Current Policy:**

```
default-src 'self';
script-src 'self' 'nonce-...' 'strict-dynamic' https://*.posthog.com;
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
connect-src 'self' [Supabase URL] wss://[Supabase Host] https://*.sentry.io https://*.posthog.com https://vitals.vercel-insights.com;
font-src 'self';
object-src 'none';
frame-src https://js.stripe.com https://hooks.stripe.com;
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests;
```

**Trade-offs and Notes:**

- **`style-src: 'unsafe-inline'`**: This is currently necessary due to the way our component library (`shadcn/ui`) and other dependencies inject styles at runtime. While not ideal, it is a common trade-off. We will continue to monitor for solutions that would allow us to remove this directive in the future.