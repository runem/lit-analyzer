import { getDiagnostics } from "../helpers/analyze";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert";
import { tsTest } from "../helpers/ts-test";

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
