(() => {
  "use strict";

  const BACKUP_KEY = "kknutrition_data_guard_backups_v1";
  const MAX_BACKUPS_PER_KEY = 8;
  const MAX_SAVE_ATTEMPTS = 4;

  const EXCLUDED_KEYS = new Set([
    BACKUP_KEY,
    "kknutrition_portal_auth",
    "kknutrition_portal_passkey",
    "kkulkkoori_menu_github_token",
    "kkulkkoori_daily_character",
    "kkulkkoori_recent_pages_v1",
    "kkulkkoori_active_hash_v1",
    "kkulkkoori_sidebar_open_v1",
    "kkulkkoori_cloud_sync_meta_v1",
  ]);

  const PROTECTED_KEYS = new Set([
    "kknutrition_memo",
    "kknutrition_memo_meta",
    "kknutrition_bookmarks_v2",
    "kknutrition_bookmarks_v3",
    "kknutrition_bookmarks_v4",
    "kknutrition_bookmarks_v4_meta",
    "kkulkkoori_service_sheet_link",
    "kkulkkoori_work_notes_v1",
    "kkulkkoori_message_templates_v1",
    "cookingMethodUploadedData_v2",
    "cookingMethodUploadedData_v3",
    "cookingMethodUploadedData_v4",
    "cookingMethodUploadedData_v5",
    "kkulkkoori_cheongsu_recipes_v3",
    "kkulkkoori_annual_sheet_links_v1",
    "kkulkkoori_vendor_network_v1",
    "kkulkkoori_vendor_groups_v1",
    "kkulkkoori_promo_contacts_v1",
    "kkulkkoori_academic_events_v1",
  ]);

  const PROTECTED_PREFIXES = [
    "kknutrition_",
    "kkulkkoori_",
    "cookingMethodUploadedData_",
  ];

  const nativeGetItem = Storage.prototype.getItem;
  const nativeSetItem = Storage.prototype.setItem;
  const nativeRemoveItem = Storage.prototype.removeItem;
  let isWritingBackup = false;

  const nowStamp = () => new Date().toISOString();

  function isLocalStorage(storage) {
    try {
      return storage === window.localStorage;
    } catch (error) {
      return false;
    }
  }

  function isProtectedKey(key) {
    if (!key || EXCLUDED_KEYS.has(key)) return false;
    if (/token|auth|passkey/i.test(key)) return false;
    if (PROTECTED_KEYS.has(key)) return true;
    return PROTECTED_PREFIXES.some((prefix) => key.startsWith(prefix));
  }

  function readRaw(key) {
    return nativeGetItem.call(window.localStorage, key);
  }

  function writeRaw(key, value) {
    nativeSetItem.call(window.localStorage, key, value);
  }

  function readBackupStore() {
    try {
      const raw = readRaw(BACKUP_KEY);
      if (!raw) return { version: 1, createdAt: nowStamp(), keys: {} };
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") throw new Error("Invalid backup store");
      if (!parsed.keys || typeof parsed.keys !== "object") parsed.keys = {};
      parsed.version = parsed.version || 1;
      parsed.createdAt = parsed.createdAt || nowStamp();
      return parsed;
    } catch (error) {
      return { version: 1, createdAt: nowStamp(), keys: {} };
    }
  }

  function trimBackups(store, limit) {
    Object.keys(store.keys).forEach((key) => {
      const entries = Array.isArray(store.keys[key]) ? store.keys[key] : [];
      store.keys[key] = entries.slice(0, limit);
      if (store.keys[key].length === 0) delete store.keys[key];
    });
  }

  function saveBackupStore(store) {
    let limit = MAX_BACKUPS_PER_KEY;
    for (let attempt = 0; attempt < MAX_SAVE_ATTEMPTS; attempt += 1) {
      try {
        trimBackups(store, limit);
        isWritingBackup = true;
        writeRaw(BACKUP_KEY, JSON.stringify(store));
        return true;
      } catch (error) {
        limit = Math.max(1, Math.floor(limit / 2));
      } finally {
        isWritingBackup = false;
      }
    }
    return false;
  }

  function backupValue(key, value, reason) {
    if (!isProtectedKey(key) || value == null || value === "") return false;

    const textValue = String(value);
    const store = readBackupStore();
    const entries = Array.isArray(store.keys[key]) ? store.keys[key] : [];
    if (entries[0] && entries[0].value === textValue) return false;

    store.keys[key] = [
      {
        savedAt: nowStamp(),
        reason,
        value: textValue,
      },
      ...entries,
    ].slice(0, MAX_BACKUPS_PER_KEY);

    return saveBackupStore(store);
  }

  function backupCurrentData(reason = "manual-snapshot") {
    PROTECTED_KEYS.forEach((key) => {
      try {
        backupValue(key, readRaw(key), reason);
      } catch (error) {
        // A single damaged key should not stop the rest of the data from being backed up.
      }
    });

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key || PROTECTED_KEYS.has(key) || !isProtectedKey(key)) continue;
      try {
        backupValue(key, readRaw(key), reason);
      } catch (error) {
        // Continue backing up other keys.
      }
    }
  }

  function listBackups(key) {
    const store = readBackupStore();
    if (key) return Array.isArray(store.keys[key]) ? [...store.keys[key]] : [];
    return Object.fromEntries(
      Object.entries(store.keys).map(([entryKey, entries]) => [
        entryKey,
        Array.isArray(entries) ? entries.map(({ savedAt, reason }) => ({ savedAt, reason })) : [],
      ])
    );
  }

  function restoreLatest(key) {
    if (!isProtectedKey(key)) return false;
    const latest = listBackups(key)[0];
    if (!latest || latest.value == null) return false;
    backupValue(key, readRaw(key), "before-restore");
    writeRaw(key, latest.value);
    return true;
  }

  Storage.prototype.setItem = function guardedSetItem(key, value) {
    const normalizedKey = String(key);
    if (isLocalStorage(this) && !isWritingBackup && isProtectedKey(normalizedKey)) {
      try {
        backupValue(normalizedKey, readRaw(normalizedKey), "before-write");
      } catch (error) {
        // Keep the original write path alive even if backup storage is unavailable.
      }

      const result = nativeSetItem.call(this, key, value);

      try {
        backupValue(normalizedKey, String(value), "after-write");
      } catch (error) {
        // The user data has still been written; backup can be inspected separately.
      }

      try {
        window.dispatchEvent(new CustomEvent("kknutrition:local-data-changed", {
          detail: { key: normalizedKey, value: String(value), deleted: false, updatedAt: Date.now() }
        }));
      } catch (error) {
        // Sync notifications should never block storage writes.
      }

      return result;
    }

    return nativeSetItem.call(this, key, value);
  };

  Storage.prototype.removeItem = function guardedRemoveItem(key) {
    const normalizedKey = String(key);
    if (isLocalStorage(this) && !isWritingBackup && isProtectedKey(normalizedKey)) {
      try {
        backupValue(normalizedKey, readRaw(normalizedKey), "before-remove");
      } catch (error) {
        // Removal should not fail because backup storage is unavailable.
      }
    }

    const result = nativeRemoveItem.call(this, key);

    if (isLocalStorage(this) && !isWritingBackup && isProtectedKey(normalizedKey)) {
      try {
        window.dispatchEvent(new CustomEvent("kknutrition:local-data-changed", {
          detail: { key: normalizedKey, value: "", deleted: true, updatedAt: Date.now() }
        }));
      } catch (error) {
        // Sync notifications should never block storage writes.
      }
    }

    return result;
  };

  window.KKNutritionDataGuard = {
    backupNow: () => backupCurrentData("manual-snapshot"),
    listBackups,
    restoreLatest,
  };

  backupCurrentData("page-load");
  window.addEventListener("beforeunload", () => backupCurrentData("before-unload"));
})();
