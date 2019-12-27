import test from "ava";
import { getDiagnostics } from "../helpers/analyze";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert";

test("Cannot assign 'undefined' in attribute binding", t => {
	const { diagnostics } = getDiagnostics('html`<input maxlength="${{} as number | undefined}" />`');
	hasDiagnostic(t, diagnostics, "no-nullable-attribute-binding");
});

test("Can assign 'undefined' in property binding", t => {
	const { diagnostics } = getDiagnostics('html`<input .maxLength="${{} as number | undefined}" />`');
	hasNoDiagnostics(t, diagnostics);
});

test("Cannot assign 'null' in attribute binding", t => {
	const { diagnostics } = getDiagnostics('html`<input maxlength="${{} as number | null}" />`');
	hasDiagnostic(t, diagnostics, "no-nullable-attribute-binding");
});

test("Can assign 'null' in property binding", t => {
	const { diagnostics } = getDiagnostics('html`<input .maxLength="${{} as number | null}" />`');
	hasNoDiagnostics(t, diagnostics);
});
