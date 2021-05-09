import { getDiagnostics } from "../helpers/analyze";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert";
import { makeElement } from "../helpers/generate-test-file";
import { tsTest } from "../helpers/ts-test";

tsTest("Attribute binding: 'no-incompatible-type-binding' is not emitted when the rule is turned off", t => {
	const { diagnostics } = getDiagnostics('html`<input maxlength="foo" />`', { rules: { "no-incompatible-type-binding": "off" } });
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Attribute binding: String literal (a number) is assignable to number", t => {
	const { diagnostics } = getDiagnostics('html`<input maxlength="123" />`');
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Attribute binding: String literal (not a number) is not assignable to number", t => {
	const { diagnostics } = getDiagnostics('html`<input maxlength="foo" />`');
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

tsTest("Attribute binding: Number type expression is assignable to number", t => {
	const { diagnostics } = getDiagnostics('html`<input maxlength="${123}" />`');
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Attribute binding: String literal type expression (a number) is assignable to number", t => {
	const { diagnostics } = getDiagnostics('html`<input maxlength="${"123"}" />`');
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Attribute binding: String literal type expression (not a number) is not assignable to number", t => {
	const { diagnostics } = getDiagnostics('html`<input maxlength="${"foo"}" />`');
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

tsTest("Attribute binding: String type expression is not assignable to number", t => {
	const { diagnostics } = getDiagnostics('html`<input maxlength="${{} as string}" />`');
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

tsTest("Attribute binding: Expression of type union with two string literals (numbers) is assignable to number", t => {
	const { diagnostics } = getDiagnostics('html`<input maxlength="${{} as "123" | "321"}" />`');
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Attribute binding: Expression of type union with two string literals (one not being a number) is not assignable to number", t => {
	const { diagnostics } = getDiagnostics('html`<input maxlength="${{} as "123" | "foo"}" />`');
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

tsTest("Attribute binding: String literal is assignable to string", t => {
	const { diagnostics } = getDiagnostics('html`<input placeholder="foo" />`');
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Attribute binding: String literal (a number) is assignable to string", t => {
	const { diagnostics } = getDiagnostics('html`<input placeholder="123" />`');
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Attribute binding: String literal expression is assignable to string", t => {
	const { diagnostics } = getDiagnostics('html`<input placeholder="${"foo"}" />`');
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Attribute binding: Number type expression is assignable to string", t => {
	const { diagnostics } = getDiagnostics('html`<input placeholder="${123}" />`');
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Attribute binding: String literal (0 length) is assignable to number", t => {
	const { diagnostics } = getDiagnostics('html`<input maxlength="" />`');
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Attribute binding: String literal (0 length) is assignable to string", t => {
	const { diagnostics } = getDiagnostics('html`<input placeholder="" />`');
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Attribute binding: String literal (0 length) is assignable to boolean", t => {
	const { diagnostics } = getDiagnostics('html`<input required="" />`');
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Attribute binding: String literal is not assignable to boolean", t => {
	const { diagnostics } = getDiagnostics('html`<input required="foo" />`', { rules: { "no-boolean-in-attribute-binding": false } });
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

tsTest("Attribute binding: Number type expression is not assignable to boolean", t => {
	const { diagnostics } = getDiagnostics('html`<input required="${123}" />`', { rules: { "no-boolean-in-attribute-binding": false } });
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

tsTest("Attribute binding: Boolean attribute is assignable to boolean", t => {
	const { diagnostics } = getDiagnostics("html`<input required />`");
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Attribute binding: Boolean type expression is assignable to 'true'|'false'", t => {
	const { diagnostics } = getDiagnostics('let b = true; html`<input aria-expanded="${b}" />`', {
		rules: { "no-boolean-in-attribute-binding": false }
	});
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Attribute binding: Boolean type expression (true) is assignable to 'true'|'false'", t => {
	const { diagnostics } = getDiagnostics('html`<input aria-expanded="${true}" />`', { rules: { "no-boolean-in-attribute-binding": false } });
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Attribute binding: Boolean type expression (false) is assignable to 'true'|'false'", t => {
	const { diagnostics } = getDiagnostics('html`<input aria-expanded="${false}" />`', { rules: { "no-boolean-in-attribute-binding": false } });
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Attribute binding: Union of 'string | Directive' type expression is assignable to string", t => {
	const { diagnostics } = getDiagnostics('type DirectiveFn = {}; html`<input placeholder="${{} as string | DirectiveFn}" />`');
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Boolean binding: Empty string literal is not assignable in a boolean attribute binding", t => {
	const { diagnostics } = getDiagnostics('html`<input ?required="${""}" />`');
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

tsTest("Boolean binding: Boolean is assignable in a boolean attribute binding", t => {
	const { diagnostics } = getDiagnostics('html`<input ?required="${true}" />`');
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Boolean binding: String is not assignable in boolean attribute binding", t => {
	const { diagnostics } = getDiagnostics('html`<input ?required="${{} as string}" />`');
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

tsTest("Property binding: String literal type expression is not assignable to boolean property", t => {
	const { diagnostics } = getDiagnostics([makeElement({ properties: ["required = false"] }), 'html`<my-element .required="${"foo"}"></my-element>`']);
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

tsTest("Property binding: String literal (0 length) type expression is not assignable to boolean property", t => {
	const { diagnostics } = getDiagnostics([makeElement({ properties: ["required = false"] }), 'html`<my-element .required="${""}"></my-element>`']);
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

tsTest("Property binding: Number type expression is not assignable to boolean property", t => {
	const { diagnostics } = getDiagnostics([makeElement({ properties: ["required = false"] }), 'html`<my-element .required="${123}"></my-element>`']);
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

tsTest("Property binding: Boolean type expression is not assignable to boolean property", t => {
	const { diagnostics } = getDiagnostics([makeElement({ properties: ["required = false"] }), 'html`<my-element .required="${true}"></my-element>`']);
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Attribute binding: 'ifDefined' directive correctly removes 'undefined' from the type union 1", t => {
	const { diagnostics } = getDiagnostics('type ifDefined = Function; html`<input maxlength="${ifDefined({} as number | undefined)}" />`');
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Attribute binding: 'ifDefined' directive correctly removes 'undefined' from the type union 2", t => {
	const { diagnostics } = getDiagnostics('type ifDefined = Function; html`<input maxlength="${ifDefined({} as number | string | undefined)}" />`');
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

tsTest("Attribute binding: 'guard' directive correctly infers correct type from the callback 1", t => {
	const { diagnostics } = getDiagnostics('type guard = Function; html`<img src="${guard([""], () => "nothing.png")}" />`');
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Attribute binding: 'guard' directive correctly infers correct type from the callback 2", t => {
	const { diagnostics } = getDiagnostics('type guard = Function; html`<input maxlength="${guard([""], () => ({} as string | number))}" />`');
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

tsTest("Attribute binding: using custom directive won't result in diagnostics", t => {
	const { diagnostics } = getDiagnostics(`
export interface Part { }

const ifDefined: (value: unknown) => (part: Part) => void

const ifExists = (value: any) => ifDefined(value === null ? undefined : value);

html\`<input step="\${ifExists(10)}" />\`
	`);
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Attribute binding: the role attribute is correctly type checked when given valid items", t => {
	const { diagnostics } = getDiagnostics(`html\`<div role="button listitem"></div>\`
	`);

	hasNoDiagnostics(t, diagnostics);
});

tsTest("Attribute binding: the role attribute is correctly type checked when given invalid items", t => {
	const { diagnostics } = getDiagnostics(`html\`<div role="button foo"></div>\`
	`);

	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

function makeCustomDirective(name = "myDirective") {
	return `
type DirectiveFn<_T = unknown> = (part: Part) => void;
const ${name} = {} as (<T>(arg: T) => DirectiveFn<T>);
`;
}

tsTest("Attribute binding: correctly infers type of generic directive function", t => {
	const { diagnostics } = getDiagnostics(`${makeCustomDirective("myDirective")}
html\`<input step="\${myDirective(10)}" /> \`
	`);

	hasNoDiagnostics(t, diagnostics);
});

tsTest("Attribute binding: correctly infers type of generic directive function and fails type checking", t => {
	const { diagnostics } = getDiagnostics(`${makeCustomDirective("myDirective")}
html\`<input step="\${myDirective("foo")}" /> \`
	`);

	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

tsTest("Event binding: event handler is assignable to valid event", t => {
	const { diagnostics } = getDiagnostics([makeElement({ events: ["foo-event"] }), "html`<my-element @foo-event=${(ev) => {}}></my-element>`"]);
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Event binding: event handler is assignable to valid typed event", t => {
	const { diagnostics } = getDiagnostics([
		makeElement({ events: ["{MouseEvent} foo-event"] }),
		"html`<my-element @foo-event=${(ev: MouseEvent) => {}}></my-element>`"
	]);
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Event binding: invalid event handler is not assignable to typed event", t => {
	const { diagnostics } = getDiagnostics([
		makeElement({ events: ["{MouseEvent} foo-event"] }),
		"html`<my-element @foo-event=${(ev: KeyboardEvent) => {}}></my-element>`"
	]);
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

tsTest("Event binding: invalid event handler is not assignable to event", t => {
	const { diagnostics } = getDiagnostics([
		makeElement({ events: ["foo-event"] }),
		"html`<my-element @foo-event=${(arg: boolean) => {}}></my-element>`"
	]);
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

tsTest("Event binding: invalid event handler (generic custom event) is not assignable to typed event", t => {
	const { diagnostics } = getDiagnostics([
		makeElement({ events: ["{CustomEvent<string>} foo-event"] }),
		"html`<my-element @foo-event=${(ev: CustomEvent<number>) => {}}></my-element>`"
	]);
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

tsTest("Event binding: event handler (generic custom event) is assignable to typed event", t => {
	const { diagnostics } = getDiagnostics([
		makeElement({ events: ["{CustomEvent<string>} foo-event"] }),
		"html`<my-element @foo-event=${(ev: CustomEvent<string>) => {}}></my-element>`"
	]);
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Event binding: event handler is assignable to event with unknown type", t => {
	const { diagnostics } = getDiagnostics([
		makeElement({ events: ["foo-event"] }),
		"html`<my-element @foo-event=${(ev: MouseEvent) => {}}></my-element>`"
	]);
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Event binding: event handler is assignable to merged event", t => {
	const { diagnostics } = getDiagnostics([
		makeElement({ events: ["{MouseEvent} foo-event"] }),
		makeElement({ events: ["{KeyboardEvent} foo-event"] }),
		"html`<my-element @foo-event=${(ev: MouseEvent) => {}}></my-element>`"
	]);
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Event binding: Callable value is bindable", t => {
	const { diagnostics } = getDiagnostics('html`<input @change="${() => {}}" />`');
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Event binding: Non callback value is not bindable", t => {
	const { diagnostics } = getDiagnostics('html`<input @change="${(() => {})()}" />`');
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

tsTest("Event binding: Number is not bindable", t => {
	const { diagnostics } = getDiagnostics('html`<input @change="${123}" />`');
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

tsTest("Event binding: Function is bindable", t => {
	const { diagnostics } = getDiagnostics('function foo() {}; html`<input @change="${foo}" />`');
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Event binding: Called function is not bindable", t => {
	const { diagnostics } = getDiagnostics('function foo() {}; html`<input @change="${foo()}" />`');
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

tsTest("Event binding: Any type is bindable", t => {
	const { diagnostics } = getDiagnostics('html`<input @change="${{} as any}" />`');
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Event binding: Object with callable 'handleEvent' is bindable 1", t => {
	const { diagnostics } = getDiagnostics('html`<input @change="${{handleEvent: () => {}}}" />`');
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Event binding: Object with callable 'handleEvent' is bindable 2", t => {
	const { diagnostics } = getDiagnostics('function foo() {}; html`<input @change="${{handleEvent: foo}}" />`');
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Event binding: Object with called 'handleEvent' is not bindable", t => {
	const { diagnostics } = getDiagnostics('function foo() {}; html`<input @change="${{handleEvent: foo()}}" />`');
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

tsTest("Event binding: Object literal without 'handleEvent' is not bindable", t => {
	const { diagnostics } = getDiagnostics('function foo() {}; html`<input @change="${{foo: "bar"}}" />`');
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

tsTest("Event binding: Mixed value binding with first expression being callable is bindable", t => {
	const { diagnostics } = getDiagnostics('html`<input @change="foo${console.log}bar" />`');
	hasNoDiagnostics(t, diagnostics);
});
