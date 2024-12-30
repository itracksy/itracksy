import { render } from "@testing-library/react";
import ToggleTheme from "@/components/ToggleTheme";
import React from "react";

test("renders ToggleTheme", () => {
  const { getByRole } = render(<ToggleTheme />);
  const isButton = getByRole("button");

  expect(isButton).toBeInTheDocument();
});

test("has icon", () => {
  const { getByRole } = render(<ToggleTheme />);
  const button = getByRole("button");
  const icon = button.querySelector("svg");

  expect(icon).toBeInTheDocument();
});
