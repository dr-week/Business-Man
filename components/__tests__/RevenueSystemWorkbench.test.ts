import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RevenueSystemWorkbench } from "../research/revenue-system-workbench";

describe("revenue system workflow", () => {
  it("renders no assumed sales until the user enters a scenario", () => {
    const markup = renderToStaticMarkup(createElement(RevenueSystemWorkbench, { currency: "INR" }));

    expect(markup).toContain("No payment data is connected");
    expect(markup).toContain("do not describe this checkout as open source yet");
    expect(markup).toContain("Scenario units / month");
    expect(markup).toContain("₹0");
    expect(markup).toContain("₹18,000");
    expect(markup).toContain("Competitor offers and our testable difference");
    expect(markup).toContain("DimeADozen");
    expect(markup).toContain("Moshpit");
    expect(markup).toContain("$99/month");
    expect(markup).toContain("not a proven advantage");
    expect(markup).not.toContain("1 units / month");
  });
});
