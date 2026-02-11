// Quick test to see if .env is being read
require('dotenv').config();

console.log('Testing .env file loading...\n');
console.log('Current directory:', process.cwd());
console.log('API_KEY from environment:', process.env.API_KEY);
console.log('All env vars starting with API:', 
  Object.keys(process.env)
    .filter(key => key.startsWith('API'))
    .map(key => `${key}=${process.env[key]}`)
);

if (process.env.API_KEY) {
  console.log('\n✅ .env file is loading correctly!');
  console.log('API_KEY value:', process.env.API_KEY);
} else {
  console.log('\n❌ .env file is NOT being loaded');
  console.log('Check that:');
  console.log('1. File is named exactly: .env');
  console.log('2. File contains: API_KEY=test-key-123');
  console.log('3. No spaces around the =');
  console.log('4. Running from correct directory');
}
