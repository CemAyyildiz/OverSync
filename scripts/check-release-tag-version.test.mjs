import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseTagVersion,
  readPackageVersion,
  assertTagMatchesVersion,
} from "./check-release-tag-version.mjs";

describe("parseTagVersion", () => {
  it("extracts the version from a bare v-prefixed tag", () => {
    assert.equal(parseTagVersion("v1.2.3"), "1.2.3");
  });

  it("extracts the version from a full refs/tags/ ref", () => {
    assert.equal(parseTagVersion("refs/tags/v1.2.3"), "1.2.3");
  });

  it("accepts a pre-release suffix", () => {
    assert.equal(parseTagVersion("v2.0.0-rc.1"), "2.0.0-rc.1");
  });

  it("throws for a tag missing the v prefix", () => {
    assert.throws(() => parseTagVersion("1.2.3"), /does not match/);
  });

  it("throws for a non-semver tag", () => {
    assert.throws(() => parseTagVersion("v1.2"), /does not match/);
  });
});

describe("readPackageVersion", () => {
  it("reads the version field", () => {
    assert.equal(readPackageVersion(JSON.stringify({ version: "1.0.0" })), "1.0.0");
  });

  it("throws when version is missing", () => {
    assert.throws(() => readPackageVersion(JSON.stringify({})), /missing a "version" field/);
  });

  it("throws when version is empty", () => {
    assert.throws(() => readPackageVersion(JSON.stringify({ version: "" })), /missing a "version" field/);
  });
});

describe("assertTagMatchesVersion", () => {
  it("does not throw when the versions match", () => {
    assert.doesNotThrow(() => assertTagMatchesVersion("1.0.0", "1.0.0"));
  });

  it("throws a clear message when the versions differ", () => {
    assert.throws(
      () => assertTagMatchesVersion("1.0.1", "1.0.0"),
      /Release tag version "1\.0\.1" does not match root package\.json version "1\.0\.0"/,
    );
  });
});
