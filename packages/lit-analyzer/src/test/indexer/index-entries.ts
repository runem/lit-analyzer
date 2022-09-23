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

				declare global {
					interface HTMLElementTagNameMap {
						'some-element': SomeElement;
					}
				}

				const nothtml = x => x;
				nothtml\`<some-element></some-element>\`;
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
 * tag name `tagName` that is defined by a class named `className` in
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

	const { target } = entry.definition;
	if (Array.isArray(target)) {
		// TODO: What about single item arrays?
		throw new Error("The definition should have a single target.");
	}

	if (target.kind !== "node") {
		throw new Error("The definition target should be a `LitDefinitionTargetNode`.");
	}

	assertIdentifiesClass({ t, identifier: target.node, sourceFile, className });
};

tsTest("`indexFile` creates an `HtmlNodeIndexEntry` for an element defined in the same file.", t => {
	const { indexEntries, sourceFile } = getIndexEntries([
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

tsTest("`indexFile` creates an `HtmlNodeIndexEntry` for an element defined in a different file.", t => {
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
			fileName: "some-element.js",
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
		sourceFile: program.getSourceFile("some-element.js"),
		tagName: "some-element",
		className: "SomeElement"
	});
});

tsTest("`indexFile` does not create `HtmlAttrNodeIndexEntry`s for attributes that don't map to known properties.", t => {
	const { indexEntries } = getIndexEntries([
		{
			fileName: "main.js",
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
 * `kind` that targets a `LitDefinitionTargetNode`.
 */
const assertIsAttrRefAndGetTargetNode = ({
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

	const { target } = entry.definition;
	if (Array.isArray(target)) {
		// TODO: What about single item arrays?
		throw new Error("The definition should have a single target.");
	}

	if (target.kind !== "node") {
		throw new Error("The definition target should be a `LitDefinitionTargetNode`.");
	}

	return target.node;
};

tsTest("`indexFile` creates an `HtmlAttrNodeIndexEntry` for a property defined in the static `properties` getter.", t => {
	const { isClassDeclaration, isIdentifier, isPropertyAssignment } = getCurrentTsModule();

	const { indexEntries, sourceFile } = getIndexEntries([
		{
			fileName: "main.js",
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

	const targetNode = assertIsAttrRefAndGetTargetNode({
		t,
		entry: entries[0],
		name: "prop",
		kind: HtmlNodeAttrKind.PROPERTY
	});

	t.is(targetNode.getSourceFile(), sourceFile, "The target node is not in the expected source file.");

	if (!isPropertyAssignment(targetNode)) {
		throw new Error("The target node should be a `PropertyAssignment`.");
	}

	const { name } = targetNode;
	if (!isIdentifier(name)) {
		throw new Error("The target node's name should be an `Identifier`.");
	}
	t.is(name.text, "prop", "The target node's name should be `prop`.");

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
		className: "SomeElement"
	});
});

tsTest("`indexFile` creates an `HtmlAttrNodeIndexEntry` for a property defined with a class field.", t => {
	const { isClassDeclaration, isIdentifier } = getCurrentTsModule();

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

	const targetNode = assertIsAttrRefAndGetTargetNode({
		t,
		entry: entries[0],
		name: "prop",
		kind: HtmlNodeAttrKind.PROPERTY
	});

	t.is(targetNode.getSourceFile(), sourceFile, "The target node is not in the expected source file.");

	if (!isIdentifier(targetNode)) {
		throw new Error("The target node should be an `Identifier`.");
	}
	t.is(targetNode.text, "prop", "The target node's name should be `prop`.");

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
		className: "SomeElement"
	});
});
