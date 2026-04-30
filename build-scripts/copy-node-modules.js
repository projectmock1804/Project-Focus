const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Copy node_modules to app folder before packing
module.exports = (params) => {
  const projectRoot = process.cwd();
  const projectNodeModules = path.join(projectRoot, 'node_modules');
  const appDir = path.join(projectRoot, '.electron-app');

  // Create .electron-app directory if it doesn't exist
  if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir, { recursive: true });
  }

  const appNodeModules = path.join(appDir, 'node_modules');

  console.log('[beforePack] Copying node_modules...');
  console.log('  From:', projectNodeModules);
  console.log('  To:', appNodeModules);

  try {
    if (process.platform === 'win32') {
      // Windows - use robocopy for better performance
      try {
        execSync(`robocopy "${projectNodeModules}" "${appNodeModules}" /E /COPY:DAT /R:0`, {
          stdio: 'inherit',
          shell: true
        });
      } catch (e) {
        // robocopy has non-zero exit codes for success, fallback to xcopy
        execSync(`xcopy "${projectNodeModules}" "${appNodeModules}" /E /I /Y /Q`, {
          stdio: 'inherit',
          shell: true
        });
      }
    } else {
      // Unix-like
      execSync(`cp -r "${projectNodeModules}" "${appNodeModules}"`, {
        stdio: 'inherit'
      });
    }
    console.log('[beforePack] node_modules copied successfully');
  } catch (error) {
    console.error('[beforePack] Error copying node_modules:', error.message);
    throw error;
  }
};
