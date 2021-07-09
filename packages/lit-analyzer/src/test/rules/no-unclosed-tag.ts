import { getDiagnostics } from "../helpers/analyze";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert";
import { tsTest } from "../helpers/ts-test";

tsTest("Report unclosed tags", t => {
	const { diagnostics } = getDiagnostics("html`<div><div></div>`", { rules: { "no-unclosed-tag": true } });
	hasDiagnostic(t, diagnostics, "no-unclosed-tag");
});

tsTest("Don't report self closed tags", t => {
	const { diagnostics } = getDiagnostics("html`<img />`", { rules: { "no-unclosed-tag": true } });
	hasNoDiagnostics(t, diagnostics);
});
