import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { gaBootstrapScript, isPrivatePath } from "./analytics";

describe("isPrivatePath", () => {
  it.each(["/apply", "/apply/", "/apply/step", "/portal", "/portal/login", "/portal/documents", "/Apply"])(
    "treats %s as private",
    (path) => expect(isPrivatePath(path)).toBe(true),
  );

  it.each(["/", "/contact", "/rates", "/utah/weber-county", "/applying", "/portals", "/about/apply"])(
    "treats %s as public",
    (path) => expect(isPrivatePath(path)).toBe(false),
  );
});

describe("gaBootstrapScript", () => {
  function run(pathname: string) {
    const window: Record<string, unknown> & { location: { pathname: string } } = { location: { pathname } };
    runInNewContext(gaBootstrapScript("G-TEST"), { window, dataLayer: (window.dataLayer = []), Date });
    return window;
  }

  it("leaves analytics on for a marketing page", () => {
    expect(run("/rates")["ga-disable-G-TEST"]).toBe(false);
  });

  it("turns analytics off as soon as the visitor moves into the application", () => {
    const window = run("/");
    window.location.pathname = "/apply";
    expect(window["ga-disable-G-TEST"]).toBe(true);
  });

  it("turns analytics back on when the visitor returns to a marketing page", () => {
    const window = run("/portal/login");
    window.location.pathname = "/about";
    expect(window["ga-disable-G-TEST"]).toBe(false);
  });

  it("configures the given property", () => {
    const queued = run("/").dataLayer as ArrayLike<unknown>[];
    expect(Array.from(queued[1])).toEqual(["config", "G-TEST"]);
  });
});
