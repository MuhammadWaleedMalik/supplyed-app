const fs = require('node:fs');
const ts = require('typescript');

function compile(module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const result = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.Node10,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  module._compile(result.outputText, filename);
}

require.extensions['.ts'] = compile;
require.extensions['.tsx'] = compile;
global.__DEV__ = true;
