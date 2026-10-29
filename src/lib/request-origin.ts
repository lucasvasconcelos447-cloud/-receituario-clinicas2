/** Match the browser origin to the actual request host, including the port. */
export function sameOrigin(request: Pick<Request, "headers">) {
  const value = request.headers.get("origin");
  if (!value) return false;
  try {
    const origin = new URL(value);
    return (
      ["https:", "http:"].includes(origin.protocol) &&
      origin.host === request.headers.get("host")
    );
  } catch {
    return false;
  }
}
