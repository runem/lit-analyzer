import { getDiagnostics } from "../helpers/analyze.js";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert.js";
import { tsTest } from "../helpers/ts-test.js";

tsTest("'no-missing-element-type-definition' reports diagnostic when element is not in HTMLElementTagNameMap", t => {
	const { diagnostics } = getDiagnostics(
		`
		class MyElement extends HTMLElement { }; 
		customElements.define("my-element", MyElement)
	`,
		{
			rules: { "no-missing-element-type-definition": true }
		}
	);

	hasDiagnostic(t, diagnostics, "no-missing-element-type-definition");
});

tsTest("'no-missing-element-type-definition' reports no diagnostic when element is not in HTMLElementTagNameMap", t => {
	const { diagnostics } = getDiagnostics(
		`
		class MyElement extends HTMLElement { }; 
		customElements.define("my-element", MyElement)
		declare global {
			interface HTMLElementTagNameMap {
				"my-element": MyElement
			}
		}
	`,
		{
			rules: { "no-missing-element-type-definition": true }
		}
	);

	hasNoDiagnostics(t, diagnostics);
});
