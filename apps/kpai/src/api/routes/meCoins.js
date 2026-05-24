import { verifyToken } from "../lib/verifyToken.js";
import { success, error } from "../lib/response.js";
import { getCoinBalance } from "../lib/getCoinBalance.js";
import { listCoinLedger } from "../lib/listCoinLedger.js";

export function meCoins(fastify) {
  fastify.get("/api/me/coins", async (request, reply) => {
    const payload = verifyToken(request);
    if (!payload) {
      return error(reply, 401, "UNAUTHORIZED", "Authentication required");
    }

    const limit = Math.max(1, Math.min(100, Number(request.query.limit) || 20));
    const [balance, recent] = await Promise.all([
      getCoinBalance(payload.userId),
      listCoinLedger(payload.userId, limit),
    ]);

    return success({ balance, recent });
  });
}
