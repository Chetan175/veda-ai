#!/usr/bin/env node

import { randomUUID } from 'node:crypto';
import bcryptjs from 'bcryptjs';

// This script seeds the database with demo data

const demoUsers = [
  {
    _id: randomUUID(),
    email: 'teacher1@school.com',
    name: 'Ramesh Kumar',
    passwordHash: bcryptjs.hashSync('password123', 10),
    schoolName: 'Delhi Public School',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: randomUUID(),
    email: 'teacher2@school.com',
    name: 'Priya Sharma',
    passwordHash: bcryptjs.hashSync('password123', 10),
    schoolName: 'Delhi Public School',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: randomUUID(),
    email: 'principal@school.com',
    name: 'Dr. Anil Gupta',
    passwordHash: bcryptjs.hashSync('password123', 10),
    schoolName: 'Delhi Public School',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const demoAssignments = [
  {
    _id: randomUUID(),
    title: 'Physics Mid-Term Assessment',
    dueDate: '2024-03-15',
    instructions: 'Attempt all questions. Show all workings. Diagrams should be drawn with a ruler.',
    subject: 'Physics',
    className: 'Class 10',
    status: 'completed',
    progress: 100,
    progressLabel: 'Question paper ready',
    pdfReady: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: randomUUID(),
    title: 'Chemistry Quarterly Exam',
    dueDate: '2024-03-20',
    instructions: 'Answer all questions. Each question carries 2 marks. Total time: 90 minutes.',
    subject: 'Chemistry',
    className: 'Class 10',
    status: 'completed',
    progress: 100,
    progressLabel: 'Question paper ready',
    pdfReady: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: randomUUID(),
    title: 'Biology Unit Test',
    dueDate: '2024-03-25',
    instructions: 'Solve all questions. Attempt in order.',
    subject: 'Biology',
    className: 'Class 10',
    status: 'generating',
    progress: 65,
    progressLabel: 'Rendering PDF',
    pdfReady: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  }
];

async function seedDatabase() {
  console.log('🌱 Seeding database with demo data...');

  // Try MongoDB first
  try {
    const { MongoClient } = await import('mongodb');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/veda_ai';
    const client = new MongoClient(mongoUri);

    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('veda_ai');

    // Clear existing data
    await db.collection('users').deleteMany({});
    await db.collection('assignments').deleteMany({});

    // Insert demo data
    const usersResult = await db.collection('users').insertMany(demoUsers);
    console.log(`✅ Added ${usersResult.insertedCount} demo users`);

    const assignmentsResult = await db.collection('assignments').insertMany(demoAssignments);
    console.log(`✅ Added ${assignmentsResult.insertedCount} demo assignments`);

    // Create indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('assignments').createIndex({ createdAt: -1 });
    console.log('✅ Created database indexes');

    await client.close();
    console.log('\n✨ Database seeding complete!');
    console.log('\n📝 Demo Credentials:');
    console.log('  Email: teacher1@school.com');
    console.log('  Password: password123');
  } catch (error) {
    console.warn('⚠️  MongoDB not available, using in-memory storage for demo');
    console.log('\n📝 Demo Credentials (in-memory):');
    console.log('  Email: teacher1@school.com');
    console.log('  Password: password123');
  }
}

seedDatabase().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
