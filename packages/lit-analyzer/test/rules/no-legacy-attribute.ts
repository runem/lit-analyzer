import test from "ava";
import { getDiagnostics } from "../helpers/analyze";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert";

test("Don't report legacy attributes when 'no-legacy-attribute' is turned off", t => {
	const { diagnostics } = getDiagnostics("html`<input required?=${true} />`", { rules: { "no-legacy-attribute": false } });
	hasNoDiagnostics(t, diagnostics);
});

test("Report legacy attributes on known element", t => {
	const { diagnostics } = getDiagnostics("html`<input required?=${true} />`", { rules: { "no-legacy-attribute": true } });
	hasDiagnostic(t, diagnostics, "no-legacy-attribute");
});

test("Report legacy attribute values on known element", t => {
	const { diagnostics } = getDiagnostics('html`<input value="{{foo}}" />`', { rules: { "no-legacy-attribute": true } });
	hasDiagnostic(t, diagnostics, "no-legacy-attribute");
});

test("Don't report non-legacy boolean attributes", t => {
	const { diagnostics } = getDiagnostics("html`<input ?required=${true} />`", { rules: { "no-legacy-attribute": true } });
	hasNoDiagnostics(t, diagnostics);
});

test("Don't report non-legacy attributes", t => {
	const { diagnostics } = getDiagnostics("html`<input required />`", { rules: { "no-legacy-attribute": true } });
	hasNoDiagnostics(t, diagnostics);
});
