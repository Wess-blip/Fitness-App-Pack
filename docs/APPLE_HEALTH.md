# Apple Health integration

## Restriction

A web app hosted on Netlify cannot directly read the HealthKit store. HealthKit access requires an Apple-platform app, explicit entitlements and user authorization for each requested data type.

## Included implementation

`ios-health-bridge/` contains a SwiftUI bridge that requests permission for:

- Body mass
- Active energy burned
- Basal/resting energy burned
- Step count
- Workouts

It posts authorized samples to `/api/health/import`. The backend stores raw samples and can transform weight and activity into application logs.

## Pairing

1. Sign in to the web app.
2. Call authenticated `/api/health/pair`.
3. The route returns a user ID and one-time sync token.
4. Enter them in the iPhone bridge.
5. Store the token in Keychain before production release.

## Privacy rules

- Ask only for data the feature genuinely needs.
- Explain why each type is requested.
- Keep a revoke option.
- Never use HealthKit data for advertising.
- Use private database and storage policies.

## Official references

- https://developer.apple.com/documentation/healthkit
- https://developer.apple.com/documentation/healthkit/setting-up-healthkit
- https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data
- https://developer.apple.com/documentation/healthkit/protecting-user-privacy
