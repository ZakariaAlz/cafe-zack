// @vitest-environment node
import { describe, expect, it } from "vitest";
import { POST } from "./route";

const post = (body: unknown) =>
  new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

describe("POST /api/contact", () => {
  it("400s on non-JSON", async () => {
    const res = await POST(post("not json"));
    expect(res.status).toBe(400);
  });

  it("400s on invalid input", async () => {
    const res = await POST(post({ name: "x", email: "nope", message: "short" }));
    expect(res.status).toBe(400);
  });

  it("accepts a valid message (no mail env → ok without sending)", async () => {
    const res = await POST(
      post({ name: "Sam", email: "sam@example.com", message: "I need a data pipeline built." }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
