import { ExecutionContext } from "ava";
import { SourceFile } from "typescript";

import { getCurrentTsModule, tsTest } from "../helpers/ts-test.js";
import { getIndexEntries } from "../helpers/analyze.js";

import { LitIndexEntry } from "../../lib/analyze/document-analyzer/html/lit-html-document-analyzer.js";

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
 * Asserts that `entry` is a `LitIndexEntry` that describes an element with tag
 * name `tagName` that is defined by a class named `className` in `sourceFile`.
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
	sourceFile: SourceFile | undefined;
	tagName: string;
	className: string;
}) => {
	const { isClassDeclaration, isIdentifier } = getCurrentTsModule();
	if (entry.kind !== "NODE-REFERENCE") {
		throw new Error("The entry does not originate from an element.");
	}

	const { node: entryNode } = entry;
	t.is(entryNode.kind, "NODE", "The entry should not originate from an `<svg>` or `<style>`.");
	t.is(entryNode.tagName, tagName, `The origin element is not a \`<${tagName}>\`.`);

	const { target } = entry.definition;
	if (Array.isArray(target)) {
		// TODO: What about single item arrays?
		throw new Error("The definition should have a single target.");
	}

	if (target.kind !== "node") {
		throw new Error("The definition target should be a `LitDefinitionTargetNode`.");
	}

	const { node: targetNode } = target;
	if (!isIdentifier(targetNode)) {
		throw new Error("The definition target's node should be an identifier.");
	}

	t.is(targetNode.getSourceFile(), sourceFile, "The identifier is not in the expected source file.");
	t.is(targetNode.text, className, `The identifier's text should be \`${className}\`.`);

	const { parent: targetNodeParent } = targetNode;
	if (!isClassDeclaration(targetNodeParent)) {
		throw new Error("The target node's parent should be a class declaration.");
	}

	t.is(targetNodeParent.name, targetNode, "The target node should be it's class definition's name.");
};

tsTest("`indexFile` creates a `HtmlNodeIndexEntry` for an element defined in the same file.", t => {
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

tsTest("`indexFile` creates a `HtmlNodeIndexEntry` for an element defined in a different file.", t => {
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
			entry: true,
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
