export type HtmlFlavor = "lit-html" | "vanilla";

export interface IConfig {
	verbose: boolean;
	flavor: HtmlFlavor;
	tags: string[];
	externalTagNames: string[];
	ignoreImports: boolean;
}

/**
 * Parses a partial user config and returns a full config object with defaults.
 * @param userConfig
 */
export function makeConfig(userConfig: Partial<IConfig>): IConfig {
	return {
		verbose: userConfig.verbose === true || false,
		flavor: userConfig.flavor || "lit-html",
		tags: userConfig.tags || ["html", "raw"],
		externalTagNames: userConfig.externalTagNames || [],
		ignoreImports: userConfig.ignoreImports || false
	};
}
