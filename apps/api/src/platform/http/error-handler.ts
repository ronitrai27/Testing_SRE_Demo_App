import type { Problem } from "@saltmarket/contracts";
import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { AppError, notFound } from "./errors.ts";

const problem = (status: number, code: string, title: string): Problem => ({
  type: `urn:saltmarket:problem:${code}`,
  title,
  status,
});

/** body-parser errors carry a 4xx status and say whether their message is safe to show. */
const isClientError = (error: unknown): error is Error & { status: number } =>
  error instanceof Error && "status" in error && "expose" in error && error.expose === true;

function toProblem(error: unknown): Problem {
  if (error instanceof ZodError) {
    return {
      ...problem(400, "invalid_request", "The request is not valid"),
      issues: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    };
  }
  if (error instanceof AppError) return problem(error.status, error.code, error.message);
  if (isClientError(error)) return problem(error.status, "bad_request", error.message);
  return problem(500, "internal", "Something went wrong on our side");
}

export const routeNotFound: RequestHandler = () => {
  throw notFound("Route");
};

/** Only unexpected failures are reported; a rejected request is not an incident. */
export const isReportable = (error: unknown): boolean => toProblem(error).status >= 500;

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  const body = toProblem(error);
  if (body.status >= 500) req.log.error({ err: error }, "request failed");

  res
    .status(body.status)
    .type("application/problem+json")
    .send(JSON.stringify({ ...body, requestId: String(req.id) }));
};
