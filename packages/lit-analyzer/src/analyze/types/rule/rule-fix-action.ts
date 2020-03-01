import { SourceFile } from "typescript";
import { HtmlNodeAttrAssignment } from "../html-node/html-node-attr-assignment-types";
import { HtmlNodeAttr } from "../html-node/html-node-attr-types";
import { HtmlNode } from "../html-node/html-node-types";

export type RuleFixActionKind = "changeTagName" | "addAttribute" | "changeAttributeName" | "changeAttributeModifier" | "changeAssignment" | "import";

export interface RuleFixActionBase {
	kind: RuleFixActionKind;
	file?: SourceFile;
}

export interface RuleFixActionChangeTagName extends RuleFixActionBase {
	kind: "changeTagName";
	htmlNode: HtmlNode;
	newName: string;
}

export interface RuleFixActionAddAttribute extends RuleFixActionBase {
	kind: "addAttribute";
	htmlNode: HtmlNode;
	name: string;
	value?: string;
}

export interface RuleFixActionChangeAttributeName extends RuleFixActionBase {
	kind: "changeAttributeName";
	htmlAttr: HtmlNodeAttr;
	newName: string;
}

export interface RuleFixActionChangeAttributeModifier extends RuleFixActionBase {
	kind: "changeAttributeModifier";
	htmlAttr: HtmlNodeAttr;
	newModifier: string;
}

export interface RuleFixActionChangeAssignment extends RuleFixActionBase {
	kind: "changeAssignment";
	assignment: HtmlNodeAttrAssignment;
	newValue: string;
}

export interface RuleFixActionImport extends RuleFixActionBase {
	kind: "import";
	file: SourceFile;
	path: string;
	identifiers?: string[];
}

export type RuleFixAction =
	| RuleFixActionChangeTagName
	| RuleFixActionAddAttribute
	| RuleFixActionChangeAttributeName
	| RuleFixActionImport
	| RuleFixActionChangeAttributeModifier
	| RuleFixActionChangeAssignment;
