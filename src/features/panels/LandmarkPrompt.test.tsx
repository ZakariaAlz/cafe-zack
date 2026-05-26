import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderIntl } from "../../../tests/unit/render-intl";
import { LandmarkPrompt } from "./LandmarkPrompt";

describe("LandmarkPrompt", () => {
  it("renders nothing when no landmark is in range", () => {
    const { container } = renderIntl(<LandmarkPrompt landmark={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the E key cap and the Grande Poste label", () => {
    renderIntl(<LandmarkPrompt landmark="grande-poste" />);
    expect(screen.getByText("E")).toBeInTheDocument();
    expect(screen.getByText("Enter La Grande Poste")).toBeInTheDocument();
  });

  it("follows the nearby landmark to the Casbah label", () => {
    renderIntl(<LandmarkPrompt landmark="casbah" />);
    expect(screen.getByText("Enter the Casbah")).toBeInTheDocument();
  });

  it("follows the nearby landmark to the Notre-Dame label", () => {
    renderIntl(<LandmarkPrompt landmark="notre-dame" />);
    expect(screen.getByText("Enter Notre-Dame d'Afrique")).toBeInTheDocument();
  });

  it("follows the nearby landmark to the Maqam label", () => {
    renderIntl(<LandmarkPrompt landmark="maqam" />);
    expect(screen.getByText("Enter Maqam Echahid")).toBeInTheDocument();
  });
});
