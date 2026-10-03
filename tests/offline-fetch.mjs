// Test-only preload for fully offline UI checks. It is never imported by application code.
import { guides } from "./fixtures.mjs";
const original = globalThis.fetch;
globalThis.fetch = async (input, options) => {
  const url = String(input?.url ?? input);
  if (new URL(url).hostname === "ipp6nys2.api.sanity.io") {
    if (process.env.OFFLINE_TEST_FAILURE === "1")
      return new Response("{}", { status: 503 });
    return new Response(JSON.stringify({ result: guides }), {
      headers: { "content-type": "application/json" },
    });
  }
  return original(input, options);
};
