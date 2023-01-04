import { ExecutionContext } from "ava";
import { Node, SourceFile } from "typescript";

import { getCurrentTsModule, tsTest } from "../helpers/ts-test.js";
import { getIndexEntries } from "../helpers/analyze.js";

import { LitIndexEntry } from "../../lib/analyze/document-analyzer/html/lit-html-document-analyzer.js";
import { HtmlNodeKind } from "../../lib/analyze/types/html-node/html-node-types.js";
import { HtmlNodeAttrKind } from "../../lib/analyze/types/html-node/html-node-attr-types.js";

tsTest("No entries are created for HTML-like template strings if the template tags are not named `html`.", t => {
	const { indexEntries } = getIndexEntries([
		{
			fileName: "main.js",
			entry: true,
			text: `
				class SomeElement extends HTMLElement {}
				customElements.define('some-element', SomeElement);

				const nothtml = x => x;
				nothtml\`<some-element></some-element>\`;
			`
		}
	]);

	const entries = Array.from(indexEntries);
	t.is(entries.length, 0);
});

tsTest("No entries are created for elements that are not defined with `customElements`.", t => {
	const { indexEntries } = getIndexEntries([
		{
			fileName: "main.js",
			entry: true,
			text: `
				class SomeElement extends HTMLElement {}

				const html = x => x;
				html\`<some-element></some-element>\`;
			`
		}
	]);

	const entries = Array.from(indexEntries);
	t.is(entries.length, 0);
});

tsTest("No entries are created for tags that don't match any definition.", t => {
	const { indexEntries } = getIndexEntries([
		{
			fileName: "main.js",
			entry: true,
			text: `
				class SomeElement extends HTMLElement {}
				customElements.define('some-element', SomeElement);

				declare global {
					interface HTMLElementTagNameMap {
						'some-element': SomeElement;
					}
				}

				const html = x => x;
				html\`<unknown-element></unknown-element>\`;
			`
		}
	]);

	const entries = Array.from(indexEntries);
	t.is(entries.length, 0);
});

/**
 * Asserts that `identifier` is the identifier of a class with name `className`
 * in the file `sourceFile`.
 */
const assertIdentifiesClass = ({
	t,
	identifier,
	sourceFile,
	className
}: {
	t: ExecutionContext;
	identifier: Node;
	sourceFile?: SourceFile;
	className: string;
}) => {
	const { isClassDeclaration, isIdentifier } = getCurrentTsModule();

	if (!isIdentifier(identifier)) {
		throw new Error("The definition target's node should be an identifier.");
	}

	t.is(identifier.getSourceFile(), sourceFile, "The identifier is not in the expected source file.");
	t.is(identifier.text, className, `The identifier's text should be \`${className}\`.`);

	const { parent: identParent } = identifier;
	if (!isClassDeclaration(identParent)) {
		throw new Error("The target node's parent should be a class declaration.");
	}

	t.is(identParent.name, identifier, "The target node should be it's class definition's name.");
};

/**
 * Asserts that `entry` is a `HtmlNodeIndexEntry` that describes an element with
 * tag name `tagName` that is defined by a single class named `className` in
 * `sourceFile`.
 */
const assertEntryTargetsClass = ({
	t,
	entry,
	sourceFile,
	tagName,
	className
}: {
	t: ExecutionContext;
	entry: LitIndexEntry;
	sourceFile?: SourceFile;
	tagName: string;
	className: string;
}) => {
	if (entry.kind !== "NODE-REFERENCE") {
		throw new Error("The entry does not originate from an element.");
	}

	const { node: entryNode } = entry;
	t.is(entryNode.kind, HtmlNodeKind.NODE, "The entry should not originate from an `<svg>` or `<style>`.");
	t.is(entryNode.tagName, tagName, `The origin element is not a \`<${tagName}>\`.`);

	const { targets } = entry.definition;
	t.is(targets.length, 1, "The definition should have a single target.");

	const [target] = targets;
	if (target.kind !== "node") {
		throw new Error("The definition target should be a `LitDefinitionTargetNode`.");
	}

	assertIdentifiesClass({ t, identifier: target.node, sourceFile, className });
};

tsTest("Element references can reference elements defined in the same file. (JS)", t => {
	const { indexEntries, sourceFile } = getIndexEntries([
		{
			fileName: "main.js",
			entry: true,
			text: `
				class SomeElement extends HTMLElement {}
				customElements.define('some-element', SomeElement);

				const html = x => x;
				html\`<some-element></some-element>\`;
			`
		}
	]);

	const entries = Array.from(indexEntries);
	t.is(entries.length, 1);

	assertEntryTargetsClass({
		t,
		entry: entries[0],
		sourceFile,
		tagName: "some-element",
		className: "SomeElement"
	});
});

tsTest("Element references can reference elements defined in the same file. (TS)", t => {
	const { indexEntries, sourceFile } = getIndexEntries([
		{
			fileName: "main.ts",
			entry: true,
			text: `
				class SomeElement extends HTMLElement {}
				customElements.define('some-element', SomeElement);

				declare global {
					interface HTMLElementTagNameMap {
						'some-element': SomeElement;
					}
				}

				const html = x => x;
				html\`<some-element></some-element>\`;
			`
		}
	]);

	const entries = Array.from(indexEntries);
	t.is(entries.length, 1);

	assertEntryTargetsClass({
		t,
		entry: entries[0],
		sourceFile,
		tagName: "some-element",
		className: "SomeElement"
	});
});

tsTest("An entry is created for elements that are not defined with `customElements` if they are added to `HTMLElementTagNameMap` in TS.", t => {
	const { indexEntries, sourceFile } = getIndexEntries([
		{
			fileName: "main.ts",
			entry: true,
			text: `
				class SomeElement extends HTMLElement {}

				declare global {
					interface HTMLElementTagNameMap {
						'some-element': SomeElement;
					}
				}

				const html = x => x;
				html\`<some-element></some-element>\`;
			`
		}
	]);

	const entries = Array.from(indexEntries);
	t.is(entries.length, 1);

	assertEntryTargetsClass({
		t,
		entry: entries[0],
		sourceFile,
		tagName: "some-element",
		className: "SomeElement"
	});
});

tsTest("Element references can reference elements defined in a different file.", t => {
	const { indexEntries, program } = getIndexEntries([
		{
			fileName: "main.js",
			entry: true,
			text: `
				import './some-element.js';

				const html = x => x;
				html\`<some-element></some-element>\`;
			`
		},
		{
			fileName: "some-element.ts",
			text: `
				class SomeElement extends HTMLElement {}
				customElements.define('some-element', SomeElement);

				declare global {
					interface HTMLElementTagNameMap {
						'some-element': SomeElement;
					}
				}
			`
		}
	]);

	const entries = Array.from(indexEntries);
	t.is(entries.length, 1);

	assertEntryTargetsClass({
		t,
		entry: entries[0],
		sourceFile: program.getSourceFile("some-element.ts"),
		tagName: "some-element",
		className: "SomeElement"
	});
});

tsTest("Attribute references are not created for attributes that don't map to known properties.", t => {
	const { indexEntries } = getIndexEntries([
		{
			fileName: "main.ts",
			entry: true,
			text: `
				class SomeElement extends HTMLElement {
					prop: string;
				}
				customElements.define('some-element', SomeElement);

				declare global {
					interface HTMLElementTagNameMap {
						'some-element': SomeElement;
					}
				}

				const html = x => x;
				html\`<some-element .unknown="abc" other-unknown="def"></some-element>\`;
			`
		}
	]);

	const entries = Array.from(indexEntries).filter(entry => entry.kind === "ATTRIBUTE-REFERENCE");
	t.is(entries.length, 0);
});

/**
 * Asserts that `entry` is a `HtmlNodeAttrIndexEntry` with name `name` and kind
 * `kind` that has a single target `LitDefinitionTargetNode`.
 */
const assertIsAttrRefAndGetTarget = ({
	t,
	entry,
	name,
	kind
}: {
	t: ExecutionContext;
	entry: LitIndexEntry;
	name: string;
	kind: HtmlNodeAttrKind;
}) => {
	if (entry.kind !== "ATTRIBUTE-REFERENCE") {
		throw new Error("The entry does not originate from an attribute.");
	}

	const { attribute: entryAttr } = entry;
	t.is(entryAttr.name, name, `The attribute name should be \`${name}\`.`);
	t.is(entryAttr.kind, kind, `The attribute kind should be \`${kind}\`.`);

	const { targets } = entry.definition;
	t.is(targets.length, 1, "The definition should have a single target.");

	const [target] = targets;
	if (target.kind !== "node") {
		throw new Error("The definition target should be a `LitDefinitionTargetNode`.");
	}

	return target;
};

const assertIsAttrRefTargetingClass = ({
	t,
	entry,
	name,
	kind,
	sourceFile,
	className
}: {
	t: ExecutionContext;
	entry: LitIndexEntry;
	name: string;
	kind: HtmlNodeAttrKind;
	sourceFile: SourceFile;
	className: string;
}) => {
	const { isClassDeclaration } = getCurrentTsModule();

	const { node: targetNode, name: targetName } = assertIsAttrRefAndGetTarget({
		t,
		entry,
		name,
		kind
	});

	t.is(targetNode.getSourceFile(), sourceFile, "The target node is not in the expected source file.");
	if (targetName !== name) {
		throw new Error(`The target node's name should be \`${name}\`.`);
	}

	// Find the nearest class declaration.
	let ancestor: Node = targetNode.parent;
	while (!isClassDeclaration(ancestor)) {
		ancestor = ancestor.parent;
	}

	if (!ancestor?.name) {
		throw new Error("The target node was not contained in a named class.");
	}

	assertIdentifiesClass({
		t,
		identifier: ancestor.name,
		sourceFile,
		className: className
	});
};

tsTest("Attribute references can reference properties defined in the static `properties` getter.", t => {
	const { indexEntries, sourceFile } = getIndexEntries([
		{
			fileName: "main.ts",
			entry: true,
			text: `
				class SomeElement extends HTMLElement {
					static get properties() {
						return {
							prop: {type: String},
						};
					};
				}
				customElements.define('some-element', SomeElement);

				declare global {
					interface HTMLElementTagNameMap {
						'some-element': SomeElement;
					}
				}

				const html = x => x;
				html\`<some-element .prop="abc"></some-element>\`;
			`
		}
	]);

	const entries = Array.from(indexEntries).filter(entry => entry.kind === "ATTRIBUTE-REFERENCE");
	t.is(entries.length, 1);

	assertIsAttrRefTargetingClass({
		t,
		entry: entries[0],
		name: "prop",
		kind: HtmlNodeAttrKind.PROPERTY,
		sourceFile,
		className: "SomeElement"
	});
});

tsTest("Attribute references can reference properties defined with a class field.", t => {
	const { indexEntries, sourceFile } = getIndexEntries([
		{
			fileName: "main.ts",
			entry: true,
			text: `
				class SomeElement extends HTMLElement {
					prop = "abc";
				}
				customElements.define('some-element', SomeElement);

				declare global {
					interface HTMLElementTagNameMap {
						'some-element': SomeElement;
					}
				}

				const html = x => x;
				html\`<some-element .prop="abc"></some-element>\`;
			`
		}
	]);

	const entries = Array.from(indexEntries).filter(entry => entry.kind === "ATTRIBUTE-REFERENCE");
	t.is(entries.length, 1);

	assertIsAttrRefTargetingClass({
		t,
		entry: entries[0],
		name: "prop",
		kind: HtmlNodeAttrKind.PROPERTY,
		sourceFile,
		className: "SomeElement"
	});
});

tsTest("Attribute references can reference properties defined with a setter.", t => {
	const { indexEntries, sourceFile } = getIndexEntries([
		{
			fileName: "main.ts",
			entry: true,
			text: `
				class SomeElement extends HTMLElement {
					set prop() {}
				}
				customElements.define('some-element', SomeElement);

				declare global {
					interface HTMLElementTagNameMap {
						'some-element': SomeElement;
					}
				}

				const html = x => x;
				html\`<some-element .prop="abc"></some-element>\`;
			`
		}
	]);

	const entries = Array.from(indexEntries).filter(entry => entry.kind === "ATTRIBUTE-REFERENCE");
	t.is(entries.length, 1);

	assertIsAttrRefTargetingClass({
		t,
		entry: entries[0],
		name: "prop",
		kind: HtmlNodeAttrKind.PROPERTY,
		sourceFile,
		className: "SomeElement"
	});
});

tsTest("Attribute references can reference properties defined by assignment in the constructor.", t => {
	const { indexEntries, sourceFile } = getIndexEntries([
		{
			fileName: "main.ts",
			entry: true,
			text: `
				class SomeElement extends HTMLElement {
					constructor() {
						super();
						this.prop = "def";
					}
				}
				customElements.define('some-element', SomeElement);

				declare global {
					interface HTMLElementTagNameMap {
						'some-element': SomeElement;
					}
				}

				const html = x => x;
				html\`<some-element .prop="abc"></some-element>\`;
			`
		}
	]);

	const entries = Array.from(indexEntries).filter(entry => entry.kind === "ATTRIBUTE-REFERENCE");
	t.is(entries.length, 1);

	assertIsAttrRefTargetingClass({
		t,
		entry: entries[0],
		name: "prop",
		kind: HtmlNodeAttrKind.PROPERTY,
		sourceFile,
		className: "SomeElement"
	});
});

tsTest("Attribute references can reference properties defined in `observedAttributes`.", t => {
	const { indexEntries, sourceFile } = getIndexEntries([
		{
			fileName: "main.ts",
			entry: true,
			text: `
				class SomeElement extends HTMLElement {
					static get observedAttributes() {
						return ["some-attr"];
					}
				}
				customElements.define('some-element', SomeElement);

				declare global {
					interface HTMLElementTagNameMap {
						'some-element': SomeElement;
					}
				}

				const html = x => x;
				html\`<some-element some-attr="abc"></some-element>\`;
			`
		}
	]);

	const entries = Array.from(indexEntries).filter(entry => entry.kind === "ATTRIBUTE-REFERENCE");
	t.is(entries.length, 1);

	assertIsAttrRefTargetingClass({
		t,
		entry: entries[0],
		name: "some-attr",
		kind: HtmlNodeAttrKind.ATTRIBUTE,
		sourceFile,
		className: "SomeElement"
	});
});

tsTest("Attribute references can reference properties defined with a @property decorator", t => {
	const { indexEntries, sourceFile } = getIndexEntries([
		{
			fileName: "main.ts",
			entry: true,
			text: `
				class SomeElement extends HTMLElement {
					@property({ attribute: "some-attr") someAttr: string;
				}
				customElements.define('some-element', SomeElement);

				declare global {
					interface HTMLElementTagNameMap {
						'some-element': SomeElement;
					}
				}

				const html = x => x;
				html\`<some-element some-attr="abc"></some-element>\`;
			`
		}
	]);

	const entries = Array.from(indexEntries).filter(entry => entry.kind === "ATTRIBUTE-REFERENCE");
	t.is(entries.length, 1);

	assertIsAttrRefTargetingClass({
		t,
		entry: entries[0],
		name: "some-attr",
		kind: HtmlNodeAttrKind.ATTRIBUTE,
		sourceFile,
		className: "SomeElement"
	});
});

tsTest("Boolean attribute references have the right kind.", t => {
	const { indexEntries, sourceFile } = getIndexEntries([
		{
			fileName: "main.ts",
			entry: true,
			text: `
				class SomeElement extends HTMLElement {
					static get properties() {
						return {
							prop: {type: Boolean},
						};
					};
				}
				customElements.define('some-element', SomeElement);

				declare global {
					interface HTMLElementTagNameMap {
						'some-element': SomeElement;
					}
				}

				const html = x => x;
				html\`<some-element ?prop="abc"></some-element>\`;
			`
		}
	]);

	const entries = Array.from(indexEntries).filter(entry => entry.kind === "ATTRIBUTE-REFERENCE");
	t.is(entries.length, 1);

	assertIsAttrRefTargetingClass({
		t,
		entry: entries[0],
		name: "prop",
		kind: HtmlNodeAttrKind.BOOLEAN_ATTRIBUTE,
		sourceFile,
		className: "SomeElement"
	});
});

tsTest("Attribute references have the right kind.", t => {
	const { indexEntries, sourceFile } = getIndexEntries([
		{
			fileName: "main.ts",
			entry: true,
			text: `
				class SomeElement extends HTMLElement {
					static get properties() {
						return {
							// The indexer shouldn't mistake plain attributes with properties
							// of the same name.
							prop: {type: String},
						};
					};
				}
				customElements.define('some-element', SomeElement);

				declare global {
					interface HTMLElementTagNameMap {
						'some-element': SomeElement;
					}
				}

				const html = x => x;
				html\`<some-element prop="abc"></some-element>\`;
			`
		}
	]);

	const entries = Array.from(indexEntries).filter(entry => entry.kind === "ATTRIBUTE-REFERENCE");
	t.is(entries.length, 1);

	assertIsAttrRefTargetingClass({
		t,
		entry: entries[0],
		name: "prop",
		kind: HtmlNodeAttrKind.ATTRIBUTE,
		sourceFile,
		className: "SomeElement"
	});
});

tsTest("Event listeners do not produce entries.", t => {
	const { indexEntries } = getIndexEntries([
		{
			fileName: "main.ts",
			entry: true,
			text: `
				class SomeElement extends HTMLElement {
					static get properties() {
						return {
							// The indexer shouldn't mistake event listeners with properties
							// of the same name.
							someEvent: {type: Function},
						};
					};
				}
				customElements.define('some-element', SomeElement);

				declare global {
					interface HTMLElementTagNameMap {
						'some-element': SomeElement;
					}
				}

				// Supporting this might be a nice improvement but it doesn't currently work.

				interface SomeElementEventMap extends HTMLElementEventMap, WindowEventHandlersEventMap {
					'someEvent': Event;
				}

				interface SomeElement {
					addEventListener<K extends keyof SomeElementEventMap>(type: K, listener: (this: SomeElement, ev: SomeElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
					addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
					removeEventListener<K extends keyof SomeElementEventMap>(type: K, listener: (this: SomeElement, ev: SomeElementEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
					removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
				}

				const html = x => x;
				html\`<some-element @someEvent=$\{(e) => console.log(e)}></some-element>\`;
			`
		}
	]);

	const entries = Array.from(indexEntries).filter(entry => entry.kind === "ATTRIBUTE-REFERENCE");
	t.is(entries.length, 0);
});
