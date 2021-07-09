import { getDiagnostics } from "../helpers/analyze.js";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert.js";
import { tsTest } from "../helpers/ts-test.js";

tsTest("'no-incompatible-property-type' is not emitted for string types without configuration", t => {
	const { diagnostics } = getDiagnostics(
		`
  /**
   * @element
	 */
	class MyElement extends LitElement {
		@property() color: string;
	}
	`,
		{ rules: { "no-incompatible-property-type": "on" } }
	);

	hasNoDiagnostics(t, diagnostics);
});

tsTest("'no-incompatible-property-type' is not emitted for string types with String configuration", t => {
	const { diagnostics } = getDiagnostics(
		`
  /**
   * @element
	 */
	class MyElement extends LitElement {
		@property({type: String}) color: string;
	}
	`,
		{ rules: { "no-incompatible-property-type": "on" } }
	);

	hasNoDiagnostics(t, diagnostics);
});

tsTest("'no-incompatible-property-type' is emitted for string types with non-String configuration", t => {
	const { diagnostics } = getDiagnostics(
		`
  /**
   * @element
	 */
	class MyElement extends LitElement {
		@property({type: Number}) color: string;
	}
	`,
		{ rules: { "no-incompatible-property-type": "on" } }
	);

	hasDiagnostic(t, diagnostics, "no-incompatible-property-type");
});

tsTest("'no-incompatible-property-type' is emitted for non-string types with no configuration", t => {
	const { diagnostics } = getDiagnostics(
		`
  /**
   * @element
	 */
	class MyElement extends LitElement {
		@property() color: number;
	}
	`,
		{ rules: { "no-incompatible-property-type": "on" } }
	);

	hasDiagnostic(t, diagnostics, "no-incompatible-property-type");
});

tsTest("'no-incompatible-property-type' is emitted for number types with non-Number configuration", t => {
	const { diagnostics } = getDiagnostics(
		`
  /**
   * @element
	 */
	class MyElement extends LitElement {
		@property({type: String}) color: number;
	}
	`,
		{ rules: { "no-incompatible-property-type": "on" } }
	);

	hasDiagnostic(t, diagnostics, "no-incompatible-property-type");
});

tsTest("'no-incompatible-property-type' is not emitted for number types with Number configuration", t => {
	const { diagnostics } = getDiagnostics(
		`
  /**
   * @element
	 */
	class MyElement extends LitElement {
		@property({type: Number}) color: number;
	}
	`,
		{ rules: { "no-incompatible-property-type": "on" } }
	);

	hasNoDiagnostics(t, diagnostics);
});
