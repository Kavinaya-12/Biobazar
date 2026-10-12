import test from "node:test";
import assert from "node:assert/strict";
import { getOnboardingState, onboardingStorageKey, saveOnboardingState, shouldStartOnboarding } from "./onboarding.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  };
}

test("tour eligibility requires successful authenticated signup for the same user", () => {
  const base = { authStatus: "authenticated", userId: "user-a", registrationUserId: "user-a", storedState: null };
  assert.equal(shouldStartOnboarding(base), true);
  assert.equal(shouldStartOnboarding({ ...base, authStatus: "anonymous" }), false);
  assert.equal(shouldStartOnboarding({ ...base, registrationUserId: null }), false);
  assert.equal(shouldStartOnboarding({ ...base, registrationUserId: "user-b" }), false);
  assert.equal(shouldStartOnboarding({ ...base, storedState: "completed" }), false);
});

test("skip and finish persist separately for each user's stable identity", () => {
  const storage = memoryStorage();
  assert.equal(saveOnboardingState("user-a", "dismissed", storage), true);
  assert.equal(getOnboardingState("user-a", storage), "dismissed");
  assert.equal(getOnboardingState("user-b", storage), null);
  assert.equal(shouldStartOnboarding({ authStatus: "authenticated", userId: "user-a", registrationUserId: "user-a", storedState: getOnboardingState("user-a", storage) }), false);
  assert.equal(saveOnboardingState("user-b", "completed", storage), true);
  assert.equal(getOnboardingState("user-b", storage), "completed");
  assert.equal(shouldStartOnboarding({ authStatus: "authenticated", userId: "user-b", registrationUserId: "user-b", storedState: getOnboardingState("user-b", storage) }), false);
  assert.equal(onboardingStorageKey("user-a"), "biobazaar:onboarding:user-a");
});

test("unsupported completion values are not persisted", () => {
  assert.equal(saveOnboardingState("user-a", "started", memoryStorage()), false);
});