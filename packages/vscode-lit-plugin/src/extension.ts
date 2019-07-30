import { join } from "path";
import * as vscode from "vscode";

const tsLitPluginId = "ts-lit-plugin";
const typeScriptExtensionId = "vscode.typescript-language-features";
const configurationSection = "lit-plugin";
const configurationExperimentalHtmlSection = "html.experimental";
const analyzeCommandId = "lit-plugin.analyze";

let defaultAnalyzeGlob = "src";

interface Config {
	disable: boolean;
	verbose: boolean;
	cwd: string;
	format: { disable: boolean };

	htmlTemplateTags: string[];
	cssTemplateTags: string[];

	checkUnknownEvents: boolean;

	skipUnknownTags: boolean;
	skipSuggestions: boolean;
	skipUnknownAttributes: boolean;
	skipUnknownProperties: boolean;
	skipUnknownSlots: boolean;
	skipTypeChecking: boolean;
	skipMissingImports: boolean;

	globalTags: string[];
	globalAttributes: string[];
	globalEvents: string[];
	customHtmlData: (string | Object)[] | string | Object;
}

export async function activate(context: vscode.ExtensionContext) {
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
		(e: any) => {
			if (e.affectsConfiguration(configurationSection) || e.affectsConfiguration(configurationExperimentalHtmlSection)) {
				synchronizeConfig(api);
			}
		},
		undefined,
		context.subscriptions
	);

	// Subscribe to the analyze command
	context.subscriptions.push(vscode.commands.registerCommand(analyzeCommandId, handleAnalyzeCommand));

	synchronizeConfig(api);
}

function synchronizeConfig(api: any) {
	api.configurePlugin(tsLitPluginId, getConfig());
}

function getConfig(): Partial<Config> {
	const config = vscode.workspace.getConfiguration(configurationSection);
	const outConfig: Partial<Config> = {};

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

	// Values
	withConfigValue(config, "disable", value => {
		outConfig.disable = value;
	});
	withConfigValue(config, "verbose", value => {
		outConfig.verbose = value;
	});
	withConfigValue(config, "logging", value => {
		if (value === "verbose") {
			outConfig.verbose = true;
		}
	});
	withConfigValue(config, "format.disable", value => {
		outConfig.format = Object.assign(outConfig.format || {}, { disable: value });
	});
	withConfigValue(config, "skipSuggestions", value => {
		outConfig.skipSuggestions = value;
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

	// Check
	withConfigValue(config, "checkUnknownEvents", value => {
		outConfig.checkUnknownEvents = value;
	});

	// Skip
	withConfigValue(config, "skipUnknownTags", value => {
		outConfig.skipUnknownTags = value;
	});
	withConfigValue(config, "skipUnknownAttributes", value => {
		outConfig.skipUnknownAttributes = value;
	});
	withConfigValue(config, "skipUnknownProperties", value => {
		outConfig.skipUnknownProperties = value;
	});
	withConfigValue(config, "skipUnknownSlots", value => {
		outConfig.skipUnknownSlots = value;
	});
	withConfigValue(config, "skipMissingImports", value => {
		outConfig.skipMissingImports = value;
	});
	withConfigValue(config, "skipTypeChecking", value => {
		outConfig.skipTypeChecking = value;
	});
	withConfigValue(config, "customHtmlData", value => {
		outConfig.customHtmlData = value;
	});

	// Experimental values from vscode
	const experimental = vscode.workspace.getConfiguration(configurationExperimentalHtmlSection, null);
	withConfigValue(experimental, "customData", value => {
		// Merge value from vscode with "lit-plugin.customHtmlData"
		const filePaths = (Array.isArray(value) ? value : [value]).map(path => (typeof path === "string" ? toWorkspacePath(path) : path));
		outConfig.customHtmlData = outConfig.customHtmlData == null ? filePaths : filePaths.concat(outConfig.customHtmlData);
	});

	return outConfig;
}

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
