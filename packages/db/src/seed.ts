import { db } from './client';
import { questionPacks, questions } from './schema';

async function seed() {
  console.log('🌱 Starting seed...');

  try {
    // Clear existing data
    await db.delete(questions);
    await db.delete(questionPacks);

    // Insert question packs
    const [generalKnowledge, popCulture, science, history, sports] = await db
      .insert(questionPacks)
      .values([
        {
          name: 'General Knowledge',
          description: 'A mix of questions from various topics',
          difficulty: 'medium',
          category: 'general',
          questionCount: 5,
        },
        {
          name: 'Pop Culture',
          description: 'Movies, music, celebrities, and trends',
          difficulty: 'easy',
          category: 'entertainment',
          questionCount: 5,
        },
        {
          name: 'Science & Nature',
          description: 'Physics, chemistry, biology, and the natural world',
          difficulty: 'hard',
          category: 'science',
          questionCount: 5,
        },
        {
          name: 'History',
          description: 'Events, people, and civilizations throughout time',
          difficulty: 'medium',
          category: 'history',
          questionCount: 5,
        },
        {
          name: 'Sports',
          description: 'Athletes, teams, and sporting events',
          difficulty: 'medium',
          category: 'sports',
          questionCount: 5,
        },
      ])
      .returning();

    // Insert questions for each pack
    const questionsData = [
      // General Knowledge
      {
        packId: generalKnowledge.id,
        question: 'What is the capital of France?',
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        correctAnswerIndex: 2,
        timeLimit: 20,
        order: 1,
      },
      {
        packId: generalKnowledge.id,
        question: 'How many continents are there?',
        options: ['5', '6', '7', '8'],
        correctAnswerIndex: 2,
        timeLimit: 15,
      },
      {
        packId: generalKnowledge.id,
        question: 'What is the largest planet in our solar system?',
        options: ['Earth', 'Mars', 'Saturn', 'Jupiter'],
        correctAnswerIndex: 3,
        timeLimit: 20,
      },
      {
        packId: generalKnowledge.id,
        question: 'Who painted the Mona Lisa?',
        options: ['Van Gogh', 'Da Vinci', 'Picasso', 'Rembrandt'],
        correctAnswerIndex: 1,
        timeLimit: 20,
      },
      {
        packId: generalKnowledge.id,
        question: 'What is the currency of Japan?',
        options: ['Yuan', 'Won', 'Yen', 'Rupee'],
        correctAnswerIndex: 2,
        timeLimit: 15,
      },

      // Pop Culture
      {
        packId: popCulture.id,
        question: 'Which movie won the Oscar for Best Picture in 2020?',
        options: ['1917', 'Joker', 'Parasite', 'Once Upon a Time in Hollywood'],
        correctAnswerIndex: 2,
        timeLimit: 25,
      },
      {
        packId: popCulture.id,
        question: 'Who is the lead singer of Queen?',
        options: [
          'Freddie Mercury',
          'Brian May',
          'Roger Taylor',
          'John Deacon',
        ],
        correctAnswerIndex: 0,
        timeLimit: 15,
      },
      {
        packId: popCulture.id,
        question: 'In which year was the first iPhone released?',
        options: ['2005', '2006', '2007', '2008'],
        correctAnswerIndex: 2,
        timeLimit: 20,
      },
      {
        packId: popCulture.id,
        question: 'Which social media platform was founded by Mark Zuckerberg?',
        options: ['Twitter', 'Instagram', 'Facebook', 'LinkedIn'],
        correctAnswerIndex: 2,
        timeLimit: 10,
      },
      {
        packId: popCulture.id,
        question: 'What is the highest-grossing film of all time?',
        options: [
          'Avengers: Endgame',
          'Avatar',
          'Titanic',
          'Star Wars: The Force Awakens',
        ],
        correctAnswerIndex: 1,
        timeLimit: 20,
      },

      // Science & Nature
      {
        packId: science.id,
        question: 'What is the chemical symbol for gold?',
        options: ['Go', 'Gd', 'Au', 'Ag'],
        correctAnswerIndex: 2,
        timeLimit: 20,
      },
      {
        packId: science.id,
        question: 'How many bones are in the adult human body?',
        options: ['186', '206', '226', '246'],
        correctAnswerIndex: 1,
        timeLimit: 25,
      },
      {
        packId: science.id,
        question: 'What is the speed of light in vacuum?',
        options: [
          '299,792 km/s',
          '199,792 km/s',
          '399,792 km/s',
          '99,792 km/s',
        ],
        correctAnswerIndex: 0,
        timeLimit: 30,
      },
      {
        packId: science.id,
        question: 'What is the powerhouse of the cell?',
        options: [
          'Nucleus',
          'Ribosome',
          'Mitochondria',
          'Endoplasmic Reticulum',
        ],
        correctAnswerIndex: 2,
        timeLimit: 20,
      },
      {
        packId: science.id,
        question: "What is the most abundant gas in Earth's atmosphere?",
        options: ['Oxygen', 'Carbon Dioxide', 'Hydrogen', 'Nitrogen'],
        correctAnswerIndex: 3,
        timeLimit: 20,
      },

      // History
      {
        packId: history.id,
        question: 'In which year did World War II end?',
        options: ['1943', '1944', '1945', '1946'],
        correctAnswerIndex: 2,
        timeLimit: 20,
      },
      {
        packId: history.id,
        question: 'Who was the first President of the United States?',
        options: [
          'Thomas Jefferson',
          'George Washington',
          'John Adams',
          'Benjamin Franklin',
        ],
        correctAnswerIndex: 1,
        timeLimit: 15,
      },
      {
        packId: history.id,
        question: 'Which ancient wonder of the world still stands today?',
        options: [
          'Colossus of Rhodes',
          'Hanging Gardens',
          'Great Pyramid of Giza',
          'Lighthouse of Alexandria',
        ],
        correctAnswerIndex: 2,
        timeLimit: 25,
      },
      {
        packId: history.id,
        question: 'In which year did Christopher Columbus reach the Americas?',
        options: ['1490', '1491', '1492', '1493'],
        correctAnswerIndex: 2,
        timeLimit: 20,
      },
      {
        packId: history.id,
        question: 'Who was the first person to walk on the moon?',
        options: [
          'Buzz Aldrin',
          'Neil Armstrong',
          'Yuri Gagarin',
          'Alan Shepard',
        ],
        correctAnswerIndex: 1,
        timeLimit: 15,
      },

      // Sports
      {
        packId: sports.id,
        question: 'How many players are on a basketball team on the court?',
        options: ['4', '5', '6', '7'],
        correctAnswerIndex: 1,
        timeLimit: 10,
      },
      {
        packId: sports.id,
        question: 'Which country has won the most FIFA World Cups?',
        options: ['Germany', 'Argentina', 'Brazil', 'Italy'],
        correctAnswerIndex: 2,
        timeLimit: 20,
      },
      {
        packId: sports.id,
        question: "In tennis, what is the score called when it's 40-40?",
        options: ['Tie', 'Draw', 'Deuce', 'Even'],
        correctAnswerIndex: 2,
        timeLimit: 15,
      },
      {
        packId: sports.id,
        question: 'How long is a marathon?',
        options: ['26.2 miles', '24.2 miles', '28.2 miles', '30.2 miles'],
        correctAnswerIndex: 0,
        timeLimit: 20,
      },
      {
        packId: sports.id,
        question: 'Which sport is known as "The Beautiful Game"?',
        options: ['Basketball', 'Tennis', 'Football/Soccer', 'Baseball'],
        correctAnswerIndex: 2,
        timeLimit: 15,
      },
    ];

    // Add order field to all questions
    const questionsWithOrder = questionsData.map((q, index) => ({
      ...q,
      order: (index % 5) + 1, // Order within each pack (1-5)
    }));

    await db.insert(questions).values(questionsWithOrder);

    console.log('✅ Seed completed successfully!');
    console.log(`📦 Created ${5} question packs`);
    console.log(`❓ Created ${questionsData.length} questions`);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

seed().catch((error) => {
  console.error('Failed to seed database:', error);
  process.exit(1);
});
