import { Range } from "../../types/range";

export enum LitOutliningSpanKind {
	Comment = "comment",
	Region = "region",
	Code = "code",
	Imports = "imports"
}

export interface LitOutliningSpan {
	location: Range;
	bannerText: string;
	autoCollapse?: boolean;
	kind: LitOutliningSpanKind;
}
