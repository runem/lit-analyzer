import { getDiagnostics } from "../helpers/analyze.js";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert.js";
import { tsTest } from "../helpers/ts-test.js";

tsTest("Don't report legacy attributes when 'no-legacy-attribute' is turned off", t => {
	const { diagnostics } = getDiagnostics("html`<input required?=${true} />`", { rules: { "no-legacy-attribute": false } });
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Report legacy attributes on known element", t => {
	const { diagnostics } = getDiagnostics("html`<input required?=${true} />`", { rules: { "no-legacy-attribute": true } });
	hasDiagnostic(t, diagnostics, "no-legacy-attribute");
});

tsTest("Report legacy attribute values on known element", t => {
	const { diagnostics } = getDiagnostics('html`<input value="{{foo}}" />`', { rules: { "no-legacy-attribute": true } });
	hasDiagnostic(t, diagnostics, "no-legacy-attribute");
});

tsTest("Don't report non-legacy boolean attributes", t => {
	const { diagnostics } = getDiagnostics("html`<input ?required=${true} />`", { rules: { "no-legacy-attribute": true } });
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Don't report non-legacy attributes", t => {
	const { diagnostics } = getDiagnostics("html`<input required />`", { rules: { "no-legacy-attribute": true } });
	hasNoDiagnostics(t, diagnostics);
});
