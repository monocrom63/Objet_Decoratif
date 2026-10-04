import assert from "node:assert/strict";
import test from "node:test";
import {
  configuredAdminEmails,
  initialStoreRole,
  isVerifiedConfiguredAdmin,
} from "./storeAdminAccess.ts";

const allowed = configuredAdminEmails(
  " Editor@example.test, second@example.test ",
);

test("administrator configuration uses exact, normalized email addresses", () => {
  assert.deepEqual(
    [...allowed],
    ["editor@example.test", "second@example.test"],
  );
  assert.equal(configuredAdminEmails(undefined).size, 0);
  assert.equal(configuredAdminEmails(" , \n ").size, 0);
  assert.equal(
    isVerifiedConfiguredAdmin(
      {
        emailAddress: "EDITOR@example.test",
        verification: { status: "verified" },
      },
      allowed,
    ),
    true,
  );
});

test("unverified, missing, and unrelated primary emails do not grant administrator access", () => {
  for (const status of ["unverified", "expired", "failed"]) {
    assert.equal(
      isVerifiedConfiguredAdmin(
        {
          emailAddress: "editor@example.test",
          verification: { status },
        },
        allowed,
      ),
      false,
    );
  }
  assert.equal(isVerifiedConfiguredAdmin(null, allowed), false);
  assert.equal(
    isVerifiedConfiguredAdmin({ emailAddress: "editor@example.test" }, allowed),
    false,
  );
  for (const emailAddress of [
    "customer@example.test",
    "editor@example.test.attacker.test",
    "prefixeditor@example.test",
  ]) {
    assert.equal(
      isVerifiedConfiguredAdmin(
        { emailAddress, verification: { status: "verified" } },
        allowed,
      ),
      false,
    );
  }
});

test("additional approved users receive the same full admin role; other users remain customers", () => {
  assert.equal(initialStoreRole(true, true), "admin");
  assert.equal(initialStoreRole(true, false), "customer");
});

test("first-account admin bootstrapping is preserved", () => {
  assert.equal(initialStoreRole(false, false), "admin");
  assert.equal(initialStoreRole(false, true), "admin");
});
