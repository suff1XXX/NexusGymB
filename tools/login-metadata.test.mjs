import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { deviceId, loginTime, newerLogin, loginMetadata } from "../public/js/login-metadata.js";

test("login metadata", async (t) => {
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const values = new Map();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) },
  });
  t.after(() => {
    mock.restoreAll();
    if (originalStorage) Object.defineProperty(globalThis, "localStorage", originalStorage);
    else delete globalThis.localStorage;
  });
  await t.test("browser ID persists and blocked storage has a stable fallback", () => {
    const id = deviceId();
    assert.match(id, /^dev_[\w-]+$/);
    assert.equal(deviceId(), id);
    const blocked = mock.method(globalThis.localStorage, "getItem", () => { throw Error("blocked"); });
    assert.equal(deviceId(), deviceId());
    blocked.mock.restore();
    assert.equal(deviceId(), id);
  });
  const time = "2026-10-02T15:28:21.000Z";
  await t.test("auth time is ISO UTC; reloads and older sessions do not replace it", () => {
    assert.equal(loginTime({ metadata: { lastSignInTime: "Fri, 02 Oct 2026 15:28:21 GMT" } }), time);
    assert.equal(loginTime({}), "");
    assert.equal(newerLogin({}, ""), false);
    assert.equal(newerLogin({}, time), true);
    assert.equal(newerLogin({ lastLoginTime: time }, time), false);
    assert.equal(newerLogin({ lastLoginTime: "2026-10-03T00:00:00.000Z" }, time), false);
    assert.equal(newerLogin({ lastLoginTime: "2026-10-01T00:00:00.000Z" }, time), true);
  });
  await t.test("IPv4 and IPv6 stored without sending account data", async () => {
    for (const ip of ["192.0.2.1", "2001:db8::1"]) {
      const request = mock.method(globalThis, "fetch", async (url, options) => {
        assert.equal(url, "https://api64.ipify.org?format=json");
        assert.equal(options.credentials, "omit");
        assert.equal(options.referrerPolicy, "no-referrer");
        assert.equal(options.body, undefined);
        return { ok: true, json: async () => ({ ip }) };
      });
      assert.deepEqual(await loginMetadata(time), {
        lastDeviceId: deviceId(), lastLogin: time, lastLoginIp: ip, lastLoginTime: time,
      });
      request.mock.restore();
    }
  });
  await t.test("network errors, HTTP failures and malformed responses keep login usable", async () => {
    for (const response of [null, { ok: false }, { ok: true, json: async () => ({ ip: "<script>" }) }, { ok: true, json: async () => { throw Error("not JSON"); } }]) {
      const request = mock.method(globalThis, "fetch", async () => {
        if (!response) throw Error("offline");
        return response;
      });
      const data = await loginMetadata(time);
      assert.equal(data.lastLoginIp, "");
      assert.equal(data.lastLoginTime, time);
      request.mock.restore();
    }
  });
  await t.test("IP lookup is aborted after three seconds", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });
    const request = mock.method(globalThis, "fetch", (_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(Error("timeout")), { once: true });
    }));
    const result = loginMetadata(time);
    t.mock.timers.tick(3000);
    assert.equal((await result).lastLoginIp, "");
    request.mock.restore();
  });
});
