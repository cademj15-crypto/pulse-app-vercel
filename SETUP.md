# Pulse

Phone-friendly Fitbit / Google Health dashboard. The first release includes demo mode, 28 selectable dates, 56 days of read-only history retrieval, HRV / resting heart rate baselines, sleep goals and workout duration. Recovery is an explicitly experimental heuristic; this release does not implement WHOOP strain or AI coaching.

## Enable live data

1. Follow https://developers.google.com/health/setup to enable Google Health API in a Google Cloud project.
2. Create a Web application OAuth client. Register exactly:
   https://pulse-fitbit.lj-f8b6.chatgpt.site/api/google/callback
3. Configure these read-only scopes:
   - https://www.googleapis.com/auth/googlehealth.sleep.readonly
   - https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly
   - https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly
4. Add the Google account linked to the Fitbit as an OAuth test user.
5. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (secret) in the Site runtime environment, then redeploy the saved version. APP_ORIGIN and a random SESSION_SECRET are already configured. Do not put secret values in source control or browser code.
6. Open the app, select Connect Fitbit, continue with Google, and grant the requested read permissions.

The private Site's ChatGPT identity authenticates the visitor. Google OAuth is only for authorizing access to the health data. OAuth state, expiry, user binding and PKCE protect the callback. Tokens are AES-GCM encrypted in Secure HttpOnly SameSite=Lax cookies, with an app-level 30-day connection lifetime. Refresh happens on demand. Google testing-mode refresh tokens may expire earlier; reconnect when needed.

Readings are held in page memory, not a health database. Sleep goals are a device-local preference. Disconnect revokes the Google token and clears connection cookies. The app requests no health-data write permission. Sync is manual / on page load, not a background job. Full live-provider validation is pending real credentials and user authorization.

## Verification

- Production build: Sites build helper.
- Focused checks: node --test tests/pulse.test.mjs.
- No browser QA was requested or performed.

Data shapes and filters: https://developers.google.com/health/reference/rest/v4/users.dataTypes.dataPoints and its list method.
