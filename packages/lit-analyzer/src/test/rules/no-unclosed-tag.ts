import { getDiagnostics } from "../helpers/analyze.js";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert.js";
import { tsTest } from "../helpers/ts-test.js";

tsTest("Report unclosed tags", t => {
	const { diagnostics } = getDiagnostics("html`<div><div></div>`", { rules: { "no-unclosed-tag": true } });
	hasDiagnostic(t, diagnostics, "no-unclosed-tag");
});

tsTest("Don't report self closed tags", t => {
	const { diagnostics } = getDiagnostics("html`<img />`", { rules: { "no-unclosed-tag": true } });
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Don't report void tags", t => {
	const { diagnostics } = getDiagnostics("html`<img>`", { rules: { "no-unclosed-tag": true } });
	hasNoDiagnostics(t, diagnostics);
});

// The `<p>` tag will be closed automatically if immediately followed by a lot of other elements,
// including `<div>`.
// Ref: https://html.spec.whatwg.org/multipage/grouping-content.html#the-p-element
tsTest("Report unclosed 'p' tag that is implicitly closed via tag omission", t => {
	const { diagnostics } = getDiagnostics("html`<p><div></div></p>`", { rules: { "no-unclosed-tag": true } });
	hasDiagnostic(t, diagnostics, "no-unclosed-tag");
});

tsTest("Report unclosed 'p' tag that is implicitly closed via tag omission containing text content", t => {
	const { diagnostics } = getDiagnostics("html`<p>Unclosed Content<div></div></p>`", { rules: { "no-unclosed-tag": true } });
	hasDiagnostic(t, diagnostics, "no-unclosed-tag");
});

// Self-closing tags do not exist in HTML, but we can use them to check
// that the user intended that the tag be closed.
tsTest("Don't report self closing 'p' tag", t => {
	const { diagnostics } = getDiagnostics("html`<p /><div></div>`", { rules: { "no-unclosed-tag": true } });
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Don't report self closing 'p' tag containing text content", t => {
	const { diagnostics } = getDiagnostics("html`<p />Unclosed Content<div></div>`", { rules: { "no-unclosed-tag": true } });
	hasNoDiagnostics(t, diagnostics);
});
