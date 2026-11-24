"use client";

import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // A digest means the error happened on the server, which already reported it.
    if (!error.digest) Sentry.captureException(error);
  }, [error]);

  const handleRetry = () => {
    posthog.capture("shop_error_retry_clicked");
    reset();
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold">The shop is not available</h1>
      <p className="mt-2 text-slate-600">Check that the API is running, then try again.</p>
      <button
        type="button"
        onClick={handleRetry}
        className="mt-4 rounded bg-slate-900 px-4 py-2 text-white"
      >
        Try again
      </button>
    </main>
  );
}
