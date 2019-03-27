import { HtmlData } from "../parsing/parse-html-data/html-data-tag";

export interface Config {
	disable: boolean;
	verbose: boolean;
	format: { disable: boolean };

	htmlTemplateTags: string[];
	cssTemplateTags: string[];

	skipMissingImports: boolean;
	skipUnknownHtmlTags: boolean;
	skipUnknownHtmlAttributes: boolean;
	skipTypeChecking: boolean;

	globalHtmlTags: string[];
	globalHtmlAttributes: string[];
	webComponents?: HtmlData;
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
		cssTemplateTags: userConfig.cssTemplateTags || ["css"],
		globalHtmlTags: userConfig.globalHtmlTags || (userConfig as any).externalHtmlTagNames || [],
		globalHtmlAttributes: userConfig.globalHtmlAttributes || [],
		skipMissingImports: userConfig.skipMissingImports || false,
		skipUnknownHtmlTags: userConfig.skipUnknownHtmlTags || false,
		skipUnknownHtmlAttributes: userConfig.skipUnknownHtmlAttributes || false,
		skipTypeChecking: userConfig.skipTypeChecking || false,
		webComponents: userConfig.webComponents
	};
}
