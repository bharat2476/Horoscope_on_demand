# Content policy

Public ritual, festival, and temple text is published only through the review workflow in `supabase/migrations/20261014120000_content_review.sql`. The Android app can read the published views. It cannot insert, approve, or publish.

## What may be published

- A ritual, festival, or temple record with at least one source.
- A source whose reuse is `public-domain`, `quoted-with-permission`, or `short-citation-only`.
- A festival date that is already stored. The database does not invent one.
- A temple verification date.
- A mantra only when it points at a cleared source.
- A distinction, in the record itself, among scripture, commentary, scholarly interpretation, and regional custom.

## What stays out

- Claims of financial success, guaranteed protection, guaranteed health, a cure, or removal of all dosha. The database rejects those phrases.
- An uncleared quotation or a mantra without a source.
- A direct write to `content.documents`, `content.revisions`, or `content.submissions`. The trigger rejects it unless the workflow flag is set inside the staff functions.
- A publish action by the same person who created the draft.
- A photo or correction from the public app. The moderation function exists for staff, and there is no Storage bucket or upload policy in this repository.

## Who may act

`content_staff` is a nologin role. A trusted server must set `content.actor_id` and assume that role. The anon key, the authenticated role, and the service-role grant used by the mobile client cannot execute `create_document`, `apply_action`, or `moderate_submission`.

No content is seeded. The public catalogs in the app are empty until a reviewed record is published in a hosted database.
