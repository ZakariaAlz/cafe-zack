import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderIntl } from "../../tests/unit/render-intl";
import { BootText } from "./BootText";

describe("BootText", () => {
  it("renders the booting stamp on mount", () => {
    renderIntl(<BootText />);
    expect(screen.getByText("café zack · booting…")).toBeInTheDocument();
  });
});
