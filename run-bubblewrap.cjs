const { spawn } = require('child_process');

console.log('Starting bubblewrap script...');

const child = spawn('npx', ['-y', '@bubblewrap/cli', 'generate-key'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

let accumulated = '';
const answered = new Set();

const questions = [
  { id: 'jdk', pattern: /install the jdk/i, answer: 'Y\n' },
  { id: 'keystore_path', pattern: /where do you want to save/i, answer: 'android.keystore\n' },
  { id: 'password', pattern: /password for the key store/i, answer: 'agendaazul\n' },
  { id: 'password_confirm', pattern: /confirm password/i, answer: 'agendaazul\n' },
  { id: 'name', pattern: /first and last name/i, answer: 'Agenda Azul\n' },
  { id: 'ou', pattern: /organizational unit/i, answer: 'IT\n' },
  { id: 'org', pattern: /organization/i, answer: 'Agenda Azul\n' },
  { id: 'city', pattern: /city or locality/i, answer: 'Sao Paulo\n' },
  { id: 'state', pattern: /state or province/i, answer: 'SP\n' },
  { id: 'country', pattern: /country code/i, answer: 'BR\n' },
  { id: 'correct', pattern: /correct\?/i, answer: 'yes\n' },
  { id: 'key_password', pattern: /key password for/i, answer: '\n' }
];

child.stdout.on('data', (data) => {
  const str = data.toString();
  process.stdout.write(str);
  accumulated += str;

  for (const q of questions) {
    if (!answered.has(q.id) && q.pattern.test(accumulated)) {
      console.log(`\n[AUTO-INPUT] Matching "${q.id}" prompt, sending: ${JSON.stringify(q.answer)}`);
      answered.add(q.id);
      // Clear accumulated so we don't double match immediately
      accumulated = '';
      child.stdin.write(q.answer);
      break;
    }
  }
});

child.stderr.on('data', (data) => {
  process.stderr.write(data.toString());
});

child.on('close', (code) => {
  console.log(`\nProcess exited with code ${code}`);
  process.exit(code);
});
