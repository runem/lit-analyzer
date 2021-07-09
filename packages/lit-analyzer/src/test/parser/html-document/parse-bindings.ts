import {
	HtmlNodeAttrAssignmentKind,
	IHtmlNodeAttrAssignmentMixed,
	IHtmlNodeAttrAssignmentString
} from "../../../src/analyze/types/html-node/html-node-attr-assignment-types";
import { parseHtml } from "../../helpers/parse-html";
import { tsTest } from "../../helpers/ts-test";

// https://github.com/runem/lit-analyzer/issues/44
tsTest("Correctly parses binding without a missing start quote", t => {
	const res = parseHtml('<button @tap=${console.log}"></button>');
	const attr = res.findAttr(attr => attr.name === "tap")!;
	const assignment = attr.assignment!;

	t.is(assignment.kind, HtmlNodeAttrAssignmentKind.MIXED);
	t.is(typeof (assignment as IHtmlNodeAttrAssignmentMixed).values[0], "object");
	t.is((assignment as IHtmlNodeAttrAssignmentMixed).values[1], '"');
});

tsTest("Correctly parses binding with no quotes", t => {
	const res = parseHtml('<input value=${"text"} />');
	const attr = res.findAttr(attr => attr.name === "value")!;
	t.is(attr.assignment!.kind, HtmlNodeAttrAssignmentKind.EXPRESSION);
});

tsTest("Correctly parses binding with no expression and no quotes", t => {
	const res = parseHtml("<input value=text />");
	const attr = res.findAttr(attr => attr.name === "value")!;
	t.is(attr.assignment!.kind, HtmlNodeAttrAssignmentKind.STRING);
	t.is((attr.assignment as IHtmlNodeAttrAssignmentString).value, "text");
});

tsTest("Correctly parses binding with single quotes", t => {
	const res = parseHtml("<input value='text' />");
	const attr = res.findAttr(attr => attr.name === "value")!;
	t.is(attr.assignment!.kind, HtmlNodeAttrAssignmentKind.STRING);
});

tsTest("Correctly parses boolean binding", t => {
	const res = parseHtml("<input required />");
	const attr = res.findAttr(attr => attr.name === "required")!;
	t.is(attr.assignment!.kind, HtmlNodeAttrAssignmentKind.BOOLEAN);
});
