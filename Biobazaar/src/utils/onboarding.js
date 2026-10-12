const VALID_ONBOARDING_STATES = new Set(["completed", "dismissed"]);

export function onboardingStorageKey(userId) {
  return userId ? `biobazaar:onboarding:${encodeURIComponent(String(userId))}` : "";
}

function browserStorage() {
  try { return globalThis.localStorage; } catch { return null; }
}

export function getOnboardingState(userId, storage = browserStorage()) {
  const key = onboardingStorageKey(userId);
  if (!key || !storage) return null;
  try {
    const state = storage.getItem(key);
    return VALID_ONBOARDING_STATES.has(state) ? state : null;
  } catch {
    return null;
  }
}

export function saveOnboardingState(userId, state, storage = browserStorage()) {
  const key = onboardingStorageKey(userId);
  if (!key || !storage || !VALID_ONBOARDING_STATES.has(state)) return false;
  try {
    storage.setItem(key, state);
    return true;
  } catch {
    return false;
  }
}

export function shouldStartOnboarding({ authStatus, userId, registrationUserId, storedState }) {
  return authStatus === "authenticated"
    && Boolean(userId)
    && String(registrationUserId || "") === String(userId)
    && !VALID_ONBOARDING_STATES.has(storedState);
}