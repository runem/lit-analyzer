import { getDiagnostics } from "../helpers/analyze.js";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert.js";
import { makeElement } from "../helpers/generate-test-file.js";
import { tsTest } from "../helpers/ts-test.js";

const lit2DirectiveSetup = `
	export class Directive { }

	export interface DirectiveClass {
		new (part: PartInfo): Directive;
	}

	export type DirectiveParameters<C extends Directive> = Parameters<C['render']>;

	// TODO (justinfagnani): ts-simple-type has a bug, so I remove the generic
	export interface DirectiveResult {
		values: unknown[];
	}

	export const directive = <C extends DirectiveClass>(c: C) => (...values: DirectiveParameters<InstanceType<C>>): DirectiveResult => ({
    ['_$litDirective$']: c,
    values,
  });
`;

tsTest("Element binding: non-directive not allowed", t => {
	const { diagnostics } = getDiagnostics("html`<input ${123} />`");
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

tsTest("Element binding: lit-html 1 directives are not allowed", t => {
	const { diagnostics } = getDiagnostics(`
export interface Part { }

const ifDefined: (value: unknown) => (part: Part) => void;

html\`<input \${ifDefined(10)} />\`
	`);
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

tsTest("Element binding: Lit 2 directives are allowed", t => {
	const { diagnostics } = getDiagnostics(`

${lit2DirectiveSetup}

class MyDirective extends Directive {
  render(): number {
		return 42;
	}
}
const myDirective = directive(MyDirective);

html\`<input \${myDirective()} />\`
	`);
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Element binding: any allowed", t => {
	const { diagnostics } = getDiagnostics(`
const ifDefined: any;

html\`<input \${ifDefined(10)} />\`
	`);
	hasNoDiagnostics(t, diagnostics);
});

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

tsTest("Attribute binding: the target attribute is correctly type checked when given a string", t => {
	const { diagnostics } = getDiagnostics(`html\`<a target="custom-target"></a>\`
	`);

	hasNoDiagnostics(t, diagnostics);
});

tsTest("Attribute binding: any symbols are ignored on type checking", t => {
	const { diagnostics } = getDiagnostics(`
declare const value: boolean | unique symbol;

html\`<div aria-expanded=\${userInput}></div>\`
	`);

	hasNoDiagnostics(t, diagnostics);
});

tsTest("Attribute binding: symbols are not treated as any type", t => {
	const { diagnostics } = getDiagnostics(`
declare const value: "invalid" | unique symbol;

html\`<div aria-expanded=\${value}></div>\`
	`);

	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

tsTest("Attribute binding: lit's nothing is ignored on type checking when returned by a function", t => {
	const { diagnostics } = getDiagnostics(`
declare const nothing: unique symbol;

function customIfDef<T>(value: T | null | undefined): T | typeof nothing {
	return value ?? nothing;
}

declare const value: boolean | null;

html\`<div aria-expanded=\${customIfDef(value)}></div>\`
	`);

	hasNoDiagnostics(t, diagnostics);
});
