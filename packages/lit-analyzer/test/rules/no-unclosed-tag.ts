import test from "ava";
import { getDiagnostics } from "../helpers/analyze";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert";

test("Report unclosed tags", t => {
	const { diagnostics } = getDiagnostics("html`<div><div></div>`", { rules: { "no-unclosed-tag": true } });
	hasDiagnostic(t, diagnostics, "no-unclosed-tag");
});

test("Don't report self closed tags", t => {
	const { diagnostics } = getDiagnostics("html`<img />`", { rules: { "no-unclosed-tag": true } });
	hasNoDiagnostics(t, diagnostics);
});
