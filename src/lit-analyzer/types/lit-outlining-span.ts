import { DocumentRange } from "./lit-range";

export enum LitOutliningSpanKind {
	Comment = "comment",
	Region = "region",
	Code = "code",
	Imports = "imports"
}

export interface LitOutliningSpan {
	location: DocumentRange;
	bannerText: string;
	autoCollapse?: boolean;
	kind: LitOutliningSpanKind;
}
