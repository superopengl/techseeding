export function healthcheck(fastify) {
  fastify.get("/healthcheck", async () => "OK");
}
