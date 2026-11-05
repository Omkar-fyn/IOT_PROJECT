/**
 * Standalone Database Seeding Script
 */
const { spawn } = require('child_process');
const path = require('path');

const seedScript = path.resolve(__dirname, '../../apps/api/src/scripts/seed.ts');

console.log('Running Database Seed for Initial Admin and Default Device...');
const proc = spawn('npx', ['tsx', '-e', `import('${seedScript.replace(/\\/g, '/')}').then(m => m.seedInitialAdminAndDevice())`], {
  stdio: 'inherit',
  shell: true
});

proc.on('close', (code) => {
  console.log(`Seed script exited with code ${code}`);
});

