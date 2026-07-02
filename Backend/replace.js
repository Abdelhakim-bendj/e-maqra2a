const fs = require('fs');
const files = [
  'src/controllers/dashboard.controller.ts',
  'src/controllers/messages.controller.ts',
  'src/controllers/notifications.controller.ts',
  'src/controllers/reports.controller.ts',
  'src/controllers/user.controller.ts',
  'src/middleware/auth.middleware.ts'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/prisma\.user/g, 'prisma.profile');
  content = content.replace(/tx\.user/g, 'tx.profile');
  content = content.replace(/db\.user/g, 'db.profile');
  fs.writeFileSync(file, content);
  console.log('Updated ' + file);
});
