import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders its label", () => {
    render(<Button>Book a call</Button>);
    expect(screen.getByRole("button", { name: "Book a call" })).toBeInTheDocument();
  });

  it("renders as the child element when asChild is set", () => {
    render(
      <Button asChild>
        <a href="/contact">Send a brief</a>
      </Button>,
    );
    // Slot merges props onto the <a>, so it's a link, not a button.
    expect(screen.getByRole("link", { name: "Send a brief" })).toBeInTheDocument();
  });
});
