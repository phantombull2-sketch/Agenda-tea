const { spawn } = require('child_process');
const fs = require('fs');

const logFile = 'bubblewrap_init_log.txt';
fs.writeFileSync(logFile, 'Starting bubblewrap init script...\n');

function log(msg) {
  console.log(msg);
  fs.appendFileSync(logFile, msg + '\n');
}

const child = spawn('npx', ['-y', '@bubblewrap/cli', 'init', '--manifest=http://localhost:3000/manifest.json'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

let accumulated = '';
const answered = new Set();
let timeoutId = null;

const questions = [
  { id: 'host', regex: /\?\s*Domain:/i, answer: 'ais-pre-beuietdifok36loeuqcf5g-190227903362.us-east5.run.app\n' },
  { id: 'package_id', regex: /\?\s*Application ID:/i, answer: 'com.agenda_azul.twa\n' },
  { id: 'keystore_path', regex: /\?\s*Location of the Keystore:/i, answer: 'android.keystore\n' },
  { id: 'key_name', regex: /\?\s*Key name:/i, answer: 'android\n' },
];

function handlePrompt() {
  const lines = accumulated.split('\n');
  const lastLine = lines[lines.length - 1].trim();
  const lastFewLines = lines.slice(-25).join('\n');

  log(`\n[DEBUG] Debounce fired. Tail: ${JSON.stringify(lastLine)}`);

  // 1. Check for specific question prompts in the last few lines
  let answeredSpecific = false;
  for (const q of questions) {
    if (!answered.has(q.id) && q.regex.test(lastFewLines)) {
      log(`\n[AUTO-INPUT] Matching specific "${q.id}" prompt. Sending: ${JSON.stringify(q.answer)}`);
      answered.add(q.id);
      accumulated = ''; // clear accumulated for next steps
      child.stdin.write(q.answer);
      answeredSpecific = true;
      break;
    }
  }

  // 2. Fallback to default newline if it's an interactive prompt or menu selection
  if (!answeredSpecific) {
    const isQuestionPrompt = lastFewLines.includes('?') || lastLine.endsWith(':');
    const isMenuSelection = lastFewLines.includes('❯') || 
                            lastFewLines.includes('(Use arrow keys)') || 
                            lastFewLines.includes('reveal more choices') || 
                            lastFewLines.includes('Move up and down');
    
    if (isQuestionPrompt || isMenuSelection) {
      log(`\n[AUTO-INPUT] Generic prompt or menu detected. Sending default \\n`);
      accumulated = ''; // clear accumulated for next steps
      child.stdin.write('\n');
    } else {
      log(`\n[DEBUG] No active prompt or menu detected.`);
    }
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
