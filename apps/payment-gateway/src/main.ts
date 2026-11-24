import { createGateway } from "./server.ts";

const host = process.env.HOST ?? "127.0.0.1";
const port = Number(process.env.PORT ?? 4200);

const server = createGateway().listen(port, host, () => {
  console.log(`payment gateway listening on ${host}:${port}`);
});

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, () => server.close(() => process.exit(0)));
}
