const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

console.log('Current directory:', __dirname);

// Check if .env file exists
const envPath = path.resolve(__dirname, '.env');
console.log('.env path:', envPath);
console.log('.env file exists:', fs.existsSync(envPath) ? 'Yes' : 'No');
console.log('.env file content:');
if (fs.existsSync(envPath)) {
  console.log(fs.readFileSync(envPath, 'utf8'));
}

// Load env variables with explicit path
dotenv.config({ path: envPath });

// Debug: Log the environment variables
console.log('\nEnvironment variables loaded:');
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`- PORT: ${process.env.PORT}`);
console.log(`- MONGO_URI: ${process.env.MONGO_URI}`);
console.log(`- JWT_SECRET: ${process.env.JWT_SECRET ? '[HIDDEN]' : 'Not set'}`);
console.log(`- JWT_EXPIRE: ${process.env.JWT_EXPIRE}`); 