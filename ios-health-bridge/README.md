# Apple HealthKit bridge

A Netlify-hosted PWA cannot directly query HealthKit. This small SwiftUI companion reads only the HealthKit types the user explicitly authorizes and uploads them to `/api/health/import`.

## Xcode setup

1. Create a new iOS SwiftUI project named `FitnessHealthBridge`.
2. Copy the files in `FitnessHealthBridge/` into the project.
3. Add the **HealthKit** capability under Signing & Capabilities.
4. Add the `NSHealthShareUsageDescription` entry from `Info.plist.snippet.xml`.
5. Pair the user by calling the web app's authenticated `/api/health/pair` route. Enter the returned user ID and one-time token into the bridge.
6. Build on a physical iPhone. HealthKit is not fully testable in a normal web browser.

## Production hardening

The sample keeps the token only in view state. Replace this with Keychain storage, add deep-link pairing, background observer queries, batching, retries and a visible revoke button before public release.

The bridge intentionally does not request “all health data.” Apple requires fine-grained permission per data type. Add new types only when your product genuinely needs them.
