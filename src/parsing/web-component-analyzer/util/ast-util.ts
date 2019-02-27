import { isAssignableToSimpleTypeKind, isSimpleTypePrimitive, SimpleType, SimpleTypeKind } from "ts-simple-type";
import * as tsModule from "typescript";
import {
	ClassLikeDeclaration,
	Declaration,
	InterfaceDeclaration,
	ModuleBlock,
	Node,
	PropertyDeclaration,
	PropertySignature,
	SetAccessorDeclaration,
	SourceFile,
	Symbol,
	SyntaxKind,
	TypeChecker
} from "typescript";

export interface AstContext {
	ts: typeof tsModule;
	checker: TypeChecker;
}

export function getDeclaration(symbol: Symbol, checker: TypeChecker): Declaration | undefined {
	const decl = (symbol.getDeclarations() || [])[0];
	return symbol.valueDeclaration || decl || checker.getAliasedSymbol(symbol).valueDeclaration;
}

export function isPropNamePublic(name: string): boolean {
	return !name.startsWith("_");
}

export function hasPublicSetter(node: PropertyDeclaration | PropertySignature | SetAccessorDeclaration, ts: typeof tsModule): boolean {
	return (
		!hasModifier(node, ts.SyntaxKind.ProtectedKeyword) &&
		!hasModifier(node, ts.SyntaxKind.PrivateKeyword) &&
		!hasModifier(node, ts.SyntaxKind.ReadonlyKeyword) &&
		!hasModifier(node, ts.SyntaxKind.StaticKeyword) &&
		(ts.isIdentifier(node.name) ? isPropNamePublic(node.name.text) : true)
	);
}

export function hasFlag(num: number, flag: number): boolean {
	return (num & flag) !== 0;
}

export function hasModifier(node: Node, modifierKind: SyntaxKind): boolean {
	if (node.modifiers == null) return false;
	return (node.modifiers || []).find(modifier => modifier.kind === (modifierKind as unknown)) != null;
}

/*export function locationFromNode(node: Node): CustomElementSourceCodeLocation {
 return {
 start: node.getStart(),
 end: node.getEnd()
 };
 }*/

export function getExtendedModuleInterfaceKeys(moduleBlock: ModuleBlock, name: string, { ts, checker }: AstContext): [string, Declaration][] {
	const extensions: [string, Declaration][] = [];

	for (const statement of moduleBlock.statements) {
		if (ts.isInterfaceDeclaration(statement)) {
			// { interface HTMLElementTagNameMap { "my-button": MyButton; } }
			if (statement.name.text === name) {
				for (const member of (statement as InterfaceDeclaration).members) {
					// { "my-button": MyButton; }
					if (ts.isPropertySignature(member) && ts.isStringLiteral(member.name) && member.type != null && ts.isTypeReferenceNode(member.type)) {
						const key = member.name.text;
						const typeName = member.type.typeName;

						const symbol = checker.getSymbolAtLocation(typeName);

						// { ____: MyButton; }
						if (symbol != null) {
							const declaration = getDeclaration(symbol, checker);

							if (declaration != null) {
								extensions.push([key, declaration]);
							}
						}
					}
				}
			}
		}
	}

	return extensions;
}

export function getGeneralType(simpleType: SimpleType) {
	if (isAssignableToSimpleTypeKind(simpleType, SimpleTypeKind.ARRAY)) {
		return { kind: SimpleTypeKind.ARRAY, type: { kind: SimpleTypeKind.ANY } } as SimpleType;
	} else if (isAssignableToSimpleTypeKind(simpleType, SimpleTypeKind.STRING) || isAssignableToSimpleTypeKind(simpleType, SimpleTypeKind.STRING_LITERAL)) {
		return { kind: SimpleTypeKind.STRING } as SimpleType;
	} else if (isAssignableToSimpleTypeKind(simpleType, SimpleTypeKind.NUMBER) || isAssignableToSimpleTypeKind(simpleType, SimpleTypeKind.NUMBER_LITERAL)) {
		return { kind: SimpleTypeKind.NUMBER } as SimpleType;
	} else if (isAssignableToSimpleTypeKind(simpleType, SimpleTypeKind.BOOLEAN) || isAssignableToSimpleTypeKind(simpleType, SimpleTypeKind.BOOLEAN_LITERAL)) {
		return { kind: SimpleTypeKind.BOOLEAN } as SimpleType;
	} else if (!isSimpleTypePrimitive(simpleType)) {
		return { kind: SimpleTypeKind.OBJECT } as SimpleType;
	}
	return { kind: SimpleTypeKind.ANY } as SimpleType;
}

export function isNodeInLib(node: Node | SourceFile): boolean {
	return ("fileName" in node ? node.fileName : node.getSourceFile().fileName).endsWith("/lib/lib.dom.d.ts");
}

export function isPropertyRequired(property: PropertySignature | PropertyDeclaration, checker: TypeChecker): boolean {
	const type = checker.getTypeAtLocation(property);

	// Properties in external modules don't have initializers, so we cannot infer if the property is required or not
	return isNodeInDeclarationFile(property) ? false : property.initializer == null && !isAssignableToSimpleTypeKind(type, [SimpleTypeKind.UNDEFINED, SimpleTypeKind.NULL], checker, { op: "or" });
}

export function isNodeInDeclarationFile(node: Node): boolean {
	return node.getSourceFile().isDeclarationFile;
}

export function getRelevantSuperClassDeclarations(clazz: InterfaceDeclaration | ClassLikeDeclaration, { ts, checker }: AstContext): Node[] {
	const declarations: Node[] = [];

	if (clazz.heritageClauses != null) {
		for (const heritage of clazz.heritageClauses || []) {
			// class Test implements MyBase
			// Don't visit interfaces if we are looking at a class, because the class already declares all things from the interface
			if (ts.isClassLike(clazz) && heritage.token === ts.SyntaxKind.ImplementsKeyword) {
				/*for (const type of heritage.types) {
				 context.emitExtends(type.expression);
				 }*/
				continue;
			}

			// [extends|implements] MyBase
			for (const type of heritage.types) {
				const symbol = checker.getSymbolAtLocation(type.expression);

				if (symbol != null) {
					const decl = symbol.valueDeclaration || checker.getAliasedSymbol(symbol).valueDeclaration;

					if ((decl != null && ts.isInterfaceDeclaration(decl)) || ts.isClassLike(decl)) {
						//context.emitExtends(type.expression);

						if (!isNodeInLib(decl)) {
							declarations.push(decl);
						}
					}
				}
			}
		}
	}

	return declarations;
}
