import { ITsHtmlExtension } from "./i-ts-html-extension";

/**
 * An extension that collects multiple extensions and proxies calls to them.
 */
export class ExtensionCollectionExtension implements Required<ITsHtmlExtension> {
	definitionAndBoundSpanForHtmlNode = this.proxy("definitionAndBoundSpanForHtmlNode");
	definitionAndBoundSpanForHtmlAttr = this.proxy("definitionAndBoundSpanForHtmlAttr");

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
