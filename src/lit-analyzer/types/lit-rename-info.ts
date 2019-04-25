import { ComponentDefinition } from "web-component-analyzer";
import { HtmlDocument } from "../parse/document/text-document/html-document/html-document";
import { HtmlNode } from "./html-node/html-node-types";
import { DocumentRange, SourceFileRange } from "./lit-range";
import { LitTargetKind } from "./lit-target-kind";

export interface RenameInfoBase {
	kind: LitTargetKind;
	displayName: string;
	fullDisplayName: string;
	range: SourceFileRange | DocumentRange;
}

export interface RenameHtmlNodeInfo extends RenameInfoBase {
	document: HtmlDocument;
	target: ComponentDefinition | HtmlNode;
}

export interface RenameComponentDefinitionInfo extends RenameInfoBase {
	target: ComponentDefinition;
}

export type LitRenameInfo = RenameHtmlNodeInfo | RenameComponentDefinitionInfo;
