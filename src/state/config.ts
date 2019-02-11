export interface Config {
	disable: boolean;
	verbose: boolean;
	format: { disable: boolean };
	htmlTemplateTags: string[];
	externalHtmlTagNames: string[];
	skipMissingImports: boolean;
	skipUnknownHtmlTags: boolean;
	skipUnknownHtmlAttributes: boolean;
	skipTypeChecking: boolean;
}

/**
 * Parses a partial user config and returns a full config object with defaults.
 * @param userConfig
 */
export function makeConfig(userConfig: Partial<Config>): Config {
	return {
		disable: userConfig.disable || false,
		verbose: userConfig.verbose || false,
		format: {
			disable: userConfig.format != null ? userConfig.format.disable : undefined || false
		},
		htmlTemplateTags: userConfig.htmlTemplateTags || ["html", "raw"],
		externalHtmlTagNames: userConfig.externalHtmlTagNames || [],
		skipMissingImports: userConfig.skipMissingImports || false,
		skipUnknownHtmlTags: userConfig.skipUnknownHtmlTags || false,
		skipUnknownHtmlAttributes: userConfig.skipUnknownHtmlAttributes || false,
		skipTypeChecking: userConfig.skipTypeChecking || false
	};
}
