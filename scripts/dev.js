const { spawn } = require('child_process');

/**
 * Script para rodar o ambiente de desenvolvimento com melhor UX.
 * Resolve o problema de logs paralelos que escondem o link do frontend.
 */
const turbo = spawn('npx', ['turbo', 'run', 'dev', '--parallel'], {
  stdio: 'inherit',
  shell: true
});

// Imprime o link destacado após o carregamento inicial
setTimeout(() => {
  process.stdout.write('\n\n  \x1b[32m➜\x1b[0m  \x1b[1mLocal:\x1b[0m   \x1b[36mhttp://localhost:3000/\x1b[0m\n\n');
}, 5000);

// Proxy de sinais de encerramento para o turbo
process.on('SIGINT', () => {
  turbo.kill('SIGINT');
  process.exit();
});

process.on('SIGTERM', () => {
  turbo.kill('SIGTERM');
  process.exit();
});
