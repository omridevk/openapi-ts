import ts from 'typescript';

import {
  addLeadingJSDocComment,
  type Comments,
  type ImportExportItemObject,
  ots,
} from './utils';

/**
 * Create export all declaration. Example: `export * from './y'`.
 * @param module - module containing exports
 * @returns ts.ExportDeclaration
 */
export const createExportAllDeclaration = ({
  module,
}: {
  module: string;
}): ts.ExportDeclaration => {
  const statement = ts.factory.createExportDeclaration(
    undefined,
    false,
    undefined,
    ots.string(module),
  );
  return statement;
};

type ImportExportItem = ImportExportItemObject | string;

export const createCallExpression = ({
  parameters = [],
  functionName,
  types,
}: {
  functionName: string | ts.PropertyAccessExpression;
  parameters?: Array<string | ts.Expression>;
  types?: ReadonlyArray<ts.TypeNode>;
}) => {
  const expression =
    typeof functionName === 'string'
      ? ts.factory.createIdentifier(functionName)
      : functionName;
  const argumentsArray = parameters.map((parameter) =>
    typeof parameter === 'string'
      ? ts.factory.createIdentifier(parameter)
      : parameter,
  );
  const callExpression = ts.factory.createCallExpression(
    expression,
    types,
    argumentsArray,
  );
  return callExpression;
};

/**
 * Create a named export declaration. Example: `export { X } from './y'`.
 * @param exports - named imports to export
 * @param module - module containing exports
 * @returns ts.ExportDeclaration
 */
export const createNamedExportDeclarations = ({
  exports,
  module,
}: {
  exports: Array<ImportExportItem> | ImportExportItem;
  module: string;
}): ts.ExportDeclaration => {
  const exportedTypes = Array.isArray(exports) ? exports : [exports];
  const hasNonTypeExport = exportedTypes.some(
    (item) => typeof item !== 'object' || !item.asType,
  );
  const elements = exportedTypes.map((name) => {
    const item = typeof name === 'string' ? { name } : name;
    return ots.export({
      alias: item.alias,
      asType: hasNonTypeExport && item.asType,
      name: item.name,
    });
  });
  const exportClause = ts.factory.createNamedExports(elements);
  const moduleSpecifier = ots.string(module);
  const statement = ts.factory.createExportDeclaration(
    undefined,
    !hasNonTypeExport,
    exportClause,
    moduleSpecifier,
  );
  return statement;
};

/**
 * Create a const variable. Optionally, it can use const assertion or export
 * statement. Example: `export x = {} as const`.
 * @param constAssertion use const assertion?
 * @param exportConst export created variable?
 * @param expression expression for the variable.
 * @param name name of the variable.
 * @returns ts.VariableStatement
 */
export const createConstVariable = ({
  comment,
  constAssertion,
  destructure,
  expression,
  exportConst,
  name,
  typeName,
}: {
  comment?: Comments;
  constAssertion?: boolean;
  destructure?: boolean;
  exportConst?: boolean;
  expression: ts.Expression;
  name: string;
  typeName?: string;
}): ts.VariableStatement => {
  const initializer = constAssertion
    ? ts.factory.createAsExpression(
        expression,
        ts.factory.createTypeReferenceNode('const'),
      )
    : expression;
  const nameIdentifier = ts.factory.createIdentifier(name);
  const declaration = ts.factory.createVariableDeclaration(
    destructure
      ? ts.factory.createObjectBindingPattern([
          ts.factory.createBindingElement(
            undefined,
            undefined,
            nameIdentifier,
            undefined,
          ),
        ])
      : nameIdentifier,
    undefined,
    typeName ? ts.factory.createTypeReferenceNode(typeName) : undefined,
    initializer,
  );
  const statement = ts.factory.createVariableStatement(
    exportConst
      ? [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)]
      : undefined,
    ts.factory.createVariableDeclarationList([declaration], ts.NodeFlags.Const),
  );
  if (comment) {
    addLeadingJSDocComment(statement, comment);
  }
  return statement;
};

/**
 * Create a named import declaration. Example: `import { X } from './y'`.
 * @param imports - named exports to import
 * @param module - module containing imports
 * @returns ts.ImportDeclaration
 */
export const createNamedImportDeclarations = ({
  imports,
  module,
}: {
  imports: Array<ImportExportItem> | ImportExportItem;
  module: string;
}): ts.ImportDeclaration => {
  const importedTypes = Array.isArray(imports) ? imports : [imports];
  const hasNonTypeImport = importedTypes.some(
    (item) => typeof item !== 'object' || !item.asType,
  );
  const elements = importedTypes.map((name) => {
    const item = typeof name === 'string' ? { name } : name;
    return ots.import({
      alias: item.alias,
      asType: hasNonTypeImport && item.asType,
      name: item.name,
    });
  });
  const namedBindings = ts.factory.createNamedImports(elements);
  const importClause = ts.factory.createImportClause(
    !hasNonTypeImport,
    undefined,
    namedBindings,
  );
  const moduleSpecifier = ots.string(module);
  const statement = ts.factory.createImportDeclaration(
    undefined,
    importClause,
    moduleSpecifier,
  );
  return statement;
};
