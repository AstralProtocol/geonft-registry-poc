import { jsx as _jsx } from "react/jsx-runtime";
import { render } from "@testing-library/react";
import App from "./App";
test("renders learn react link", function () {
    var getByText = render(_jsx(App, {})).getByText;
    expect(getByText(/DISCONNECTED/i)).toBeInTheDocument();
});
