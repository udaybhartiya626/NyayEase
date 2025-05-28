const fs = require('fs');
const path = require('path');

const envContent = `NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://udaybhartiya06:uday@2003@nyayease.yh6u0lp.mongodb.net/NyayEase
JWT_SECRET=nyayease_jwt_secret_key_dev
JWT_EXPIRE=30d
`;

fs.writeFileSync(path.join(__dirname, '.env'), envContent, 'utf8');
console.log('.env file created successfully!'); 