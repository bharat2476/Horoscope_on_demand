# Spiritual Guidance

Android app shell for daily Rashi horoscopes, location-specific Panchang, reviewed Hindu rituals, festival information, and a curated Mataji temple directory. This repository is the first engineering milestone: a runnable Expo shell, not the content product.

The git repository was empty (no commits and no application files). There was no existing app to migrate. It was initialized with the current Expo TypeScript template, then the demo screens were replaced with the shell described below.

The on-screen name **Spiritual Guidance** is a working title. The final product name, Android application id, and icon are still open. See [docs/DECISIONS.md](docs/DECISIONS.md).

## What works in this version

- Bottom navigation for Home, Horoscope, Panchang, Rituals, and Temples.
- A Settings screen for language and a disabled account section.
- English, Hindi, Gujarati, Tamil, Malayalam, Marathi, Kannada, Telugu, Bengali, and Punjabi interface strings.
- A device-local language and Rashi preference. No account is required.
- Public screens open with no Supabase project and no `.env` file.

## What this version deliberately does not do

- It does not show a horoscope, a Panchang, a ritual, a festival, or a temple.
- It does not calculate tithi, nakshatra, yoga, karana, or any other Panchang value.
- It does not ask for birth date, birth time, or birthplace.
- It does not sign anyone in, send analytics, show ads, or send notifications.

Those gaps are intentional. Content is added only after a reviewed source exists.

## Docs

- [Product requirements](docs/PRD.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Security](docs/SECURITY.md)
- [Decisions](docs/DECISIONS.md)

## Prerequisites

- Node.js 20 or newer. This project was created with Node.js 24.15.0 and npm 11.12.1.
- JDK 17. On Windows, [Android Studio's bundled JDK](https://docs.expo.dev/workflow/android-studio-emulator/) or `Microsoft OpenJDK 17` is enough.
- Android Studio, with:
  - Android SDK Platform 36 (Android 16)
  - Android SDK Build-Tools
  - Android SDK Platform-Tools
  - Android Emulator
- A phone or an emulator. Expo Go is enough for this shell because every native module it uses ships in Expo Go.

iOS and web are not launch targets. The Expo template still includes `npm run ios` and `npm run web`. Do not treat either as a supported product surface.

## Install

From the repository root:

```powershell
npm install
```

Copy environment names only when you have a Supabase project. The app runs if this file does not exist.

```powershell
Copy-Item .env.example .env
```

Leave the values empty, or set the public project URL and the anon key. Never put the service-role key in `.env` or in the app. `.env` is gitignored.

## Run on an Android emulator (Windows)

1. Install Android Studio and, in the setup wizard, include Android Virtual Device.
2. Open **Settings > Languages & Frameworks > Android SDK**.
3. On **SDK Platforms**, install **Android API 36**.
4. On **SDK Tools**, install **Android SDK Build-Tools**, **Android SDK Platform-Tools**, and **Android Emulator**.
5. Set a user environment variable `ANDROID_HOME` to the SDK location. The usual path is `%LOCALAPPDATA%\Android\Sdk`.
6. Add these directories to the user `Path`:
   - `%LOCALAPPDATA%\Android\Sdk\platform-tools`
   - `%LOCALAPPDATA%\Android\Sdk\emulator`
7. Open a new PowerShell window and check the tools:

```powershell
adb --version
```

8. In Android Studio, open **Device Manager** and create a virtual device. A current Pixel with a Google Play system image is a good first choice. Start the emulator and wait until the home screen is visible.
9. From the repository root:

```powershell
npm run android
```

That starts Metro and opens the project on the running emulator. The first launch can install an Expo Go build that matches this SDK. If the Play Store copy of Expo Go is older than SDK 57, download a matching build and install the apk that the command prints:

```powershell
npx expo-go download android latest
adb install -r .\path\to\the-downloaded.apk
npm run android
```

Replace the apk path with the file printed by the download command. Do not install a random apk from the Expo cache.

A development build is the next step when a native module is not in Expo Go. It is not required for this shell:

```powershell
npx expo run:android
```

That command generates the local `android` directory, which is gitignored, and compiles with the SDK installed above.

## Run on a physical Android phone

1. On the phone, open **Settings > About phone** and tap **Build number** seven times.
2. Open **Developer options** and enable **USB debugging**.
3. Install Expo Go from the Play Store. If that build does not support SDK 57, install the SDK 57 Expo Go apk with `adb install` as in the emulator section, or use `npx expo run:android` with the phone connected.
4. Connect the phone by USB, accept the debugging prompt, and confirm the device is visible:

```powershell
adb devices
```

5. Put the phone and the computer on the same Wi-Fi network. Then:

```powershell
npm start
```

6. In the Expo CLI, press `a` to open the connected phone, or scan the QR code from inside Expo Go (Android Camera does not always open Expo projects).
7. If the phone cannot reach Metro, reverse the packager port over USB and reload:

```powershell
adb reverse tcp:8081 tcp:8081
```

When the phone and computer are on different networks, `npx expo start --tunnel` is a development-only fallback. It can prompt to install a tunnel dependency. Do not use a tunnel for production.

## Checks

```powershell
npm test
npm run lint
npm run typecheck
npm run format:check
```

`npm test` runs Jest once and exits. It does not start a watch.

## Project layout

```text
src/app                 Expo Router screens. Shell only.
src/modules/horoscope   Rashi labels and an unavailable daily reading.
src/modules/panchang    Request shape. No calculation.
src/modules/rituals     Empty reviewed catalog.
src/modules/temples     Empty Mataji directory.
src/modules/localization
src/modules/preferences Device-local language and Rashi preference.
src/modules/authentication
src/modules/analytics   No-op client. No vendor.
```

## Before any public release

Replace `assets/images/icon.png`, the Android adaptive icons, and the splash image. They are still the Expo template artwork. Expo's logo is not this product's icon.

Have a native speaker review every interface string in [src/modules/localization/messages.ts](src/modules/localization/messages.ts) before release. The strings are a draft.
