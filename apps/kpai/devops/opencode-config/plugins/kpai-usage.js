import fs from "fs";
import path from "path";

export const KpaiUsagePlugin = async ({ directory, client }) => {
  const usageEnv = process.env.KPAI_OPENCODE_TOKEN_USAGE_FILENAME;
  if (!usageEnv) return {};

  const baseDir = directory ?? process.cwd();
  const usagePath = path.isAbsolute(usageEnv) ? usageEnv : path.join(baseDir, usageEnv);
  const reported = new Set();

  async function fetchText(sessionID, messageID) {
    try {
      const res = await client.session.messages({ path: { id: sessionID } });
      const msg = res.data?.find((m) => m.info.id === messageID);
      if (!msg?.parts) return "";
      return msg.parts
        .filter((p) => p.type === "text")
        .map((p) => p.text)
        .join("");
    } catch (err) {
      console.error("[kpai-usage] failed to fetch parts:", err.message);
      return "";
    }
  }

  return {
    event: async ({ event }) => {
      if (event.type !== "message.updated") return;
      const info = event?.properties?.info;
      if (!info || (info.role !== "user" && info.role !== "assistant")) return;
      // User messages are immediately complete; assistant messages must be finished.
      if (info.role === "assistant" && !info.time?.completed) return;
      if (reported.has(info.id)) return;
      reported.add(info.id);

      const text = await fetchText(info.sessionID, info.id);
      const record = {
        ts: Date.now(),
        messageID: info.id,
        sessionID: info.sessionID,
        role: info.role,
        text,
      };
      if (info.role === "assistant") {
        record.providerID = info.providerID;
        record.modelID = info.modelID;
        record.tokens = info.tokens;
        record.cost = info.cost;
      }

      try {
        fs.appendFileSync(usagePath, JSON.stringify(record) + "\n");
      } catch (err) {
        console.error("[kpai-usage] failed to write usage file:", err.message);
      }
    },
  };
};
