const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const syncs = await prisma.repoSync.findMany();
  console.log('RepoSyncs in DB:', JSON.stringify(syncs, null, 2));
  
  const projects = await prisma.project.findMany();
  console.log('Projects in DB:', JSON.stringify(projects.map(p => ({ id: p.id, name: p.name, repoFullName: p.repoFullName })), null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
