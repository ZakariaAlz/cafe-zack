import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderIntl } from "../../../tests/unit/render-intl";
import { LandmarkPrompt } from "./LandmarkPrompt";

describe("LandmarkPrompt", () => {
  it("renders nothing when hidden", () => {
    const { container } = renderIntl(<LandmarkPrompt show={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the E key cap and the landmark label when near", () => {
    renderIntl(<LandmarkPrompt show />);
    expect(screen.getByText("E")).toBeInTheDocument();
    expect(screen.getByText("Enter La Grande Poste")).toBeInTheDocument();
  });
});
