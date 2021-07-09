import { getDiagnostics } from "../helpers/analyze";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert";
import { makeElement } from "../helpers/generate-test-file";
import { tsTest } from "../helpers/ts-test";

tsTest("Report unknown custom elements", t => {
	const { diagnostics } = getDiagnostics("html`<unknown-element></unknown-element>`", { rules: { "no-unknown-tag-name": true } });
	hasDiagnostic(t, diagnostics, "no-unknown-tag-name");
});

tsTest("Don't report known built in elements", t => {
	const { diagnostics } = getDiagnostics("html`<div></div>`", { rules: { "no-unknown-tag-name": true } });
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Report unknown built in elements", t => {
	const { diagnostics } = getDiagnostics("html`<element></element>`", { rules: { "no-unknown-tag-name": true } });
	hasDiagnostic(t, diagnostics, "no-unknown-tag-name");
});

tsTest("Don't report known custom elements found in other file", t => {
	const { diagnostics } = getDiagnostics([makeElement({}), "html`<my-element></my-element>`"], { rules: { "no-unknown-tag-name": true } });
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Don't report known custom element", t => {
	const { diagnostics } = getDiagnostics(
		"class MyElement extends HTMLElement {}; customElements.define('my-element', MyElement); html`<my-element></my-element>`",
		{
			rules: { "no-unknown-tag-name": true }
		}
	);
	hasNoDiagnostics(t, diagnostics);
});
