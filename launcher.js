#!/usr/bin/env node

/**
 * Project Focus Launcher
 * Cross-platform app starter (Windows, Mac, Linux)
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');

// Colors for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function header() {
  log('================================', 'green');
  log('   PROJECT FOCUS', 'green');
  log('================================', 'green');
  log('');
}

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port);
  });
}

async function main() {
  header();

  // 1. 디렉토리 확인
  log('✓ Checking application directory...', 'cyan');
  const appDir = __dirname;
  const packageJson = path.join(appDir, 'package.json');

  if (!fs.existsSync(packageJson)) {
    log('✗ package.json not found', 'red');
    process.exit(1);
  }
  log(`  Directory: ${appDir}`, 'gray');

  // 2. 포트 확인
  log('✓ Checking ports...', 'cyan');
  const portsToCheck = [3000, 3001, 5173];
  const busyPorts = [];

  for (const port of portsToCheck) {
    if (await checkPort(port)) {
      busyPorts.push(port);
    }
  }

  if (busyPorts.length > 0) {
    log(`  Ports in use: ${busyPorts.join(', ')} (will be released)`, 'yellow');
  } else {
    log('  All ports available', 'gray');
  }

  // 3. 앱 시작
  log('', 'reset');
  log('✓ Starting Project Focus...', 'green');
  log('  - API server (port 3000)', 'gray');
  log('  - Web dev server (port 5173)', 'gray');
  log('  - Electron app', 'gray');
  log('  - PC monitor (distraction detection)', 'gray');
  log('', 'reset');
  log('Press Ctrl+C to stop', 'yellow');
  log('', 'reset');

  // npm run desktop 실행
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(npm, ['run', 'desktop'], {
    cwd: appDir,
    stdio: 'inherit',
    shell: true,
  });

  child.on('error', (err) => {
    log(`✗ Failed to start app: ${err.message}`, 'red');
    process.exit(1);
  });

  child.on('exit', (code) => {
    if (code !== 0) {
      log(`\n✗ App exited with code ${code}`, 'red');
    }
    process.exit(code);
  });
}

main().catch((err) => {
  log(`✗ Error: ${err.message}`, 'red');
  process.exit(1);
});
