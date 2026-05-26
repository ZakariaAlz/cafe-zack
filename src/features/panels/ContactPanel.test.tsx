import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderIntl } from "../../../tests/unit/render-intl";
import { ContactPanel } from "./ContactPanel";

describe("ContactPanel", () => {
  it("renders the contact form when open", () => {
    renderIntl(<ContactPanel open onOpenChange={() => {}} />);
    expect(screen.getByText("Pull up a chair")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("What do you need?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send it over" })).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    renderIntl(<ContactPanel open={false} onOpenChange={() => {}} />);
    expect(screen.queryByText("Pull up a chair")).not.toBeInTheDocument();
  });
});
