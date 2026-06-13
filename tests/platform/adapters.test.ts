import { describe, expect, test } from "vitest";
import { createBrowserPlatform } from "../../src/platform/browserPlatform";

describe("platform readiness adapters", () => {
  test("keeps auth, payment, and ads behind MVP stubs", async () => {
    const platform = createBrowserPlatform();

    expect(platform.auth.status).toBe("stub");
    expect(platform.auth.plannedProviders).toEqual(["apps_in_toss", "google_play"]);
    await expect(platform.auth.getCurrentUser()).resolves.toEqual({ status: "anonymous" });

    expect(platform.payment.status).toBe("stub");
    expect(platform.payment.plannedStores).toEqual(["apps_in_toss_iap", "google_play_billing"]);
    await expect(platform.payment.hasEntitlement("premium_monthly")).resolves.toBe(false);

    expect(platform.ads.status).toBe("stub");
    expect(platform.ads.plannedNetworks).toEqual(["apps_in_toss_ads", "admob"]);
    await expect(platform.ads.showPlacement("home_footer")).resolves.toEqual({
      shown: false,
      reason: "ads_disabled_in_mvp",
    });
  });
});
