#!/usr/bin/env node
// Verifies a `v*` release git tag matches the root package.json version,
// so a Docker image is never published under a tag that doesn't match
// what the repository itself claims to ship.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

/**
 * @param {string} ref a tag like "v1.2.3" or a full ref "refs/tags/v1.2.3"
 * @returns {string} the version portion, e.g. "1.2.3"
 */
export function parseTagVersion(ref) {
  const tag = ref.replace(/^refs\/tags\//, "");
  const match = tag.match(/^v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/);
  if (!match) {
    throw new Error(`Tag "${tag}" does not match the expected v<semver> format`);
  }
  return match[1];
}

/**
 * @param {string} packageJsonText
 * @returns {string}
 */
export function readPackageVersion(packageJsonText) {
  const pkg = JSON.parse(packageJsonText);
  if (typeof pkg.version !== "string" || pkg.version.length === 0) {
    throw new Error('Root package.json is missing a "version" field');
  }
  return pkg.version;
}

/**
 * @param {string} tagVersion
 * @param {string} packageVersion
 */
export function assertTagMatchesVersion(tagVersion, packageVersion) {
  if (tagVersion !== packageVersion) {
    throw new Error(
      `Release tag version "${tagVersion}" does not match root package.json version "${packageVersion}". ` +
        `Update package.json to ${tagVersion}, or push tag v${packageVersion} instead.`,
    );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ref = process.argv[2] ?? process.env.GITHUB_REF ?? "";
  if (!ref) {
    console.error("Usage: check-release-tag-version.mjs <tag-or-ref>  (or set GITHUB_REF)");
    process.exit(1);
  }
  try {
    const tagVersion = parseTagVersion(ref);
    const packageVersion = readPackageVersion(readFileSync(join(root, "package.json"), "utf8"));
    assertTagMatchesVersion(tagVersion, packageVersion);
    console.log(`✓ Release tag v${tagVersion} matches root package.json version ${packageVersion}`);
  } catch (error) {
    console.error(`✗ ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
