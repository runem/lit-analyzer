import test from "ava";
import { getDiagnostics } from "../helpers/analyze";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert";

test('Report mixed binding with expression and "', t => {
	const { diagnostics } = getDiagnostics('html`<input value=${"foo"}" />`');
	hasDiagnostic(t, diagnostics, "no-unexpected-mixed-binding");
});

test("Report mixed binding with expression and '", t => {
	const { diagnostics } = getDiagnostics("html`<input value=${'foo'}' />`");
	hasDiagnostic(t, diagnostics, "no-unexpected-mixed-binding");
});

test("Report mixed binding with expression and }", t => {
	const { diagnostics } = getDiagnostics("html`<input value=${'foo'}} />`");
	hasDiagnostic(t, diagnostics, "no-unexpected-mixed-binding");
});

test("Report mixed binding with expression and /", t => {
	const { diagnostics } = getDiagnostics("html`<input value=${'foo'}/>`");
	hasDiagnostic(t, diagnostics, "no-unexpected-mixed-binding");
});

test("Don't report mixed binding with expression and %", t => {
	const { diagnostics } = getDiagnostics("html`<input value=${42}% />`");
	hasNoDiagnostics(t, diagnostics);
});

test("Report mixed binding with expression and } inside quotes", t => {
	const { diagnostics } = getDiagnostics('html`<input value="${"foo"}}" />`');
	hasDiagnostic(t, diagnostics, "no-unexpected-mixed-binding");
});
