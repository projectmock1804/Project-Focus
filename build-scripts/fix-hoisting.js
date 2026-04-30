/**
 * afterPack hook for electron-builder
 *
 * ROOT CAUSE FIX: electron-builder breaks npm's hoisting structure when
 * packaging node_modules. Specifically, transitive dependencies that npm
 * hoists to the top level (like `call-bind-apply-helpers`) get nested
 * inside their first-found parent (e.g., `call-bind/node_modules/`),
 * which breaks Node.js module resolution for OTHER siblings that need them
 * (e.g., `dunder-proto` requires `call-bind-apply-helpers` but can't find it).
 *
 * Fix: Compare source node_modules vs packaged node_modules. For every
 * top-level package that exists in source but is missing from the package,
 * copy it over. This restores the correct hoisting structure.
 */

const fs = require('fs');
const path = require('path');

function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else if (entry.isSymbolicLink()) {
      const linkTarget = fs.readlinkSync(srcPath);
      try {
        fs.symlinkSync(linkTarget, destPath);
      } catch (e) {
        // Fallback: copy as regular file if symlink fails (Windows perms)
        try {
          fs.copyFileSync(srcPath, destPath);
        } catch (_) {}
      }
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function listTopLevelPackages(nodeModulesDir) {
  if (!fs.existsSync(nodeModulesDir)) return new Set();
  const result = new Set();
  const entries = fs.readdirSync(nodeModulesDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('.')) continue;
    if (entry.name.startsWith('@')) {
      // Scoped packages: list inside
      const scopedDir = path.join(nodeModulesDir, entry.name);
      const scopedEntries = fs.readdirSync(scopedDir, { withFileTypes: true });
      for (const sub of scopedEntries) {
        if (sub.isDirectory()) {
          result.add(`${entry.name}/${sub.name}`);
        }
      }
    } else {
      result.add(entry.name);
    }
  }
  return result;
}

function isProductionDep(pkgName, sourceRoot) {
  // Walk dependency tree from package.json's "dependencies" only.
  // We pre-compute this once and pass it in.
  return true; // simplified: caller filters
}

function getProductionDepClosure(sourceRoot) {
  /**
   * BFS the prod dependency tree starting from package.json's "dependencies"
   * Returns a Set of all package names that are production deps (direct or transitive).
   */
  const closure = new Set();
  const rootPkg = JSON.parse(
    fs.readFileSync(path.join(sourceRoot, 'package.json'), 'utf8')
  );
  const queue = Object.keys(rootPkg.dependencies || {});

  while (queue.length > 0) {
    const pkgName = queue.shift();
    if (closure.has(pkgName)) continue;

    // Find the package's installed location (could be top-level or nested)
    const topLevel = path.join(sourceRoot, 'node_modules', pkgName);
    let pkgJsonPath = path.join(topLevel, 'package.json');

    if (!fs.existsSync(pkgJsonPath)) {
      // Try as a scoped package, or skip if not found
      continue;
    }

    closure.add(pkgName);

    try {
      const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
      const deps = Object.keys(pkgJson.dependencies || {});
      for (const dep of deps) {
        if (!closure.has(dep)) queue.push(dep);
      }
      // Optional dependencies should also be considered
      const optDeps = Object.keys(pkgJson.optionalDependencies || {});
      for (const dep of optDeps) {
        if (!closure.has(dep)) queue.push(dep);
      }
    } catch (e) {
      console.warn(`[fix-hoisting] Could not read ${pkgName}/package.json:`, e.message);
    }
  }

  return closure;
}

exports.default = async function (context) {
  const { appOutDir, packager } = context;
  const sourceRoot = packager.projectDir;
  const sourceNodeModules = path.join(sourceRoot, 'node_modules');
  const builtAppDir = path.join(appOutDir, 'resources', 'app');
  const builtNodeModules = path.join(builtAppDir, 'node_modules');

  if (!fs.existsSync(builtNodeModules)) {
    console.log('[fix-hoisting] Built node_modules not found, skipping');
    return;
  }

  console.log('[fix-hoisting] Source:', sourceNodeModules);
  console.log('[fix-hoisting] Target:', builtNodeModules);

  const sourcePackages = listTopLevelPackages(sourceNodeModules);
  const builtPackages = listTopLevelPackages(builtNodeModules);

  console.log(`[fix-hoisting] Source packages: ${sourcePackages.size}`);
  console.log(`[fix-hoisting] Built packages:  ${builtPackages.size}`);

  // Compute production dependency closure to filter out devDependencies
  const prodClosure = getProductionDepClosure(sourceRoot);
  console.log(`[fix-hoisting] Production deps closure: ${prodClosure.size}`);

  // Find packages that are PROD deps, in source, but missing from build
  const missing = [];
  for (const pkg of prodClosure) {
    if (!builtPackages.has(pkg) && sourcePackages.has(pkg)) {
      missing.push(pkg);
    }
  }

  console.log(`[fix-hoisting] Missing top-level packages: ${missing.length}`);
  if (missing.length === 0) {
    console.log('[fix-hoisting] No fix needed');
    return;
  }

  let copiedCount = 0;
  for (const pkg of missing) {
    const src = path.join(sourceNodeModules, pkg);
    const dest = path.join(builtNodeModules, pkg);
    if (!fs.existsSync(src)) continue;
    console.log(`[fix-hoisting]   + ${pkg}`);
    try {
      copyDirSync(src, dest);
      copiedCount++;
    } catch (e) {
      console.error(`[fix-hoisting]   ! Failed to copy ${pkg}:`, e.message);
    }
  }

  console.log(`[fix-hoisting] Copied ${copiedCount}/${missing.length} packages`);
  console.log('[fix-hoisting] Done');
};
