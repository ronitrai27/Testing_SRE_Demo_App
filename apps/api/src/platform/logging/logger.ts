import { randomUUID } from "node:crypto";
import { type Logger, pino } from "pino";
import { pinoHttp } from "pino-http";

export type { Logger };

export const createLogger = (level: string): Logger =>
  pino({
    level,
    base: { service: "api" },
    redact: ["req.headers.cookie", "req.headers.authorization", 'res.headers["set-cookie"]'],
  });

export const requestLogger = (logger: Logger) =>
  pinoHttp({
    logger,
    genReqId: (_req, res) => {
      const id = randomUUID();
      res.setHeader("x-request-id", id);
      return id;
    },
    autoLogging: { ignore: (req) => req.url === "/healthz" },
    customLogLevel: (_req, res) => (res.statusCode >= 500 ? "error" : "info"),
  });
