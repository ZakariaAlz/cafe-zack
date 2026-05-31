import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderIntl } from "../../../tests/unit/render-intl";
import { ContactForm } from "./ContactForm";

describe("ContactForm", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the validated fields and submit", () => {
    renderIntl(<ContactForm />);
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("What do you need?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send it over" })).toBeInTheDocument();
  });

  it("shows validation errors and does not POST on an empty submit", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderIntl(<ContactForm />);

    fireEvent.submit(screen.getByRole("button", { name: "Send it over" }));

    // Zod field errors surface; the network is never hit.
    expect(await screen.findByText("Your name, please.")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("POSTs to the edge route and shows the thank-you on success", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const onSent = vi.fn();
    renderIntl(<ContactForm onSent={onSent} />);

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Sam Tester" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "sam@example.com" } });
    fireEvent.change(screen.getByLabelText("What do you need?"), {
      target: { value: "A data pipeline, please." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send it over" }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith("/api/contact", expect.anything()));
    expect(await screen.findByTestId("contact-sent")).toBeInTheDocument();
    expect(onSent).toHaveBeenCalledOnce();
  });
});
