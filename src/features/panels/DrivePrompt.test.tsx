import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderIntl } from "../../../tests/unit/render-intl";
import { DrivePrompt } from "./DrivePrompt";

describe("DrivePrompt", () => {
  it("renders nothing when hidden", () => {
    const { container } = renderIntl(<DrivePrompt show={false} keyHint="F" labelKey="stepOut" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the F key cap and the localized label", () => {
    renderIntl(<DrivePrompt show keyHint="F" labelKey="driveTaxi" />);
    expect(screen.getByText("F")).toBeInTheDocument();
    expect(screen.getByText("Drive the taxi")).toBeInTheDocument();
  });

  it("shows the C cap for calling", () => {
    renderIntl(<DrivePrompt show keyHint="C" labelKey="callTaxi" />);
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.getByText("Call the taxi")).toBeInTheDocument();
  });

  it("omits the key cap while arriving", () => {
    renderIntl(<DrivePrompt show keyHint={null} labelKey="arriving" />);
    expect(screen.queryByText("F")).not.toBeInTheDocument();
    expect(screen.queryByText("C")).not.toBeInTheDocument();
    expect(screen.getByText("Taxi arriving…")).toBeInTheDocument();
  });
});
