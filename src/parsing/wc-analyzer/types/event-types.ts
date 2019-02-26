export interface EventDeclaration {
	fileName: string;
}

export interface EventDefinition {
	fileName: string;
	eventName: string;
	declaration: EventDeclaration;
}
