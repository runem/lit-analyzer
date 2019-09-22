import test from "ava";
import { getDiagnostics } from "../helpers/analyze";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert";

test("Non-boolean-binding with an empty string value is valid", t => {
	const { diagnostics } = getDiagnostics('html`<input required="" />`', { rules: { "no-boolean-in-attribute-binding": true } });
	hasNoDiagnostics(t, diagnostics);
});

test("Non-boolean-binding with a boolean type expression is not valid", t => {
	const { diagnostics } = getDiagnostics('html`<input max="${true}" />`', { rules: { "no-boolean-in-attribute-binding": true } });
	hasDiagnostic(t, diagnostics, "no-boolean-in-attribute-binding");
});

test("Non-boolean-binding on a boolean type attribute with a non-boolean type expression is not valid", t => {
	const { diagnostics } = getDiagnostics('html`<input required="${{} as string}" />`', { rules: { "no-boolean-in-attribute-binding": true } });
	hasDiagnostic(t, diagnostics, "no-boolean-in-attribute-binding");
});
