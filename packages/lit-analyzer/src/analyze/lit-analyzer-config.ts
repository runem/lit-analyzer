import { HTMLDataV1 } from "vscode-html-languageservice";
import { LitDiagnosticSeverity } from "./types/lit-diagnostic";

export type LitAnalyzerRuleSeverity = "on" | "off" | "warn" | "warning" | "error" | 0 | 1 | 2 | true | false;

export type LitAnalyzerRuleId =
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
	| "no-invalid-attribute-name"
	| "no-invalid-tag-name"
	| "no-invalid-css"
	| "no-property-visibility-mismatch"
	| "no-legacy-attribute"
	| "no-missing-element-type-definition";

export type LitAnalyzerRules = Partial<Record<LitAnalyzerRuleId, LitAnalyzerRuleSeverity | [LitAnalyzerRuleSeverity]>>;

/**
 * The values of this map are tuples where 1st element is
 * non-strict severity and 2nd element is "strict" severity
 */
const DEFAULT_RULES_SEVERITY: Record<LitAnalyzerRuleId, [LitAnalyzerRuleSeverity, LitAnalyzerRuleSeverity]> = {
	"no-unknown-tag-name": ["off", "warn"],
	"no-missing-import": ["off", "warn"],
	"no-unclosed-tag": ["warn", "error"],
	"no-unknown-attribute": ["off", "warn"],
	"no-unknown-property": ["off", "warn"],
	"no-unknown-event": ["off", "off"],
	"no-unknown-slot": ["off", "warn"],
	"no-unintended-mixed-binding": ["warn", "warn"],
	"no-invalid-boolean-binding": ["error", "error"],
	"no-expressionless-property-binding": ["error", "error"],
	"no-noncallable-event-binding": ["error", "error"],
	"no-boolean-in-attribute-binding": ["error", "error"],
	"no-complex-attribute-binding": ["error", "error"],
	"no-nullable-attribute-binding": ["error", "error"],
	"no-incompatible-type-binding": ["error", "error"],
	"no-invalid-directive-binding": ["error", "error"],
	"no-incompatible-property-type": ["warn", "error"],
	"no-invalid-attribute-name": ["error", "error"],
	"no-invalid-tag-name": ["error", "error"],
	"no-invalid-css": ["warn", "error"],
	"no-property-visibility-mismatch": ["off", "warning"],
	"no-legacy-attribute": ["off", "off"],
	"no-missing-element-type-definition": ["off", "off"]
};

// All rule names order alphabetically
export const ALL_RULE_IDS = Object.keys(DEFAULT_RULES_SEVERITY).sort() as LitAnalyzerRuleId[];

// This map is based on alphabetic order, so it assumed that
//   these rule codes are changed when new rules are added and
//   should not be depended on by the user.
// The user should always use the "rule id" string.
// Consider if this map should be manually maintained in the future.
export const RULE_ID_CODE_MAP = ALL_RULE_IDS.reduce((acc, ruleId, i) => {
	acc[ruleId] = i + 1;
	return acc;
}, {} as Record<LitAnalyzerRuleId, number>);

export function ruleIdCode(ruleId: LitAnalyzerRuleId): number {
	return RULE_ID_CODE_MAP[ruleId];
}

export function ruleSeverity(rules: LitAnalyzerConfig | LitAnalyzerRules, ruleId: LitAnalyzerRuleId): LitAnalyzerRuleSeverity {
	if ("rules" in rules) return ruleSeverity(rules.rules, ruleId);

	const ruleConfig = rules[ruleId] || "off";
	return Array.isArray(ruleConfig) ? ruleConfig[0] : ruleConfig;
}

export function isRuleDisabled(config: LitAnalyzerConfig, ruleId: LitAnalyzerRuleId): boolean {
	return ["off", 0, false].includes(ruleSeverity(config, ruleId));
}

export function isRuleEnabled(config: LitAnalyzerConfig, ruleId: LitAnalyzerRuleId): boolean {
	return !isRuleDisabled(config, ruleId);
}

export function litDiagnosticRuleSeverity(config: LitAnalyzerConfig, ruleId: LitAnalyzerRuleId): LitDiagnosticSeverity {
	switch (ruleSeverity(config, ruleId)) {
		case "off":
		case false:
		case 0:
			return "warning";

		case "warn":
		case "warning":
		case true:
		case "on":
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
	dontShowSuggestions: boolean;
	dontSuggestConfigChanges: boolean;
	maxNodeModuleImportDepth: number;
	maxProjectImportDepth: number;

	htmlTemplateTags: string[];
	cssTemplateTags: string[];

	globalTags: string[];
	globalAttributes: string[];
	globalEvents: string[];
	customHtmlData: (string | HTMLDataV1)[] | string | HTMLDataV1;
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
		maxProjectImportDepth: parseImportDepth(userOptions.maxProjectImportDepth, Infinity),
		maxNodeModuleImportDepth: parseImportDepth(userOptions.maxNodeModuleImportDepth, 1),

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

/*function getDeprecatedRule(userOptions: Partial<LitAnalyzerConfig>, name: string): LitAnalyzerRuleSeverity | undefined {
	return userOptions.rules?.[name as never];
}*/

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

	return ALL_RULE_IDS.reduce((acc, ruleId) => {
		const severities = DEFAULT_RULES_SEVERITY[ruleId];
		acc[ruleId] = isStrict ? severities[1] : severities[0];
		return acc;
	}, ({} as unknown) as LitAnalyzerRules);
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

/**
 * Parses dependency traversal depth from configuration.
 * The number -1 (as well as any other negative number) gets parsed into the number Infinity.
 * @param value
 * @param defaultValue
 */
function parseImportDepth(value: number | undefined, defaultValue: number): number {
	if (value != null) {
		return value < 0 ? Infinity : value;
	} else {
		return defaultValue;
	}
}
