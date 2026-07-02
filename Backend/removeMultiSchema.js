const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Remove previewFeatures = ["multiSchema"]
content = content.replace(/previewFeatures\s*=\s*\["multiSchema"\]/g, '');

// Remove schemas = ["public", "auth"]
content = content.replace(/schemas\s*=\s*\["public", "auth"\]/g, '');

// Remove all @@schema("public")
content = content.replace(/\s*@@schema\("public"\)/g, '');

// Remove auth_user relation in Profile
content = content.replace(/auth_user\s+users\?\s+@relation\([^)]+\)/g, '');

// Remove model users block
content = content.replace(/model users\s*\{[^}]+\}/g, '');

fs.writeFileSync('prisma/schema.prisma', content);
