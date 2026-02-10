// Register ts-node to allow requiring TypeScript files in a CommonJS environment
require('ts-node').register({ transpileOnly: true });

// Patch module resolution so imports starting with "@/" map to the ./src directory.
// This avoids needing extra tooling like tsconfig-paths for the quick test runner.
const Module = require('module');
const path = require('path');
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function(request, parent, isMain, options) {
  if (typeof request === 'string' && request.startsWith('@/')) {
    const rel = request.substring(2); // remove @/
    const resolved = path.resolve(__dirname, '..', 'src', rel);
    // Try resolving with .ts/.tsx/.js extensions
    try {
      return originalResolveFilename.call(this, resolved, parent, isMain, options);
    } catch (e) {
      // fallback to direct path
      return originalResolveFilename.call(this, resolved + '.ts', parent, isMain, options);
    }
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

(async () => {
  try {
    // Require the TypeScript test script; ts-node will transpile on the fly
    const test = require('./test-orchestrator.ts');
    // If the module exports a promise or function, attempt to run it
    if (typeof test === 'function') {
      await test();
    }
  } catch (err) {
    console.error('Runner Error:', err);
    process.exit(1);
  }
})();