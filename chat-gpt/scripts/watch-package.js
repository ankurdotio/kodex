const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Target package.json path in the current working directory
const pkgPath = path.resolve(process.cwd(), 'package.json');
const targetCmd = process.argv.slice(2);

if (targetCmd.length === 0) {
  console.error("Please specify the command to run, e.g. node watch-package.js npm run dev");
  process.exit(1);
}

let child = null;
let lastMtime = 0;
let isInstalling = false;

function getPackageMtime() {
  try {
    return fs.statSync(pkgPath).mtimeMs;
  } catch (err) {
    return 0;
  }
}

function runNpmInstall(callback) {
  isInstalling = true;
  console.log(`[watcher] Running 'npm install' in ${process.cwd()}...`);
  const npm = spawn('npm', ['install'], { stdio: 'inherit', shell: true });
  npm.on('close', (code) => {
    isInstalling = false;
    if (code === 0) {
      console.log(`[watcher] 'npm install' finished successfully.`);
      callback();
    } else {
      console.error(`[watcher] 'npm install' failed with code ${code}.`);
      callback(); // Try to start child anyway
    }
  });
}

// Function to start child process
function startChild() {
  if (isInstalling) return;
  console.log(`[watcher] Starting command: ${targetCmd.join(' ')}`);
  
  const cmd = targetCmd[0];
  const args = targetCmd.slice(1);
  
  child = spawn(cmd, args, { stdio: 'inherit', shell: true });
  
  child.on('close', (code) => {
    console.log(`[watcher] Child process exited with code ${code}`);
    child = null;
  });
}

function killChild(callback) {
  if (child) {
    console.log(`[watcher] Stopping running command...`);
    child.kill('SIGTERM');
    
    let checkInterval = setInterval(() => {
      if (!child) {
        clearInterval(checkInterval);
        callback();
      }
    }, 100);
    
    setTimeout(() => {
      if (child) {
        clearInterval(checkInterval);
        console.log(`[watcher] Command did not stop, force killing...`);
        child.kill('SIGKILL');
        child = null;
        callback();
      }
    }, 3000);
  } else {
    callback();
  }
}

// Initial run
lastMtime = getPackageMtime();
runNpmInstall(() => {
  startChild();
});

// Poll package.json for changes every 2 seconds
setInterval(() => {
  if (isInstalling) return;
  
  const currentMtime = getPackageMtime();
  if (currentMtime > lastMtime) {
    console.log(`[watcher] package.json change detected.`);
    lastMtime = currentMtime;
    killChild(() => {
      runNpmInstall(() => {
        startChild();
      });
    });
  }
}, 2000);

// Handle termination signals
process.on('SIGTERM', () => {
  if (child) child.kill('SIGTERM');
  process.exit(0);
});
process.on('SIGINT', () => {
  if (child) child.kill('SIGINT');
  process.exit(0);
});
