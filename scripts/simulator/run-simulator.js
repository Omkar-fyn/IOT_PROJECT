/**
 * Standalone Node.js Runner for the Smart Parcel Box Simulator
 */
const { spawn } = require('child_process');
const path = require('path');

const simulatorScript = path.resolve(__dirname, '../../apps/api/src/scripts/simulate.ts');

console.log('Launching Smart Parcel Box Device Simulator...');
const proc = spawn('npx', ['tsx', simulatorScript], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, DEBUG: 'true' }
});

proc.on('close', (code) => {
  console.log(`Simulator process exited with code ${code}`);
});

