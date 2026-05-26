import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderIntl } from "../../../tests/unit/render-intl";
import { SkillsPanel } from "./SkillsPanel";

describe("SkillsPanel", () => {
  it("renders the toolkit groups and tech chips when open", () => {
    renderIntl(<SkillsPanel open onOpenChange={() => {}} />);
    expect(screen.getByText("The toolkit")).toBeInTheDocument();
    expect(screen.getByText("Data Engineering")).toBeInTheDocument();
    expect(screen.getByText("Python")).toBeInTheDocument();
    expect(screen.getByText("Kubernetes")).toBeInTheDocument();
    expect(screen.getByText("Next.js")).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    renderIntl(<SkillsPanel open={false} onOpenChange={() => {}} />);
    expect(screen.queryByText("The toolkit")).not.toBeInTheDocument();
  });
});
