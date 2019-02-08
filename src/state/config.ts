export interface IConfig {
	verbose: boolean;
	htmlTemplateTags: string[];
	externalHtmlTags: string[];
	ignoreMissingImports: boolean;
	ignoreUnknownHtmlTags: boolean;
	ignoreUnknownHtmlAttributes: boolean;
}

/**
 * Parses a partial user config and returns a full config object with defaults.
 * @param userConfig
 */
export function makeConfig(userConfig: Partial<IConfig>): IConfig {
	return {
		verbose: userConfig.verbose || false,
		htmlTemplateTags: userConfig.htmlTemplateTags || ["html", "raw"],
		externalHtmlTags: userConfig.externalHtmlTags || [],
		ignoreMissingImports: userConfig.ignoreMissingImports || false,
		ignoreUnknownHtmlTags: userConfig.ignoreUnknownHtmlTags || false,
		ignoreUnknownHtmlAttributes: userConfig.ignoreUnknownHtmlAttributes || false
	};
}
