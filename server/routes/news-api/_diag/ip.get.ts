export default defineEventHandler(async () => {
    try {
      const res = await $fetch<{ ip: string }>("https://api64.ipify.org?format=json", { timeout: 1500 });
      return { ip: res.ip, source: "ipify", ts: new Date().toISOString() };
    } catch {
      try {
        const txt = await $fetch<string>("https://checkip.amazonaws.com/", { responseType: "text", timeout: 1500 });
        return { ip: txt.trim(), source: "checkip", ts: new Date().toISOString() };
      } catch {
        return { ip: null, error: "unreachable", ts: new Date().toISOString() };
      }
    }
  });