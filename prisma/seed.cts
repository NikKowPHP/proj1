import { PrismaClient, ReadingLevel } from "@prisma/client";
import { encrypt } from "../src/lib/encryption";
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // --- Static System Settings ---
  await prisma.systemSetting.upsert({
    where: { key: "earlyAdopterModeEnabled" },
    update: {},
    create: {
      key: "earlyAdopterModeEnabled",
      value: { enabled: true },
    },
  });
  await prisma.systemSetting.upsert({
    where: { key: "journalMinChars" },
    update: {},
    create: {
      key: "journalMinChars",
      value: { value: 50 },
    },
  });
  await prisma.systemSetting.upsert({
    where: { key: "topicMasteryThreshold" },
    update: {},
    create: {
      key: "topicMasteryThreshold",
      value: { value: 90 },
    },
  });
  console.log("Seeded initial system settings.");

  // --- Comprehensive Test User Seeding ---
  const testUserId = "f8d48b17-6aef-4411-8e6f-0fb9262241a1";
  const testUserEmail = "nik.kowalev@gmail.com";

  console.log(`Starting seed for test user: ${testUserEmail} (${testUserId})`);

  // 1. Clean up existing data for this user to ensure idempotency
  console.log("Cleaning up previous data for test user...");
  await prisma.user.delete({ where: { id: testUserId } }).catch(() => {
    console.log("Test user not found, skipping cleanup.");
  });

  await prisma.$transaction(async (tx) => {
    // 2. Create the User and their Language Profiles
    console.log("Creating user and language profiles...");
    const user = await tx.user.create({
      data: {
        id: testUserId,
        email: testUserEmail,
        supabaseAuthId: testUserId, // Use the same ID for simplicity in test env
        nativeLanguage: "english",
        defaultTargetLanguage: "spanish",
        writingStyle: "Casual",
        writingPurpose: "Personal",
        selfAssessedLevel: "Intermediate",
        onboardingCompleted: true,
        languageProfiles: {
          create: [
            { language: "spanish", aiAssessedProficiency: 65.0 },
            { language: "french", aiAssessedProficiency: 45.0 },
          ],
        },
      },
    });

    // 3. Create Topics
    console.log("Creating topics...");
    const spanishTopic1 = await tx.topic.create({
      data: {
        userId: user.id,
        title: "My Last Vacation",
        targetLanguage: "spanish",
      },
    });
    const spanishTopic2 = await tx.topic.create({
      data: {
        userId: user.id,
        title: "A Favorite Childhood Memory",
        targetLanguage: "spanish",
        isMastered: true,
      },
    });
    const frenchTopic1 = await tx.topic.create({
      data: {
        userId: user.id,
        title: "My Favorite Food",
        targetLanguage: "french",
      },
    });

    // 4. Generate Time-Series Data for Analytics (30 days of entries)
    console.log("Generating 30 days of historical journal data for Spanish...");
    const entries = [];
    let challengingMistake: any = null; // To store a mistake for practice attempts
    let highScoringMistake: any = null; // To store a mistake for filtering test
    let insufficientAttemptsMistake: any = null; // Mistake with <3 attempts

    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const progressFactor = (30 - i) / 30; // 0.03 to 1.0

      const journalEntry = await tx.journalEntry.create({
        data: {
          authorId: user.id,
          topicId: i % 2 === 0 ? spanishTopic1.id : spanishTopic2.id,
          content: encrypt(
            `Este es mi diario del día ${30 - i}. Cada día mi español mejora un poco. Hoy he aprendido nuevas palabras.`,
          ),
          targetLanguage: "spanish",
          createdAt: date,
          updatedAt: date,
        },
      });

      const baseScore = 40 + 40 * progressFactor; // Score from 40 to 80
      const analysis = await tx.analysis.create({
        data: {
          entryId: journalEntry.id,
          grammarScore: Math.min(95, baseScore + (Math.random() - 0.5) * 10),
          phrasingScore: Math.min(95, baseScore + (Math.random() - 0.5) * 10),
          vocabScore: Math.min(95, baseScore + (Math.random() - 0.5) * 10),
          feedbackJson: encrypt(
            `"Good progress on day ${30 - i}. Keep it up!"`,
          ),
          rawAiResponse: encrypt(JSON.stringify({ feedback: "Details..." })),
        },
      });

      const mistake = await tx.mistake.create({
        data: {
          analysisId: analysis.id,
          type: "grammar",
          originalText: encrypt(`yo ser feliz (day ${30 - i})`),
          correctedText: encrypt(`yo soy feliz (day ${30 - i})`),
          explanation: encrypt(
            "Incorrect conjugation of the verb 'ser' (to be).",
          ),
        },
      });

      // Designate specific mistakes for practice analytics testing
      if (i === 28) challengingMistake = mistake; // Day 2, will get low scores
      if (i === 27) highScoringMistake = mistake; // Day 3, will get high scores
      if (i === 26) insufficientAttemptsMistake = mistake; // Day 4, will get <3 attempts
    }

    // 5. Seed Practice Attempts for the designated mistakes
    console.log("Seeding practice attempts for analytics...");
    if (challengingMistake) {
      await tx.practiceAttempt.createMany({
        data: [
          {
            mistakeId: challengingMistake.id,
            userId: user.id,
            score: 20,
            isCorrect: false,
            taskPrompt: "Translate: I am happy",
            expectedAnswer: "Yo soy feliz",
            userAnswer: "Yo ser feliz",
            aiEvaluationJson: encrypt("{}"),
          },
          {
            mistakeId: challengingMistake.id,
            userId: user.id,
            score: 30,
            isCorrect: false,
            taskPrompt: "Translate: I am happy",
            expectedAnswer: "Yo soy feliz",
            userAnswer: "Yo estoy feliz",
            aiEvaluationJson: encrypt("{}"),
          },
          {
            mistakeId: challengingMistake.id,
            userId: user.id,
            score: 40,
            isCorrect: false,
            taskPrompt: "Translate: I am happy",
            expectedAnswer: "Yo soy feliz",
            userAnswer: "Soy feliz",
            aiEvaluationJson: encrypt("{}"),
          },
        ],
      });
    }

    if (highScoringMistake) {
      await tx.practiceAttempt.createMany({
        data: [
          {
            mistakeId: highScoringMistake.id,
            userId: user.id,
            score: 90,
            isCorrect: true,
            taskPrompt: "...",
            expectedAnswer: "...",
            userAnswer: "...",
            aiEvaluationJson: encrypt("{}"),
          },
          {
            mistakeId: highScoringMistake.id,
            userId: user.id,
            score: 95,
            isCorrect: true,
            taskPrompt: "...",
            expectedAnswer: "...",
            userAnswer: "...",
            aiEvaluationJson: encrypt("{}"),
          },
          {
            mistakeId: highScoringMistake.id,
            userId: user.id,
            score: 100,
            isCorrect: true,
            taskPrompt: "...",
            expectedAnswer: "...",
            userAnswer: "...",
            aiEvaluationJson: encrypt("{}"),
          },
        ],
      });
    }
    
    if (insufficientAttemptsMistake) {
       await tx.practiceAttempt.createMany({
        data: [
          { mistakeId: insufficientAttemptsMistake.id, userId: user.id, score: 10, isCorrect: false, taskPrompt: "...", expectedAnswer: "...", userAnswer: "...", aiEvaluationJson: encrypt("{}") },
          { mistakeId: insufficientAttemptsMistake.id, userId: user.id, score: 20, isCorrect: false, taskPrompt: "...", expectedAnswer: "...", userAnswer: "...", aiEvaluationJson: encrypt("{}") },
        ],
      });
    }

    // 6. Seed SRS Deck
    console.log("Seeding SRS deck...");
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);

    await tx.srsReviewItem.createMany({
      data: [
        {
          userId: user.id,
          type: "MISTAKE",
          mistakeId: challengingMistake.id,
          frontContent: "yo ser feliz",
          backContent: "yo soy feliz",
          context: "Incorrect conjugation of the verb 'ser' (to be).",
          targetLanguage: "spanish",
          nextReviewAt: yesterday, // Due for review
        },
        {
          userId: user.id,
          type: "TRANSLATION",
          frontContent: "Hello",
          backContent: "Hola",
          targetLanguage: "spanish",
          nextReviewAt: now, // Due for review
        },
        {
          userId: user.id,
          type: "PRACTICE_MISTAKE",
          mistakeId: highScoringMistake.id,
          frontContent: "Translate: They are happy",
          backContent: "Ellos son felices",
          targetLanguage: "spanish",
          nextReviewAt: now, // Due for review
        },
        {
          userId: user.id,
          type: "TRANSLATION",
          frontContent: "Goodbye",
          backContent: "Adiós",
          targetLanguage: "spanish",
          nextReviewAt: tomorrow, // Not due yet
        },
      ],
    });

    // 7. Seed Suggested Topics
    console.log("Seeding suggested topics...");
    await tx.suggestedTopic.createMany({
        data: [
            { userId: user.id, title: "Describe your favorite movie in Spanish", targetLanguage: "spanish"},
            { userId: user.id, title: "What are your goals for this year?", targetLanguage: "spanish"},
            { userId: user.id, title: "Décris ta routine quotidienne", targetLanguage: "french"},
        ]
    })

    console.log(`Seeding for user ${testUserEmail} completed successfully.`);
  });

  // Seed Reading Materials
  console.log("Seeding reading materials...");
  await prisma.readingMaterial.createMany({
    data: [
      {
        title: encrypt("Un día en la playa"),
        content: encrypt("Hoy fui a la playa. El sol brillaba y el agua estaba perfecta. Vi muchos peces de colores. Fue un día muy divertido."),
        targetLanguage: "spanish",
        level: ReadingLevel.BEGINNER,
        source: "Original Content",
      },
      {
        title: encrypt("La Historia de la Paella"),
        content: encrypt("La paella es un plato famoso de España, originario de Valencia. Se cocina en una sartén ancha y plana llamada paellera. Los ingredientes principales son arroz, azafrán, verduras y carne o marisco. Es un plato social, a menudo preparado para familiares y amigos los domingos."),
        targetLanguage: "spanish",
        level: ReadingLevel.INTERMEDIATE,
        source: "Cultural Summary",
      },
      {
        title: encrypt("Une journée à Paris"),
        content: encrypt("Aujourd'hui, j'ai visité Paris. J'ai vu la Tour Eiffel. C'était très grand. J'ai aussi mangé un croissant. C'était délicieux."),
        targetLanguage: "french",
        level: ReadingLevel.BEGINNER,
        source: "Original Content",
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });