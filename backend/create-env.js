const fs = require('fs');
const path = require('path');

const envContent = `NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/nyayease
JWT_SECRET=nyayease_jwt_secret_key_dev
JWT_EXPIRE=30d
`;

fs.writeFileSync(path.join(__dirname, '.env'), envContent, 'utf8');
console.log('.env file created successfully!'); 