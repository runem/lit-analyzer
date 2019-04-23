import { HtmlData } from "./parse/parse-html-data/html-data-tag";

export interface LitAnalyzerConfig {
	disable: boolean;
	verbose: boolean;
	cwd: string;
	format: { disable: boolean };

	htmlTemplateTags: string[];
	cssTemplateTags: string[];

	checkUnknownEvents: boolean;

	skipSuggestions: boolean;
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
 * Parses a partial user configuration and returns a full options object with defaults.
 * @param userOptions
 */
export function makeConfig(userOptions: Partial<LitAnalyzerConfig>): LitAnalyzerConfig {
	return {
		disable: userOptions.disable || false,
		verbose: userOptions.verbose || false,
		cwd: userOptions.cwd || process.cwd(),
		format: {
			disable: userOptions.format != null ? userOptions.format.disable : undefined || false
		},
		// Template tags
		htmlTemplateTags: userOptions.htmlTemplateTags || ["html", "raw"],
		cssTemplateTags: userOptions.cssTemplateTags || ["css"],
		// Global additions
		globalTags: userOptions.globalTags || (userOptions as any).externalHtmlTagNames || [],
		globalAttributes: userOptions.globalAttributes || [],
		globalEvents: userOptions.globalEvents || [],
		customHtmlData: userOptions.customHtmlData || [],
		// Skip
		skipSuggestions: userOptions.skipSuggestions || false,
		skipMissingImports: userOptions.skipMissingImports || false,
		skipUnknownTags: userOptions.skipUnknownTags || false,
		skipUnknownAttributes: userOptions.skipUnknownAttributes || false,
		skipUnknownProperties: userOptions.skipUnknownProperties || false,
		skipUnknownSlots: userOptions.skipUnknownSlots || false,
		skipTypeChecking: userOptions.skipTypeChecking || false,
		// Checks
		checkUnknownEvents: userOptions.checkUnknownEvents || false
	};
}
