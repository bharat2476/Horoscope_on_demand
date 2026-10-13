# Controlled Android release

This repository can build three Android variants. It does not submit them to Google Play. There is no `submit` block in `eas.json`. Do not add one until the launch checklist is reviewed by a person.

`com.spiritualguidance.app` and the `spiritualguidance` URL scheme are provisional. Confirm both are free, and owned by this project, in Play Console before the first upload.

## Versions

- User-facing version: `0.1.0` in `app.json` and `package.json`.
- Android `versionCode`: `1`.
- `eas.json` uses `appVersionSource: local` and `autoIncrement: false` on the production profile, so a build does not bump the store version by itself.

## Environments

| Profile       | Artifact                   | `EXPO_PUBLIC_APP_ENV` | Who receives it                   |
| ------------- | -------------------------- | --------------------- | --------------------------------- |
| `development` | APK, dev client            | `development`         | Engineers                         |
| `staging`     | APK, internal distribution | `staging`             | Closed testers                    |
| `production`  | AAB, store distribution    | `production`          | Nobody, until a person uploads it |

Each environment needs its own Supabase project. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in that EAS environment or in a local `.env` that is not committed. Leave them empty to ship a build with sign-in disconnected. Never set a service-role key, database password, or JWT secret as an `EXPO_PUBLIC_` variable.

An unknown `EXPO_PUBLIC_APP_ENV` fails closed. A blank value means development.

## Signing

Generate the upload keystore outside this repository. `*.jks` and `*.keystore` are gitignored.

1. Create the keystore with `keytool` on a machine that is backed up. Record the alias, store password, and key password in a password manager. Two people should be able to reach that backup.
2. Enroll the app in Play App Signing when the first AAB is uploaded, so Google holds the app signing key and this keystore remains the upload key.
3. For EAS Build, run `eas credentials` and store the upload key in EAS. Do not paste it into `eas.json` or the git history.
4. Download the Play App Signing certificate from Play Console after enrollment and keep it with the upload-key record.
5. A lost upload key can be reset through Play Console. A lost Play app signing key cannot be replaced by this repository.

Local release commands, when the Android SDK and EAS CLI are installed:

```bash
npx expo prebuild --platform android --no-install
eas build --platform android --profile staging
```

Inspect the generated `android/app/build.gradle` for `targetSdk` before upload. As of 14 October 2026, Google Play requires a new app to target Android 16 (API 36). That value is not generated in this repository yet. Source: [Target API level requirements](https://support.google.com/googleplay/android-developer/answer/11926878).

The production AAB is created with:

```bash
eas build --platform android --profile production
```

Uploading that AAB, starting a test track, or applying for production are separate manual steps in Play Console.
