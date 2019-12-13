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
	| "no-unintended-mixed-binding"
	| "no-invalid-boolean-binding"
	| "no-expressionless-property-binding"
	| "no-noncallable-event-binding"
	| "no-boolean-in-attribute-binding"
	| "no-complex-attribute-binding"
	| "no-nullable-attribute-binding"
	| "no-incompatible-type-binding"
	| "no-invalid-directive-binding"
	| "no-incompatible-property-type"
	| "no-unknown-property-converter"
	| "no-invalid-attribute-name"
	| "no-invalid-tag-name"
	| "no-invalid-css";

export const ALL_RULE_NAMES: LitAnalyzerRuleName[] = [
	"no-unknown-tag-name",
	"no-missing-import",
	"no-unclosed-tag",
	"no-unknown-attribute",
	"no-unknown-property",
	"no-unknown-event",
	"no-unknown-slot",
	"no-unintended-mixed-binding",
	"no-invalid-boolean-binding",
	"no-expressionless-property-binding",
	"no-noncallable-event-binding",
	"no-boolean-in-attribute-binding",
	"no-complex-attribute-binding",
	"no-nullable-attribute-binding",
	"no-incompatible-type-binding",
	"no-invalid-directive-binding",
	"no-incompatible-property-type",
	"no-unknown-property-converter",
	"no-invalid-attribute-name",
	"no-invalid-tag-name",
	"no-invalid-css"
];

export type LitAnalyzerRuleSeverity = "off" | "warn" | "warning" | "error" | 0 | 1 | 2 | true | false;

export type LitAnalyzerRules = Partial<Record<LitAnalyzerRuleName, LitAnalyzerRuleSeverity | [LitAnalyzerRuleSeverity]>>;

const DEFAULT_RULES_NOSTRICT: Required<LitAnalyzerRules> = {
	"no-unknown-tag-name": "off",
	"no-missing-import": "off",
	"no-unclosed-tag": "warn",
	"no-unknown-attribute": "off",
	"no-unknown-property": "off",
	"no-unknown-event": "off",
	"no-unknown-slot": "off",
	"no-unintended-mixed-binding": "warn",
	"no-invalid-boolean-binding": "error",
	"no-expressionless-property-binding": "error",
	"no-noncallable-event-binding": "error",
	"no-boolean-in-attribute-binding": "error",
	"no-complex-attribute-binding": "error",
	"no-nullable-attribute-binding": "error",
	"no-incompatible-type-binding": "error",
	"no-invalid-directive-binding": "error",
	"no-incompatible-property-type": "error",
	"no-unknown-property-converter": "error",
	"no-invalid-attribute-name": "error",
	"no-invalid-tag-name": "error",
	"no-invalid-css": "warn"
};

const DEFAULT_RULES_STRICT: Required<LitAnalyzerRules> = {
	"no-unknown-tag-name": "warn",
	"no-missing-import": "warn",
	"no-unclosed-tag": "error",
	"no-unknown-attribute": "warn",
	"no-unknown-property": "warn",
	"no-unknown-event": "off",
	"no-unknown-slot": "warn",
	"no-unintended-mixed-binding": "warn",
	"no-invalid-boolean-binding": "error",
	"no-expressionless-property-binding": "error",
	"no-noncallable-event-binding": "error",
	"no-boolean-in-attribute-binding": "error",
	"no-complex-attribute-binding": "error",
	"no-nullable-attribute-binding": "error",
	"no-incompatible-type-binding": "error",
	"no-invalid-directive-binding": "error",
	"no-incompatible-property-type": "error",
	"no-unknown-property-converter": "error",
	"no-invalid-attribute-name": "error",
	"no-invalid-tag-name": "error",
	"no-invalid-css": "error"
};

export function ruleSeverity(rules: LitAnalyzerConfig | LitAnalyzerRules, ruleName: LitAnalyzerRuleName): LitAnalyzerRuleSeverity {
	if ("rules" in rules) return ruleSeverity(rules.rules, ruleName);

	const ruleConfig = rules[ruleName] || "off";
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

export type LitAnalyzerLogging = "off" | "error" | "warn" | "debug" | "verbose";

export type LitSecuritySystem = "off" | "ClosureSafeTypes";

export interface LitAnalyzerConfig {
	strict: boolean;
	rules: LitAnalyzerRules;
	securitySystem: LitSecuritySystem;

	disable: boolean;
	logging: LitAnalyzerLogging;
	cwd: string;
	format: { disable: boolean };

	htmlTemplateTags: string[];
	cssTemplateTags: string[];

	dontShowSuggestions: boolean;
	dontSuggestConfigChanges: boolean;

	globalTags: string[];
	globalAttributes: string[];
	globalEvents: string[];
	customHtmlData: (string | HtmlData)[] | string | HtmlData;
}

function expectNever(never: never) {
	return never;
}

/**
 * Parses a partial user configuration and returns a full options object with defaults.
 * @param userOptions
 */
export function makeConfig(userOptions: Partial<LitAnalyzerConfig> = {}): LitAnalyzerConfig {
	let securitySystem = userOptions.securitySystem || "off";
	switch (securitySystem) {
		case "off":
		case "ClosureSafeTypes":
			break; // legal values
		default:
			// Log an error here? Or maybe throw?
			expectNever(securitySystem);
			// Unknown values get converted to "off".
			securitySystem = "off";
	}

	return {
		strict: userOptions.strict || false,
		rules: makeRules(userOptions),
		securitySystem: userOptions.securitySystem || "off",

		disable: userOptions.disable || false,
		logging: userOptions.logging || "off",
		cwd: userOptions.cwd || process.cwd(),
		format: {
			disable: userOptions.format != null ? userOptions.format.disable : undefined || false // always disable formating for now
		},
		dontSuggestConfigChanges: userOptions.dontSuggestConfigChanges || false,
		dontShowSuggestions: userOptions.dontShowSuggestions || getDeprecatedOption(userOptions, "skipSuggestions") || false,

		// Template tags
		htmlTemplateTags: userOptions.htmlTemplateTags || ["html", "raw"],
		cssTemplateTags: userOptions.cssTemplateTags || ["css"],

		// Global additions
		globalTags: userOptions.globalTags || getDeprecatedOption(userOptions, "externalHtmlTagNames") || [],
		globalAttributes: userOptions.globalAttributes || [],
		globalEvents: userOptions.globalEvents || [],
		customHtmlData: userOptions.customHtmlData || []
	};
}

function getDeprecatedOption<T>(userOptions: Partial<LitAnalyzerConfig>, name: string): T | undefined {
	return (userOptions as Record<string, T>)[name];
}

export function makeRules(userOptions: Partial<LitAnalyzerConfig>): LitAnalyzerRules {
	const mappedDeprecatedRules = getDeprecatedMappedRules(userOptions);
	const defaultRules = getDefaultRules(userOptions);
	const userRules = getUserRules(userOptions);

	return Object.assign({}, defaultRules, mappedDeprecatedRules, userRules);
}

function getUserRules(userOptions: Partial<LitAnalyzerConfig>): LitAnalyzerRules {
	return userOptions.rules || {};
}

function getDefaultRules(userOptions: Partial<LitAnalyzerConfig>): LitAnalyzerRules {
	const isStrict = userOptions.strict || false;

	if (isStrict) {
		return DEFAULT_RULES_STRICT;
	} else {
		return DEFAULT_RULES_NOSTRICT;
	}
}

function getDeprecatedMappedRules(userOptions: Partial<LitAnalyzerConfig>): LitAnalyzerRules {
	const mappedDeprecatedRules: LitAnalyzerRules = {};

	if (getDeprecatedOption(userOptions, "skipMissingImports") === true) {
		mappedDeprecatedRules["no-missing-import"] = "off";
	}

	if (getDeprecatedOption(userOptions, "skipUnknownTags") === true) {
		mappedDeprecatedRules["no-unknown-tag-name"] = "off";
	}

	if (getDeprecatedOption(userOptions, "skipUnknownAttributes") === true) {
		mappedDeprecatedRules["no-unknown-attribute"] = "off";
	}

	if (getDeprecatedOption(userOptions, "skipUnknownProperties") === true) {
		mappedDeprecatedRules["no-unknown-property"] = "off";
	}

	if (getDeprecatedOption(userOptions, "skipUnknownSlots") === true) {
		mappedDeprecatedRules["no-unknown-slot"] = "off";
	}

	if (getDeprecatedOption(userOptions, "skipCssChecks") === true) {
		mappedDeprecatedRules["no-invalid-css"] = "off";
	}

	if (getDeprecatedOption(userOptions, "checkUnknownEvents") === true) {
		mappedDeprecatedRules["no-unknown-event"] = "warn";
	}

	if (getDeprecatedOption(userOptions, "skipTypeChecking") === true) {
		Object.assign(mappedDeprecatedRules, {
			"no-invalid-boolean-binding": "off",
			"no-noncallable-event-binding": "off",
			"no-boolean-in-attribute-binding": "off",
			"no-complex-attribute-binding": "off",
			"no-nullable-attribute-binding": "off",
			"no-incompatible-type-binding": "off",
			"no-incompatible-property-type": "off"
		} as LitAnalyzerRules);
	}

	return mappedDeprecatedRules;
}
