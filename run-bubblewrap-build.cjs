const { spawn } = require('child_process');
const fs = require('fs');

const logFile = 'bubblewrap_build_log.txt';
fs.writeFileSync(logFile, 'Starting bubblewrap build script...\n');

function log(msg) {
  console.log(msg);
  fs.appendFileSync(logFile, msg + '\n');
}

const child = spawn('npx', ['-y', '@bubblewrap/cli', 'build'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

let accumulated = '';
let timeoutId = null;

function handlePrompt() {
  const lines = accumulated.split('\n');
  const lastLine = lines[lines.length - 1].trim();
  const lastFewLines = lines.slice(-25).join('\n');

  log(`\n[DEBUG] Debounce fired. Tail: ${JSON.stringify(lastLine)}`);

  // 1. License agreement acceptance
  if (/accept\?\s*\(y\/N\)/i.test(lastFewLines) || /accept\s*the\s*license/i.test(lastFewLines)) {
    log(`\n[AUTO-INPUT] License agreement prompt matched. Sending 'y' to accept.`);
    accumulated = '';
    child.stdin.write('y\n');
  } 
  // 2. Password prompt
  else if (/password/i.test(lastFewLines)) {
    log(`\n[AUTO-INPUT] Password prompt matched. Sending keystore password.`);
    accumulated = '';
    child.stdin.write('agendaazul\n');
  } 
  // 3. General interactive prompt or menu selection
  else if (lastFewLines.includes('?') || lastLine.endsWith(':') || lastFewLines.includes('❯')) {
    log(`\n[AUTO-INPUT] Generic prompt detected. Sending default \\n`);
    accumulated = '';
    child.stdin.write('\n');
  } else {
    log(`\n[DEBUG] No active prompt detected.`);
  }
}

child.stdout.on('data', (data) => {
  const str = data.toString();
  fs.appendFileSync(logFile, str);
  process.stdout.write(str);
  accumulated += str;

  // Reset debounce timer on any stdout data
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  timeoutId = setTimeout(handlePrompt, 350);
});

child.stderr.on('data', (data) => {
  fs.appendFileSync(logFile, 'STDERR: ' + data.toString());
  process.stderr.write(data.toString());
});

child.on('close', (code) => {
  log(`\nProcess exited with code ${code}`);
  process.exit(code);
});
