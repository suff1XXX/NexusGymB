const DEVICE_KEY = "nexus-gymb.deviceId";
let temporaryDeviceId;

export function deviceId() {
  try {
    const stored = localStorage.getItem(DEVICE_KEY);
    if (/^dev_[a-zA-Z0-9_-]{8,80}$/.test(stored || "")) return stored;
    const id = `dev_${crypto.randomUUID()}`;
    localStorage.setItem(DEVICE_KEY, id);
    return id;
  } catch {
    // Private mode or blocked storage must not prevent signing in.
    return (temporaryDeviceId ||= `dev_${crypto.randomUUID()}`);
  }
}

export function loginTime(user) {
  const time = Date.parse(user.metadata?.lastSignInTime || "");
  return Number.isFinite(time) ? new Date(time).toISOString() : "";
}

export function newerLogin(profile, time) {
  const previous = Date.parse(profile.lastLoginTime || "");
  return !!time && (!Number.isFinite(previous) || Date.parse(time) > previous);
}
export function loginIpHistory(profile, metadata = null) {
  const valid = (entry) => entry && typeof entry.ip === 'string' && entry.ip.length <= 45 &&
    /^[0-9a-fA-F:.]+$/.test(entry.ip) && typeof entry.time === 'string' && Number.isFinite(Date.parse(entry.time));
  const entries = Array.isArray(profile.loginIpHistory) ? profile.loginIpHistory.filter(valid) : [];
  const legacy = { ip: profile.lastLoginIp, time: profile.lastLoginTime };
  if (valid(legacy)) entries.push(legacy);
  const next = metadata && { ip: metadata.lastLoginIp, time: metadata.lastLoginTime };
  if (valid(next)) entries.push(next);
  // One record per sign-in, even if several tabs observe the same authentication event.
  return [...new Map(entries.map((entry) => [entry.time, { ip: entry.ip, time: entry.time }])).values()]
    .sort((a, b) => Date.parse(b.time) - Date.parse(a.time)).slice(0, 5);
}

export async function loginMetadata(time) {
  const lastDeviceId = deviceId();
  let lastLoginIp = "";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch("https://api64.ipify.org?format=json", {
      signal: controller.signal,
      cache: "no-store",
      credentials: "omit",
      referrerPolicy: "no-referrer",
    });
    if (response.ok) {
      const { ip } = await response.json();
      if (typeof ip === "string" && ip.length <= 45 && /^[0-9a-fA-F:.]+$/.test(ip))
        lastLoginIp = ip;
    }
  } catch {
    // An unavailable IP service must not block access or reuse an older IP.
  } finally {
    clearTimeout(timeout);
  }
  return { lastDeviceId, lastLogin: time, lastLoginIp, lastLoginTime: time };
}
