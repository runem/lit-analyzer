export interface Config {
	verbose: boolean;
	htmlTemplateTags: string[];
	externalHtmlTags: string[];
	skipMissingImports: boolean;
	skipUnknownHtmlTags: boolean;
	skipUnknownHtmlAttributes: boolean;
}

/**
 * Parses a partial user config and returns a full config object with defaults.
 * @param userConfig
 */
export function makeConfig(userConfig: Partial<Config>): Config {
	return {
		verbose: userConfig.verbose || false,
		htmlTemplateTags: userConfig.htmlTemplateTags || ["html", "raw"],
		externalHtmlTags: userConfig.externalHtmlTags || [],
		skipMissingImports: userConfig.skipMissingImports || false,
		skipUnknownHtmlTags: userConfig.skipUnknownHtmlTags || false,
		skipUnknownHtmlAttributes: userConfig.skipUnknownHtmlAttributes || false
	};
}
