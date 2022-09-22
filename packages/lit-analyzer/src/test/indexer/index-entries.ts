import { getCurrentTsModule, tsTest } from "../helpers/ts-test.js";
import { getIndexEntries } from "../helpers/analyze.js";

tsTest("`indexFile` creates a `HtmlNodeIndexEntry` for an element defined in the same script.", t => {
	const { isClassDeclaration, isIdentifier } = getCurrentTsModule();

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

	const entry = entries[0];
	if (entry.kind !== "NODE-REFERENCE") {
		throw new Error("The entry is not a reference from a non-attribute node.");
	}

	const { node: entryNode } = entry;
	t.is(entryNode.kind, "NODE");
	t.is(entryNode.tagName, "some-element");
	if (Array.isArray(entry.definition.target)) {
		// TODO: What about single item arrays?
		throw new Error("Expected a single definition target.");
	}

	const { target } = entry.definition;
	if (target.kind !== "node") {
		throw new Error("The definition target should be a `LitDefinitionTargetNode`.");
	}

	const { node: targetNode } = target;
	if (!isIdentifier(targetNode)) {
		throw new Error("The target node should be an identifier.");
	}

	t.is(targetNode.getText(sourceFile), "SomeElement", "The target node's identifier should be `SomeElement`.");

	const { parent: targetNodeParent } = targetNode;
	if (!isClassDeclaration(targetNodeParent)) {
		throw new Error("The target node's parent should be a class declaration.");
	}

	t.is(targetNodeParent.name, targetNode, "The target node should be it's class definition's name.");
});
