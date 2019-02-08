import * as ts from "typescript/lib/tsserverlibrary";
import { createPlugin } from "./language-service/create-plugin";

const tsHtmlPluginSymbol = Symbol("__tsHtmlPlugin__");

/**
 * Export a function for the ts-service to initialize our plugin.
 * @param typescript
 */
function init(typescript: { typescript: typeof ts }) {
	return {
		create: (info: ts.server.PluginCreateInfo) => {
			// Check if the language service is already decorated
			if ((info.languageService as any)[tsHtmlPluginSymbol]) {
				return info.languageService;
			}

			// Decorate the service with our plugin
			const decoratedService = createPlugin(typescript.typescript, info);
			(decoratedService as any)[tsHtmlPluginSymbol] = true;
			return decoratedService;
		}
	};
}

export = init;
