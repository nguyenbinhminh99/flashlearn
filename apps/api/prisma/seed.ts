import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash('Admin123', 10);
  const userHash = await bcrypt.hash('User1234', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@flashlearn.local' },
    update: {},
    create: {
      email: 'admin@flashlearn.local',
      passwordHash,
      displayName: 'FlashLearn Admin',
      role: Role.ADMIN,
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@flashlearn.local' },
    update: {},
    create: {
      email: 'demo@flashlearn.local',
      passwordHash: userHash,
      displayName: 'Demo Student',
      role: Role.USER,
    },
  });

  const programming = await prisma.category.upsert({
    where: { slug: 'lap-trinh' },
    update: {},
    create: { name: 'Lập trình', slug: 'lap-trinh' },
  });

  await prisma.category.upsert({
    where: { slug: 'ngoai-ngu' },
    update: {},
    create: { name: 'Ngoại ngữ', slug: 'ngoai-ngu' },
  });

  const existingSet = await prisma.studySet.findFirst({
    where: { ownerId: demoUser.id, title: 'JavaScript Fundamentals' },
    select: { id: true },
  });

  if (!existingSet) {
    const studySet = await prisma.studySet.create({
      data: {
        title: 'JavaScript Fundamentals',
        description: 'Core concepts for web programming',
        isPublic: true,
        ownerId: demoUser.id,
        categoryId: programming.id,
        flashcards: {
          create: [
            {
              front: 'What is a Promise?',
              back: 'An object representing the eventual completion of an async operation.',
              position: 0,
            },
            {
              front: 'What is a Closure?',
              back: 'A function that remembers variables from its outer lexical scope.',
              position: 1,
            },
            {
              front: 'What is the Event Loop?',
              back: 'The mechanism that handles async callbacks in JavaScript.',
              position: 2,
            },
            {
              front: 'What is the DOM?',
              back: 'Document Object Model — a tree representation of HTML.',
              position: 3,
            },
          ],
        },
      },
    });
    console.log('Created study set:', studySet.id);
  }

  console.log('Seed completed');
  console.log('Admin:', admin.email, '/ Admin123');
  console.log('User:', demoUser.email, '/ User1234');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
