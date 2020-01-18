import { getDiagnostics } from "../helpers/analyze";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert";
import { tsTest } from "../helpers/ts-test";

tsTest('Report mixed binding with expression and "', t => {
	const { diagnostics } = getDiagnostics('html`<input value=${"foo"}" />`');
	hasDiagnostic(t, diagnostics, "no-unintended-mixed-binding");
});

tsTest("Report mixed binding with expression and '", t => {
	const { diagnostics } = getDiagnostics("html`<input value=${'foo'}' />`");
	hasDiagnostic(t, diagnostics, "no-unintended-mixed-binding");
});

tsTest("Report mixed binding with expression and }", t => {
	const { diagnostics } = getDiagnostics("html`<input value=${'foo'}} />`");
	hasDiagnostic(t, diagnostics, "no-unintended-mixed-binding");
});

tsTest("Report mixed binding with expression and /", t => {
	const { diagnostics } = getDiagnostics("html`<input value=${'foo'}/>`");
	hasDiagnostic(t, diagnostics, "no-unintended-mixed-binding");
});

tsTest("Don't report mixed binding with expression and %", t => {
	const { diagnostics } = getDiagnostics("html`<input value=${42}% />`");
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Don't report mixed event listener binding directly followed by /", t => {
	const { diagnostics } = getDiagnostics("html`<input @input=${console.log}/>`");
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Report mixed binding with expression and } inside quotes", t => {
	const { diagnostics } = getDiagnostics('html`<input value="${"foo"}}" />`');
	hasDiagnostic(t, diagnostics, "no-unintended-mixed-binding");
});
