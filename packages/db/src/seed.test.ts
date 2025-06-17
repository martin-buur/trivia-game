import { db } from './client';
import { questionPacks, questions } from './schema';
import dotenv from 'dotenv';

// Load environment variables from the root .env file
dotenv.config({ path: '../../.env' });

async function seedTest() {
  try {
    console.log('🌱 Starting E2E test database seed...');

    // Clear existing data
    await db.delete(questions);
    await db.delete(questionPacks);

    // Insert test question pack
    const [quickTest] = await db
      .insert(questionPacks)
      .values([
        {
          name: 'E2E Test Pack',
          description: 'Quick questions for E2E testing (3 second timeouts)',
          difficulty: 'easy',
          category: 'test',
          questionCount: 5,
        },
      ])
      .returning();

    // Insert test questions with predictable answers
    const questionsData = [
      {
        packId: quickTest.id,
        question: 'What is 2 + 2?',
        options: ['3', '4', '5', '6'],
        correctAnswerIndex: 1, // Answer is "4"
        timeLimit: 3,
        points: 100,
        order: 1,
      },
      {
        packId: quickTest.id,
        question: 'What color is the sky?',
        options: ['Red', 'Green', 'Blue', 'Yellow'],
        correctAnswerIndex: 2, // Answer is "Blue"
        timeLimit: 3,
        points: 100,
        order: 2,
      },
      {
        packId: quickTest.id,
        question: 'How many days in a week?',
        options: ['5', '6', '7', '8'],
        correctAnswerIndex: 2, // Answer is "7"
        timeLimit: 3,
        points: 100,
        order: 3,
      },
      {
        packId: quickTest.id,
        question: 'Which animal says "meow"?',
        options: ['Dog', 'Cat', 'Cow', 'Bird'],
        correctAnswerIndex: 1, // Answer is "Cat"
        timeLimit: 3,
        points: 100,
        order: 4,
      },
      {
        packId: quickTest.id,
        question: 'What shape has 4 equal sides?',
        options: ['Triangle', 'Circle', 'Square', 'Pentagon'],
        correctAnswerIndex: 2, // Answer is "Square"
        timeLimit: 3,
        points: 100,
        order: 5,
      },
    ];

    await db.insert(questions).values(questionsData);

    console.log('✅ E2E test database seeded successfully!');
    console.log(`- 1 test question pack created`);
    console.log(`- 5 test questions created`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding test database:', error);
    process.exit(1);
  }
}

seedTest();