import { getDiagnostics } from "../helpers/analyze";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert";
import { tsTest } from "../helpers/ts-test";

tsTest.skip("Emits 'no-invalid-boolean-binding' diagnostic when a boolean binding is used on a non-boolean type", t => {
	const { diagnostics } = getDiagnostics('html`<input ?type="${true}" />`');
	hasDiagnostic(t, diagnostics, "no-invalid-boolean-binding");
});

tsTest.skip("Emits no 'no-invalid-boolean-binding' diagnostic when the rule is turned off", t => {
	const { diagnostics } = getDiagnostics('html`<input ?type="${true}" />`', { rules: { "no-invalid-boolean-binding": "off" } });
	hasNoDiagnostics(t, diagnostics);
});

tsTest.skip("Emits no 'no-invalid-boolean-binding' diagnostic when a boolean binding is used on a boolean type", t => {
	const { diagnostics } = getDiagnostics('html`<input ?disabled="${true}" />`');
	hasNoDiagnostics(t, diagnostics);
});
