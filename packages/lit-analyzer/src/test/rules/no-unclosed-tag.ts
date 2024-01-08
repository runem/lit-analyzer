import { getDiagnostics } from "../helpers/analyze.js";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert.js";
import { tsTest } from "../helpers/ts-test.js";

tsTest("Report unclosed tags", t => {
	const { diagnostics } = getDiagnostics("html`<div><div></div>`", { rules: { "no-unclosed-tag": true } });
	hasDiagnostic(t, diagnostics, "no-unclosed-tag");
});

tsTest("Don't report void elements", t => {
	const { diagnostics } = getDiagnostics("html`<img>`", { rules: { "no-unclosed-tag": true } });
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Don't report void elements with self closing syntax", t => {
	const { diagnostics } = getDiagnostics("html`<img />`", { rules: { "no-unclosed-tag": true } });
	hasNoDiagnostics(t, diagnostics);
});

// The `<p>` tag will be closed automatically if immediately followed by a lot of other elements,
// including `<div>`.
// Ref: https://html.spec.whatwg.org/multipage/grouping-content.html#the-p-element
tsTest("Report unclosed 'p' tag that was implicitly closed via tag omission", t => {
	const { diagnostics } = getDiagnostics("html`<p><div></div></p>`", { rules: { "no-unclosed-tag": true } });
	hasDiagnostic(t, diagnostics, "no-unclosed-tag");
});

tsTest("Report unclosed 'p' tag that is implicitly closed via tag omission containing text content", t => {
	const { diagnostics } = getDiagnostics("html`<p>Unclosed Content<div></div></p>`", { rules: { "no-unclosed-tag": true } });
	hasDiagnostic(t, diagnostics, "no-unclosed-tag");
});

// Regeression test for https://github.com/runem/lit-analyzer/issues/283
tsTest("Report 'p' tag that is implicitly closed via tag omission containing a space", t => {
	// Note, the browser will parse this case into: `<p> </p><div></div><p></p>` which can be
	// unexpected, but technically means the first `<p>` tag is not explicitly closed.
	const { diagnostics } = getDiagnostics("html`<p> <div></div></p>`", { rules: { "no-unclosed-tag": true } });
	hasDiagnostic(t, diagnostics, "no-unclosed-tag");
});

// Self-closing tags do not exist in HTML. They are only valid in SVG and MathML.
tsTest("Report non-void element using self closing syntax", t => {
	const { diagnostics } = getDiagnostics("html`<p /><div></div>`", { rules: { "no-unclosed-tag": true } });
	hasDiagnostic(t, diagnostics, "no-unclosed-tag");
});

tsTest("Report self closing 'p' tag containing text content", t => {
	const { diagnostics } = getDiagnostics("html`<p />Unclosed Content<div></div>`", { rules: { "no-unclosed-tag": true } });
	hasDiagnostic(t, diagnostics, "no-unclosed-tag");
});

tsTest("Don't report explicit closing 'p' tag containing text content", t => {
	const { diagnostics } = getDiagnostics("html`<p>Unclosed Content</p><div></div>`", { rules: { "no-unclosed-tag": true } });
	hasNoDiagnostics(t, diagnostics);
});
