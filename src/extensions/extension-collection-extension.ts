import { ITsHtmlExtension } from "./i-ts-html-extension";

/**
 * An extension that collects multiple extensions and proxies calls to them.
 */
export class ExtensionCollectionExtension implements Required<ITsHtmlExtension> {
	parseHtmlAttrAssignment = this.proxy("parseHtmlAttrAssignment");
	parseHtmlAttr = this.proxy("parseHtmlAttr");
	parseHtmlNode = this.proxy("parseHtmlNode");
	completionsForHtmlAttrs = this.proxy("completionsForHtmlAttrs");
	completionsForHtmlNodes = this.proxy("completionsForHtmlNodes");
	definitionAndBoundSpanForHtmlNode = this.proxy("definitionAndBoundSpanForHtmlNode");
	definitionAndBoundSpanForHtmlAttr = this.proxy("definitionAndBoundSpanForHtmlAttr");
	quickInfoForHtmlNode = this.proxy("quickInfoForHtmlNode");
	quickInfoForHtmlAttr = this.proxy("quickInfoForHtmlAttr");
	codeFixesForHtmlNode = this.proxy("codeFixesForHtmlNode");
	codeFixesForHtmlAttr = this.proxy("codeFixesForHtmlAttr");
	diagnosticsForHtmlNode = this.proxy("diagnosticsForHtmlNode");
	diagnosticsForHtmlAttr = this.proxy("diagnosticsForHtmlAttr");
	parseAttrName = this.proxy("parseAttrName");
	validateHtmlNode = this.proxy("validateHtmlNode");
	validateHtmlAttr = this.proxy("validateHtmlAttr");
	validateHtmlAttrAssignment = this.proxy("validateHtmlAttrAssignment");

	constructor(private extensions: ITsHtmlExtension[]) {}

	/**
	 * Adds an extension to the collection of extensions.
	 * @param extension
	 */
	addExtension(...extension: ITsHtmlExtension[]) {
		this.extensions.push(...extension);
	}

	/**
	 * Setup a proxy function.
	 * If the function returns an array: Collect all arrays into one.
	 * If the function returns a single item: Return it immediately.
	 * @param methodName
	 */
	private proxy<T extends keyof ITsHtmlExtension>(methodName: T): Required<ITsHtmlExtension>[T] {
		return (...args: any[]) => {
			let results: any[] | undefined = undefined;

			// Loop through all extensions to call the method with "methodName" if exists.
			for (let i = this.extensions.length - 1; i >= 0; i--) {
				const extension = this.extensions[i];

				const method = extension[methodName] as any | undefined;
				if (method != null) {
					const res = method(...args);

					// Returns a single value immediately.
					if (res != null && !Array.isArray(res)) {
						return res;
					}

					// Collect all arrays into one
					if (res != null) {
						results = results || [];
						results.push(...res);
					}
				}
			}

			return results;
		};
	}
}
