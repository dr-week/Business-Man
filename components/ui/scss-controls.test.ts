import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

describe("SCSS-backed form controls", () => {
  it("renders button variants, sizes, and caller classes", () => {
    const markup = renderToStaticMarkup(createElement(Button, {
      variant: "outline",
      size: "sm",
      className: "custom-action",
      children: "Continue",
    }));

    expect(markup).toContain('data-variant="outline"');
    expect(markup).toContain('data-size="sm"');
    expect(markup).toMatch(/class="[^"]+"/);
    expect(markup).toContain("custom-action");
    expect(markup).not.toContain("undefined");
  });

  it("keeps input state and accessibility attributes on the rendered control", () => {
    const markup = renderToStaticMarkup(createElement(Input, {
      type: "email",
      placeholder: "name@example.com",
      "aria-invalid": true,
      disabled: true,
    }));

    expect(markup).toContain('type="email"');
    expect(markup).toContain('placeholder="name@example.com"');
    expect(markup).toContain('aria-invalid="true"');
    expect(markup).toContain("disabled");
    expect(markup).toMatch(/class="[^"]+"/);
    expect(markup).not.toContain("undefined");
  });
});
