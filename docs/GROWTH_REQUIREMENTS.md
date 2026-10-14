# Growth requirements

Reviewed on 14 October 2026, before the advertising, analytics, notification, and video code. This is not a Play, AdMob, or privacy approval. The account that will publish the app has not been checked in either console.

## Advertising

Sources: [Enable test ads](https://developers.google.com/admob/android/test-ads) (page updated 13 October 2026), [Prevent invalid activity](https://support.google.com/admob/answer/3342099), [Confirmed Click](https://support.google.com/admob/answer/10094971), [UMP SDK](https://developers.google.com/admob/android/privacy), [Play ads policy](https://support.google.com/googleplay/android-developer/answer/9857753), [Contains ads](https://support.google.com/googleplay/android-developer/answer/9859455), [Families policies](https://support.google.com/googleplay/android-developer/answer/9893335).

- Development uses Google's demo ad units only. Those units are not tied to a publisher account. The fixed banner demo unit published by Google is `ca-app-pub-3940256099942544/6300978111`. The demo Android app id is `ca-app-pub-3940256099942544~3347511713`.
- Clicks and impressions on those demo units are the supported way to test. Clicks on live ads, and any method that inflates impressions, are invalid activity and can disable an AdMob account. This app does not contain a click or impression generator.
- Google's page says to replace demo ids before publishing. Until live ads are approved, a production build requests no ad.
- The supported Expo path is a development build with the Google Mobile Ads SDK config plugin (`react-native-google-mobile-ads`). Expo Go does not load that native SDK. If the plugin is not installed, the screen shows no ad rather than a substitute image that could be mistaken for one.
- One placement is allowed: a banner between content sections. It carries the word Advertisement, it is not a button, and it does not sit in the tab bar or against a navigation or action control.
- Ads do not require an account.
- No ad request is made until the person chooses non-personalized or personalized ads. Personalized ads also require a recorded choice. An unknown age, or an age under 18, withholds ads. This app is not a child-directed app and does not use a Families self-certified ads configuration.
- EEA, UK, and Swiss traffic need a Google-certified consent flow before ad requests. The UMP form is not wired in this phase. Personalized ads stay unavailable for that reason.
- Play requires a Contains ads declaration once any ad SDK ships in a release. The privacy policy and Data safety form must mention the advertising id and AdMob. Those forms are not filed.
- Mediation is out of scope. Mediated creatives do not always show a Test Ad label.

## Analytics

- Metrics stay on the device. No analytics vendor is approved, so nothing is transmitted.
- Allowed product measures: first launch, onboarding completion, dates used for daily and weekly activity and a later return, Rashi id, language, public content views, shares, and a useful / not useful choice.
- Ad reporting for money stays in the AdMob console. Test ads are excluded from those reports. The app records only whether a test slot was available.
- Birth date, birth time, birthplace, email, tradition, city id, and coordinates are removed if they appear on an event. Tradition is a religious label and is not a product metric.
- Notification opt-in is recorded as a channel name and a boolean. The notification body is not sent.

## Notifications

- Android 13 and newer require the POST_NOTIFICATIONS runtime permission. The app does not ask for it at launch.
- The benefit is explained in Settings before any later permission request.
- Each reminder is optional: daily horoscope, Panchang, and selected festivals. Quiet hours default to 22:00–07:00 and move a planned reminder to the end of that window.
- Broadcast and push delivery stay off until a later approval. Opt-in values are saved locally and are not sent as campaigns. Devotional or promotional copy is not a notification type.
- Android may delay or drop an alarm because of Doze, app standby, battery limits, a disabled channel, or a force-stop. Exact-alarm access is not requested. Delivery is not guaranteed.
- The earlier database check still requires stored notification delivery to be `off`.

## YouTube

Source: [YouTube API Services Terms of Service](https://developers.google.com/youtube/terms/api-services-terms-of-service), last updated 14 September 2026. Section 16.3 does not grant a license to reproduce or distribute audiovisual content except through the YouTube API Services.

- This phase stores a title and an `https` link on `youtube.com` or `youtu.be`. It does not call the Data API, cache video files, or download media.
- Opening a link hands playback to YouTube. The catalog starts empty. A record needs a permitted or creator-owned label before it can be shown.
- Upload flows, playlist management, and live-notification automation are out of scope.
- Using the Data API later would also require YouTube's developer policies, a published privacy policy, and the child-directed rules in those terms. That work is not started.

Product metrics for launch, activity, content, and ads are recorded on the device. `exportAnalytics` stays `not-approved`. Birth details, coordinates, email, tradition, and city id are dropped. Rashi id and language are included because this phase measures those preferences. Ad revenue is not calculated here; test ads are excluded from AdMob reports.

Reminder opt-in is stored with notification delivery forced to `off`. `BROADCAST_NOTIFICATIONS_APPROVED` is false, so the permission step stays `held` and the system dialog is not opened. Quiet hours are 22:00–07:00 unless the stored clock is invalid.

The advertising slot uses Google's published demo banner id in development and staging, and only after an 18+ choice and a non-personalized choice. Production requests nothing while `LIVE_ADS_APPROVED` is false. The slot is not pressable. The Google Mobile Ads native plugin is not added in this change: Expo Go cannot load it, and a plugin with a demo app id must not ship in a Play bundle. A later development build can add `react-native-google-mobile-ads` with the demo app id `ca-app-pub-3940256099942544~3347511713` after this configuration is approved.

Video rows accept only `https` YouTube watch, short, or live links with a creator-owned or permitted-link label. The published list is empty. Opening a later row uses the system URL opener. No video file is downloaded.

AdMob's revenue share, tax profile, and payment threshold are in the AdMob agreement and are not a cost inside this app. The person is not charged. A Contains ads declaration, an updated privacy-policy URL, and a Data safety update are required before any ad SDK ships, and those forms are not filed.
