const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Replace models
content = content.replace(/model \w+ \{([\s\S]*?)\}/g, (match) => {
  if (match.includes('@@schema')) return match;
  return match.replace(/}$/, '  @@schema("public")\n}');
});

// Replace enums
content = content.replace(/enum \w+ \{([\s\S]*?)\}/g, (match) => {
  if (match.includes('@@schema')) return match;
  return match.replace(/}$/, '  @@schema("public")\n}');
});

// Replace Profile.id type
content = content.replace(/model Profile \{([\s\S]*?)id\s+String\s+@id/, (match, p1) => {
  if (match.includes('@db.Uuid')) return match;
  return `model Profile {${p1}id            String   @id @db.Uuid\n  auth_user     users?    @relation(fields: [id], references: [id], onDelete: Cascade)`;
});

// Add auth schema user stub
if (!content.includes('model users')) {
  content += `

model users {
  id       String    @id @db.Uuid
  profiles Profile?
  
  @@schema("auth")
}
`;
}

fs.writeFileSync('prisma/schema.prisma', content);
console.log("Updated schema.prisma");
