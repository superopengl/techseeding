export function success(data, meta) {
  const res = { success: true, data };
  if (meta) res.meta = meta;
  return res;
}

export function error(reply, statusCode, code, message) {
  return reply.status(statusCode).send({
    success: false,
    error: { code, message },
  });
}
