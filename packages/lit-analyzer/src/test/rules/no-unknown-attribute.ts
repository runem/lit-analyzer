import { getDiagnostics } from "../helpers/analyze";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert";
import { tsTest } from "../helpers/ts-test";

tsTest("Don't report unknown attributes when 'no-unknown-attribute' is turned off", t => {
	const { diagnostics } = getDiagnostics("html`<input foo='' />`", { rules: { "no-unknown-attribute": false } });
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Report unknown attributes on known element", t => {
	const { diagnostics } = getDiagnostics("html`<input foo='' />`", { rules: { "no-unknown-attribute": true } });
	hasDiagnostic(t, diagnostics, "no-unknown-attribute");
});

tsTest("Don't report unknown attributes", t => {
	const { diagnostics } = getDiagnostics("html`<input required />`", { rules: { "no-unknown-attribute": true } });
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Don't report unknown attributes on unknown element", t => {
	const { diagnostics } = getDiagnostics("html`<unknown-element foo=''></unknown-element>`", {
		rules: { "no-unknown-attribute": true, "no-unknown-tag-name": false }
	});
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Don't report unknown data- attributes", t => {
	const { diagnostics } = getDiagnostics("html`<input data-foo='' />`", { rules: { "no-unknown-attribute": true } });
	hasNoDiagnostics(t, diagnostics);
});
