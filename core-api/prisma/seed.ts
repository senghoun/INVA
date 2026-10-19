import { PrismaClient } from '@prisma/client-auth';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@inva.io';
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 12) throw new Error('Set ADMIN_PASSWORD to a unique password of at least 12 characters before seeding.');
  const roleName = process.env.ADMIN_ROLE || 'ADMIN';

  console.log(`\n🌱 Seeding initial INTERNAL user: ${email}...`);

  // 1. Ensure Standard System Roles exist
  const standardRoles = [
    {
      name: 'ADMIN',
      description: 'System Administrator with full access across all domains',
    },
    {
      name: 'HR_ADMIN',
      description: 'HR Domain Administrator with employee, payroll, and policy management access',
    },
    {
      name: 'CRM_MANAGER',
      description: 'CRM Domain Manager with client relations and deal pipeline access',
    },
    {
      name: 'ACCOUNTANT',
      description: 'Accounting Domain Specialist with invoice and ledger sync access',
    },
    {
      name: 'IT_ADMIN',
      description: 'IT Operations Administrator with infrastructure and ticket access',
    },
    {
      name: 'AUDITOR',
      description: 'Cross-Domain Auditor with read-only compliance inspection access',
    },
  ];

  let adminRole: any = null;
  for (const r of standardRoles) {
    const res = await prisma.role.upsert({
      where: { name: r.name },
      create: {
        name: r.name,
        description: r.description,
        isActive: true,
      },
      update: {
        isActive: true,
      },
    });
    console.log(`✅ Role "${res.name}" ready (ID: ${res.id})`);
    if (r.name === roleName) {
      adminRole = res;
    }
  }
  const role = adminRole || await prisma.role.findUnique({ where: { name: roleName } });

  // 2. Hash Password (salt rounds: 10)
  const passwordHash = await bcrypt.hash(password, 10);

  // 3. Upsert INTERNAL User
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      userType: 'INTERNAL',
      isActive: true,
      mfaEnabled: false,
    },
    update: {
      passwordHash,
      userType: 'INTERNAL',
      isActive: true,
    },
  });
  console.log(`✅ User "${user.email}" ready (ID: ${user.id}, Type: ${user.userType})`);

  // 4. Bind Role to User
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: role.id,
      },
    },
    create: {
      userId: user.id,
      roleId: role.id,
    },
    update: {},
  });
  console.log(`✅ Assigned role "${role.name}" to "${user.email}"`);

  console.log(`\n🎉 Seed completed! You can now log in with:`);
  console.log(`   Email:    ${email}`);

}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
