import { ALL_RULE_IDS, LitAnalyzerConfig } from "lit-analyzer";
import { join } from "path";
import { ColorProvider } from "./color-provider";
import * as vscode from "vscode";

const tsLitPluginId = "ts-lit-plugin";
const typeScriptExtensionId = "vscode.typescript-language-features";
const configurationSection = "lit-plugin";
const configurationExperimentalHtmlSection = "html.experimental";
const analyzeCommandId = "lit-plugin.analyze";

let defaultAnalyzeGlob = "src";

const colorProvider = new ColorProvider();

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	const extension = vscode.extensions.getExtension(typeScriptExtensionId);
	if (!extension) {
		return;
	}

	await extension.activate();
	if (!extension.exports || !extension.exports.getAPI) {
		return;
	}

	const api = extension.exports.getAPI(0);
	if (!api) {
		return;
	}

	// Subscribe to configuration change
	vscode.workspace.onDidChangeConfiguration(
		e => {
			if (e.affectsConfiguration(configurationSection) || e.affectsConfiguration(configurationExperimentalHtmlSection)) {
				synchronizeConfig(api);
			}
		},
		undefined,
		context.subscriptions
	);

	// Subscribe to the analyze command
	context.subscriptions.push(vscode.commands.registerCommand(analyzeCommandId, handleAnalyzeCommand));

	// Register a color provider
	const registration = vscode.languages.registerColorProvider(
		[
			{ scheme: "file", language: "typescript" },
			{ scheme: "file", language: "javascript" }
		],
		colorProvider
	);
	context.subscriptions.push(registration);

	synchronizeConfig(api);
}

function synchronizeConfig(api: { configurePlugin: Function }) {
	api.configurePlugin(tsLitPluginId, getConfig());
}

function getConfig(): Partial<LitAnalyzerConfig> {
	const config = vscode.workspace.getConfiguration(configurationSection);
	const outConfig: Partial<LitAnalyzerConfig> = {};

	// Set cwd
	outConfig.cwd = getCwd();

	// Deprecated values
	withConfigValue(config, "externalHtmlTagNames", value => {
		outConfig.globalTags = value;
	});
	withConfigValue(config, "externalHtmlTags", value => {
		outConfig.globalTags = value;
	});
	withConfigValue(config, "externalHtmlAttributes", value => {
		outConfig.globalAttributes = value;
	});
	// Just set these deprecated rules directly on the config object.
	// ts-lit-plugin will make sure that deprecated rules are mapped correctly to new rules
	[
		"skipSuggestions",
		"checkUnknownEvents",
		"skipUnknownTags",
		"skipUnknownAttributes",
		"skipUnknownProperties",
		"skipUnknownSlots",
		"skipMissingImports",
		"skipTypeChecking"
	].forEach(deprecatedRuleName => {
		withConfigValue(config, deprecatedRuleName, value => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(outConfig as any)[deprecatedRuleName] = value;
		});
	});

	// Values
	withConfigValue(config, "disable", value => {
		outConfig.disable = value;
	});
	withConfigValue(config, "logging", value => {
		outConfig.logging = value;
	});
	withConfigValue(config, "dontShowSuggestions", value => {
		outConfig.dontShowSuggestions = value;
	});
	withConfigValue(config, "strict", value => {
		outConfig.strict = value;
	});
	withConfigValue(config, "securitySystem", value => {
		outConfig.securitySystem = value;
	});
	withConfigValue(config, "maxProjectImportDepth", value => {
		outConfig.maxProjectImportDepth = value;
	});
	withConfigValue(config, "maxNodeModuleImportDepth", value => {
		outConfig.maxNodeModuleImportDepth = value;
	});
	// Template tags
	withConfigValue(config, "htmlTemplateTags", value => {
		outConfig.htmlTemplateTags = value;
	});
	withConfigValue(config, "cssTemplateTags", value => {
		outConfig.cssTemplateTags = value;
	});

	// Global
	withConfigValue(config, "globalEvents", value => {
		outConfig.globalEvents = value;
	});
	withConfigValue(config, "globalAttributes", value => {
		outConfig.globalAttributes = value;
	});
	withConfigValue(config, "globalTags", value => {
		outConfig.globalTags = value;
	});
	withConfigValue(config, "customHtmlData", value => {
		outConfig.customHtmlData = value;
	});

	// Experimental values from vscode
	const experimental = vscode.workspace.getConfiguration(configurationExperimentalHtmlSection, null);
	withConfigValue(experimental, "customData", value => {
		// Merge value from vscode with "lit-plugin.customHtmlData"
		const filePaths = (Array.isArray(value) ? value : [value]).map(path => (typeof path === "string" ? toWorkspacePath(path) : path));
		outConfig.customHtmlData = outConfig.customHtmlData == null ? filePaths : filePaths.concat(outConfig.customHtmlData as []);
	});

	// Apply rules
	const rules = outConfig.rules || {};

	ALL_RULE_IDS.forEach(ruleName => {
		withConfigValue(config, `rules.${ruleName}`, value => {
			rules[ruleName] = value;
		});
	});

	outConfig.rules = rules;

	return outConfig;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withConfigValue(config: vscode.WorkspaceConfiguration, key: string, withValue: (value: any) => void): void {
	const configSetting = config.inspect(key);
	if (!configSetting) {
		return;
	}

	// Make sure the user has actually set the value.
	// VS Code will return the default values instead of `undefined`, even if user has not don't set anything.
	if (
		typeof configSetting.globalValue === "undefined" &&
		typeof configSetting.workspaceFolderValue === "undefined" &&
		typeof configSetting.workspaceValue === "undefined"
	) {
		return;
	}

	const value = config.get(key, undefined);

	if (typeof value !== "undefined") {
		withValue(value);
	}
}

function toWorkspacePath(path: string): string {
	if (path.startsWith("/")) {
		return path;
	}

	return join(getCwd(), path);
}

function getCwd(): string {
	const folder = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
	return (folder && folder.uri.path) || process.cwd();
}

function handleAnalyzeCommand() {
	vscode.window
		.showInputBox({
			value: defaultAnalyzeGlob,
			prompt: "Please enter a directory/path/glob to analyze",
			placeHolder: "directory/path/glob"
		})
		.then((glob: string | undefined) => {
			if (glob == null) return;

			defaultAnalyzeGlob = glob;

			const cliCommand = `npx lit-analyzer "${glob}"`;
			const terminal = vscode.window.createTerminal("lit-analyzer");
			terminal.sendText(cliCommand, true);
			terminal.show(true);
		});
}
