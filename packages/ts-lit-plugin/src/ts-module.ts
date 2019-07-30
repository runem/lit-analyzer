import * as tsModuleType from "typescript";

export const tsModule: { ts: typeof import("typescript") } = { ts: tsModuleType };

export function setTypescriptModule(newModule: typeof import("typescript")) {
	tsModule.ts = newModule;
}
