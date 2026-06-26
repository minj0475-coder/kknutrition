# Data Safety Rules

This site stores user-created operational data in browser storage and Firebase. Future automated edits must preserve that data.

Before editing:
- Work from the latest remote `main` branch.
- Do not use stale local files as the source of truth.
- Check `git status` before changing files.

Never overwrite or reset these user data keys unless the user explicitly asks for a data reset:
- `kknutrition_memo`
- `kknutrition_memo_meta`
- `kknutrition_bookmarks_v4`
- `kknutrition_bookmarks_v4_meta`
- `kkulkkoori_academic_events_v1`
- `kkulkkoori_vendor_network_v1`
- `kkulkkoori_promo_contacts_v1`
- `kkulkkoori_work_notes_v1`
- `kkulkkoori_message_templates_v1`
- `kkulkkoori_service_sheet_link`
- `kkulkkoori_annual_sheet_links_v1`
- `kkulkkoori_cheongsu_recipes_v3`
- `cookingMethodUploadedData_v5`

Implementation rules:
- Do not replace `localStorage` data with default arrays after the user has saved data.
- Do not remove `assets/data-guard.js` or bypass `KKNutritionDataGuard`.
- Do not change cloud sync conflict handling to prefer remote data over existing local data without an explicit user request.
- When adding a new user-editable feature, add its storage key to `assets/data-guard.js` and, if it should sync across devices, to `CLOUD_SYNC_KEYS` in `assets/firebase-init.js`.
- Bump cache query versions in `index.html` when changing JS/CSS.
- After changes, verify that existing protected keys are still present in the source and that the app loads without console errors.

