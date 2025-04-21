const { PrismaClient } = require('../generated/prisma/index');
const bcrypt = require('bcrypt');
const { faker } = require('@faker-js/faker');
const { hashPassword } = require('../utils/passwordutils');

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // --- Clean up existing data ---
  console.log('Deleting existing data...');
  // Delete in reverse order of dependency (Comment -> Blog -> User)
  await prisma.comment.deleteMany();
  await prisma.blog.deleteMany();
  await prisma.user.deleteMany();
  console.log('Existing data deleted.');

  // --- Create Users ---
  const userCount = 5;
  const users = [];
  console.log(`Creating ${userCount} users...`);
  for (let i = 0; i < userCount; i++) {
    const hashedPassword = await hashPassword('password123'); // Use a default password for simplicity
    const user = await prisma.user.create({
      data: {
        username: faker.internet.userName().toLowerCase() + Math.floor(Math.random()*100), // Ensure uniqueness
        password: hashedPassword,
      },
    });
    users.push(user);
    console.log(`Created user: ${user.username} (ID: ${user.id})`);
  }

  // --- Create Blogs ---
  const blogCount = 10;
  const blogs = [];
  console.log(`Creating ${blogCount} blogs...`);
  for (let i = 0; i < blogCount; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)]; // Pick a random author
    const blog = await prisma.blog.create({
      data: {
        title: faker.lorem.sentence({ min: 3, max: 8}),
        post: faker.lorem.paragraphs({ min: 3, max: 10 }),
        author: { // Connect using relation field
          connect: { id: randomUser.id },
        },
      },
    });
    blogs.push(blog);
    console.log(`Created blog: "${blog.title}" by user ID ${blog.userId}`);
  }

  // --- Create Comments ---
  const commentCount = 30;
  console.log(`Creating ${commentCount} comments...`);
  for (let i = 0; i < commentCount; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)]; // Pick a random author
    const randomBlog = blogs[Math.floor(Math.random() * blogs.length)]; // Pick a random blog
    const comment = await prisma.comment.create({
      data: {
        text: faker.lorem.sentence({ min: 5, max: 25 }),
        blog: { // Connect using relation field
          connect: { id: randomBlog.id },
        },
        author: { // Connect using relation field
          connect: { id: randomUser.id },
        },
      },
    });
     console.log(`Created comment ID ${comment.id} on blog ID ${comment.blogId} by user ID ${comment.userId}`);
  }

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });