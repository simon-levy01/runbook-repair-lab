import { get } from "node:https";
// Fresh public read at build time. Native HTTPS avoids Next's persistent fetch cache.
export function readPublicJson(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const request = get(url, (response) => {
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error("Content service unavailable"));
        return;
      }
      const chunks: Buffer[] = [];
      let bytes = 0;
      response.on("data", (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > 1_048_576)
          request.destroy(new Error("Content response too large"));
        else chunks.push(chunk);
      });
      response.on("error", reject);
      response.on("end", () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
        } catch {
          reject(new Error("Invalid public content JSON"));
        }
      });
    });
    const timer = setTimeout(
      () => request.destroy(new Error("Content request timed out")),
      8000,
    );
    request.on("close", () => clearTimeout(timer));
    request.on("error", reject);
  });
}
