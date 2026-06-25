import { describe, expect, test } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();

function read(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

function extractGradleNumber(source: string, key: string): number {
  const match = source.match(new RegExp(`${key}\\s*=\\s*(\\d+)`));
  if (!match) {
    throw new Error(`Missing Gradle version key: ${key}`);
  }

  return Number(match[1]);
}

describe("Google Play release readiness", () => {
  test("defines Android packaging scripts and Capacitor app identity", () => {
    const packageJson = JSON.parse(read("package.json")) as {
      scripts: Record<string, string>;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    expect(packageJson.scripts["build:google-play:web"]).toBe("VITE_TARGET=google-play npm run build");
    expect(packageJson.scripts["cap:sync:android"]).toBe("npm run build:google-play:web && npx cap sync android");
    expect(packageJson.scripts["android:bundle:release"]).toContain("./gradlew bundleRelease");
    expect(packageJson.dependencies?.["@capacitor/core"]).toBeTruthy();
    expect(packageJson.dependencies?.["@capacitor/android"]).toBeTruthy();
    expect(packageJson.devDependencies?.["@capacitor/cli"]).toBeTruthy();

    const capacitorConfig = read("capacitor.config.ts");
    expect(capacitorConfig).toContain('appId: "com.kangsungbae.hiddenline"');
    expect(capacitorConfig).toContain('appName: "Hidden Line"');
    expect(capacitorConfig).toContain('webDir: "dist"');
    expect(capacitorConfig).toContain('androidScheme: "https"');
  });

  test("keeps Android release config Play-ready without sensitive files", () => {
    expect(existsSync(resolve(root, "android/app/build.gradle"))).toBe(true);
    expect(existsSync(resolve(root, "android/app/src/main/AndroidManifest.xml"))).toBe(true);

    const buildGradle = read("android/app/build.gradle");
    expect(buildGradle).toContain('namespace = "com.kangsungbae.hiddenline"');
    expect(buildGradle).toContain('applicationId "com.kangsungbae.hiddenline"');

    const variables = read("android/variables.gradle");
    expect(extractGradleNumber(variables, "targetSdkVersion")).toBeGreaterThanOrEqual(35);
    expect(extractGradleNumber(variables, "compileSdkVersion")).toBeGreaterThanOrEqual(35);

    const gitignore = read(".gitignore");
    expect(gitignore).toContain("android/app/release/");
    expect(gitignore).toContain("*.jks");
    expect(gitignore).toContain("keystore.properties");
  });

  test("provides store listing and privacy artifacts for Play Console", () => {
    expect(existsSync(resolve(root, "docs/google-play-release.md"))).toBe(true);
    expect(existsSync(resolve(root, "public/privacy.html"))).toBe(true);

    const releaseDoc = read("docs/google-play-release.md");
    expect(releaseDoc).toContain("Package name: `com.kangsungbae.hiddenline`");
    expect(releaseDoc).toContain("Target SDK: 35+");
    expect(releaseDoc).toContain("Android App Bundle");
    expect(releaseDoc).toContain("Data Safety");
    expect(releaseDoc).toContain("Owner-gated");

    const privacyHtml = read("public/privacy.html");
    expect(privacyHtml).toContain("Hidden Line Privacy Policy");
    expect(privacyHtml).toContain("does not currently require account creation");
  });
});
