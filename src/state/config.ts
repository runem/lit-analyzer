import { HtmlData } from "../parsing/parse-html-data/html-data-tag";

export interface Config {
	disable: boolean;
	verbose: boolean;
	format: { disable: boolean };
	noSuggestions: boolean;

	htmlTemplateTags: string[];
	cssTemplateTags: string[];

	checkUnknownEvents: boolean;

	skipUnknownTags: boolean;
	skipUnknownAttributes: boolean;
	skipUnknownProperties: boolean;
	skipUnknownSlots: boolean;
	skipTypeChecking: boolean;
	skipMissingImports: boolean;

	globalTags: string[];
	globalAttributes: string[];
	globalEvents: string[];
	customHtmlData: (string | HtmlData)[] | string | HtmlData;
}

/**
 * Parses a partial user config and returns a full config object with defaults.
 * @param userConfig
 */
export function makeConfig(userConfig: Partial<Config>): Config {
	return {
		disable: userConfig.disable || false,
		verbose: userConfig.verbose || false,
		noSuggestions: userConfig.noSuggestions || false,
		format: {
			disable: userConfig.format != null ? userConfig.format.disable : undefined || false
		},
		// Template tags
		htmlTemplateTags: userConfig.htmlTemplateTags || ["html", "raw"],
		cssTemplateTags: userConfig.cssTemplateTags || ["css"],
		// Global additions
		globalTags: userConfig.globalTags || (userConfig as any).externalHtmlTagNames || [],
		globalAttributes: userConfig.globalAttributes || [],
		globalEvents: userConfig.globalEvents || [],
		customHtmlData: userConfig.customHtmlData || [],
		// Skip
		skipMissingImports: userConfig.skipMissingImports || false,
		skipUnknownTags: userConfig.skipUnknownTags || false,
		skipUnknownAttributes: userConfig.skipUnknownAttributes || false,
		skipUnknownProperties: userConfig.skipUnknownProperties || false,
		skipUnknownSlots: userConfig.skipUnknownSlots || false,
		skipTypeChecking: userConfig.skipTypeChecking || false,
		// Checks
		checkUnknownEvents: userConfig.checkUnknownEvents || false
	};
}
