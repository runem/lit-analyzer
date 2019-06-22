import { HtmlData } from "./parse/parse-html-data/html-data-tag";
import { LitDiagnosticSeverity } from "./types/lit-diagnostic";

export type LitAnalyzerRuleName =
	| "no-unknown-tag-name"
	| "no-missing-import"
	| "no-unclosed-tag"
	| "no-unknown-attribute"
	| "no-unknown-property"
	| "no-unknown-event"
	| "no-unknown-slot"
	| "no-invalid-boolean-binding"
	| "no-expressionless-property-binding"
	| "no-noncallable-event-binding"
	| "no-boolean-in-attribute-binding"
	| "no-complex-attribute-binding"
	| "no-nullable-attribute-binding"
	| "no-incompatible-type-binding"
	| "no-invalid-directive-binding"
	| "no-incompatible-lit-element-property-type"
	| "no-unknown-lit-element-property-type"
	| "no-invalid-attribute-name"
	| "no-invalid-tag-name";

export type LitAnalyzerRuleSeverity = "off" | "warn" | "warning" | "error" | 0 | 1 | 2 | true | false;

export type LitAnalyzerRules = Partial<Record<LitAnalyzerRuleName, LitAnalyzerRuleSeverity | [LitAnalyzerRuleSeverity]>>;

export const DEFAULT_RULES: Required<LitAnalyzerRules> = {
	"no-unknown-tag-name": "error",
	"no-missing-import": "error",
	"no-unclosed-tag": "error",
	"no-unknown-attribute": "error",
	"no-unknown-property": "error",
	"no-unknown-event": "off",
	"no-unknown-slot": "error",
	"no-invalid-boolean-binding": "error",
	"no-expressionless-property-binding": "error",
	"no-noncallable-event-binding": "error",
	"no-boolean-in-attribute-binding": "error",
	"no-complex-attribute-binding": "error",
	"no-nullable-attribute-binding": "error",
	"no-incompatible-type-binding": "error",
	"no-invalid-directive-binding": "error",
	"no-incompatible-lit-element-property-type": "error",
	"no-unknown-lit-element-property-type": "error",
	"no-invalid-attribute-name": "error",
	"no-invalid-tag-name": "error"
};

export function ruleSeverity(rules: LitAnalyzerConfig | LitAnalyzerRules, ruleName: LitAnalyzerRuleName): LitAnalyzerRuleSeverity {
	if ("rules" in rules) return ruleSeverity(rules.rules, ruleName);

	let ruleConfig = rules[ruleName] || "off";
	return Array.isArray(ruleConfig) ? ruleConfig[0] : ruleConfig;
}

export function isRuleDisabled(config: LitAnalyzerConfig, ruleName: LitAnalyzerRuleName): boolean {
	return ["off", 0, false].includes(ruleSeverity(config, ruleName));
}

export function isRuleEnabled(config: LitAnalyzerConfig, ruleName: LitAnalyzerRuleName): boolean {
	return !isRuleDisabled(config, ruleName);
}

export function litDiagnosticRuleSeverity(config: LitAnalyzerConfig, ruleName: LitAnalyzerRuleName): LitDiagnosticSeverity {
	switch (ruleSeverity(config, ruleName)) {
		case "off":
		case false:
		case 0:
			return "warning";

		case "warn":
		case "warning":
		case true:
		case 1:
			return "warning";

		case "error":
		case 2:
			return "error";
	}
}

export interface LitAnalyzerConfig {
	rules: LitAnalyzerRules;

	disable: boolean;
	verbose: boolean;
	cwd: string;
	format: { disable: boolean };

	htmlTemplateTags: string[];
	cssTemplateTags: string[];

	skipSuggestions: boolean;

	globalTags: string[];
	globalAttributes: string[];
	globalEvents: string[];
	customHtmlData: (string | HtmlData)[] | string | HtmlData;
}

/**
 * Parses a partial user configuration and returns a full options object with defaults.
 * @param userOptions
 */
export function makeConfig(userOptions: Partial<LitAnalyzerConfig> = {}): LitAnalyzerConfig {
	const mappedDeprecatedRules: LitAnalyzerRules = {};

	if ((userOptions as any)["skipMissingImports"] === true) {
		mappedDeprecatedRules["no-missing-import"] = "off";
	}

	if ((userOptions as any)["skipUnknownTags"] === true) {
		mappedDeprecatedRules["no-unknown-tag-name"] = "off";
	}

	if ((userOptions as any)["skipUnknownAttributes"] === true) {
		mappedDeprecatedRules["no-unknown-attribute"] = "off";
	}

	if ((userOptions as any)["skipUnknownProperties"] === true) {
		mappedDeprecatedRules["no-unknown-property"] = "off";
	}

	if ((userOptions as any)["skipUnknownSlots"] === true) {
		mappedDeprecatedRules["no-unknown-slot"] = "off";
	}

	if ((userOptions as any)["checkUnknownEvents"] === true) {
		mappedDeprecatedRules["no-unknown-event"] = "warn";
	}

	if ((userOptions as any)["skipTypeChecking"] === true) {
		Object.assign(mappedDeprecatedRules, {
			"no-invalid-boolean-binding": "off",
			"no-noncallable-event-binding": "off",
			"no-boolean-in-attribute-binding": "off",
			"no-complex-attribute-binding": "off",
			"no-nullable-attribute-binding": "off",
			"no-incompatible-type-binding": "off"
		} as LitAnalyzerRules);
	}

	return {
		rules: Object.assign({}, DEFAULT_RULES, mappedDeprecatedRules, userOptions.rules || {}),

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
		skipSuggestions: userOptions.skipSuggestions || false
		//skipMissingImports: userOptions.skipMissingImports || false,
		//skipUnknownTags: userOptions.skipUnknownTags || false,
		//skipUnknownAttributes: userOptions.skipUnknownAttributes || false,
		//skipUnknownProperties: userOptions.skipUnknownProperties || false,
		//skipUnknownSlots: userOptions.skipUnknownSlots || false,
		//skipTypeChecking: userOptions.skipTypeChecking || false,
		// Checks
		//checkUnknownEvents: userOptions.checkUnknownEvents || false
	};
}
