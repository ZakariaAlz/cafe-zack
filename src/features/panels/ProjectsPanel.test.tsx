import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderIntl } from "../../../tests/unit/render-intl";
import { ProjectsPanel } from "./ProjectsPanel";

describe("ProjectsPanel", () => {
  it("renders the heading and case studies when open", () => {
    renderIntl(<ProjectsPanel open onOpenChange={() => {}} />);
    expect(screen.getByText("Selected work")).toBeInTheDocument();
    expect(screen.getByText("Healthcare data platform")).toBeInTheDocument();
    expect(screen.getByText("Telecom usage analytics")).toBeInTheDocument();
    expect(screen.getByText("Reporting automation")).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    renderIntl(<ProjectsPanel open={false} onOpenChange={() => {}} />);
    expect(screen.queryByText("Selected work")).not.toBeInTheDocument();
  });
});
