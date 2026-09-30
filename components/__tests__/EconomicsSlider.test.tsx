import { render, screen, fireEvent } from "@testing-library/react";
import EconomicsSlider from "../../components/EconomicsSlider";

describe("EconomicsSlider interactive calculations", () => {
  test("renders with default empty state", () => {
    render(<EconomicsSlider />);
    expect(screen.getByText(/Economic Scenario Builder/i)).toBeInTheDocument();
    expect(screen.getByText(/Enter all values to see calculations/i)).toBeInTheDocument();
  });

  test("updates results when sliders change", async () => {
    render(<EconomicsSlider />);
    // set price
    const priceSlider = screen.getByLabelText(/Price \(₹\)/i);
    fireEvent.change(priceSlider, { target: { value: "5000" } });
    // set variable cost
    const vcSlider = screen.getByLabelText(/Variable Cost \(₹\)/i);
    fireEvent.change(vcSlider, { target: { value: "2000" } });
    // set monthly units
    const unitsSlider = screen.getByLabelText(/Monthly Units/i);
    fireEvent.change(unitsSlider, { target: { value: "100" } });

    // wait for updated calculations to appear
    const revenue = await screen.findByText(/Revenue/i);
    expect(revenue).toHaveTextContent(/₹/);
    const profit = screen.getByText(/Profit/i);
    expect(profit).toHaveTextContent(/₹/);
  });
});
