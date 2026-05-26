import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderIntl } from "../../../tests/unit/render-intl";
import { ServicesPanel } from "./ServicesPanel";

describe("ServicesPanel", () => {
  it("renders the four service cards when open", () => {
    renderIntl(<ServicesPanel open onOpenChange={() => {}} />);
    expect(screen.getByText("What I build")).toBeInTheDocument();
    expect(screen.getByText("Data pipelines")).toBeInTheDocument();
    expect(screen.getByText("Warehouses & models")).toBeInTheDocument();
    expect(screen.getByText("Dashboards")).toBeInTheDocument();
    expect(screen.getByText("Platform & DevOps")).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    renderIntl(<ServicesPanel open={false} onOpenChange={() => {}} />);
    expect(screen.queryByText("What I build")).not.toBeInTheDocument();
  });
});
