/** An expected failure the caller can act on. Anything else becomes a 500 and goes to Sentry. */
export class AppError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AppError";
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (message: string) => new AppError(400, "bad_request", message);
export const unauthenticated = (message = "Sign in to continue") =>
  new AppError(401, "unauthenticated", message);
export const forbidden = (message = "You cannot do that") =>
  new AppError(403, "forbidden", message);
export const notFound = (what: string) => new AppError(404, "not_found", `${what} not found`);
export const conflict = (message: string) => new AppError(409, "conflict", message);
