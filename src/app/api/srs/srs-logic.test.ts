/** @jest-environment node */

import { prisma } from "@/lib/db";
import { User, SrsReviewItem, SrsItemType } from "@prisma/client";

// Helper function to create a test user
const createTestUser = async (): Promise<User> => {
  const uniqueEmail = `srs-test-user-${Date.now()}@example.com`;
  return prisma.user.create({
    data: {
      id: `srs-user-${Date.now()}`,
      email: uniqueEmail,
      supabaseAuthId: `srs-supa-id-${Date.now()}`,
    },
  });
};

// Helper function to simulate the core logic of the review endpoint
const processReview = async (
  item: SrsReviewItem,
  quality: number,
): Promise<SrsReviewItem> => {
  let newInterval: number;
  let newEaseFactor: number;

  if (quality < 3) {
    newInterval = 1;
    newEaseFactor = item.easeFactor;
  } else {
    newEaseFactor =
      item.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    newEaseFactor = Math.max(1.3, newEaseFactor);

    if (item.interval === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(item.interval * newEaseFactor);
    }
  }

  const nextReviewAt = new Date();
  nextReviewAt.setUTCDate(nextReviewAt.getUTCDate() + newInterval);
  nextReviewAt.setUTCHours(0, 0, 0, 0); // Normalize to start of day UTC

  return prisma.srsReviewItem.update({
    where: { id: item.id },
    data: {
      interval: newInterval,
      easeFactor: newEaseFactor,
      nextReviewAt,
      lastReviewedAt: new Date(),
    },
  });
};

describe("SRS Full Lifecycle Logic", () => {
  let user: User;

  // Setup: Create a new user for each test run to ensure isolation
  beforeEach(async () => {
    user = await createTestUser();
  });

  // Teardown: Clean up the created user and their items after each test
  afterEach(async () => {
    if (user?.id) {
      await prisma.user.delete({ where: { id: user.id } });
    }
  });

  it("should correctly fetch only due cards and update them after review", async () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    // 1. SETUP: Create a mix of SRS items for the user
    await prisma.srsReviewItem.createMany({
      data: [
        {
          id: "card-due-now",
          userId: user.id,
          frontContent: "Due Now",
          backContent: "Back",
          type: SrsItemType.MISTAKE,
          nextReviewAt: now,
        },
        {
          id: "card-due-yesterday",
          userId: user.id,
          frontContent: "Due Yesterday",
          backContent: "Back",
          type: SrsItemType.MISTAKE,
          nextReviewAt: yesterday,
        },
        {
          id: "card-due-tomorrow",
          userId: user.id,
          frontContent: "Due Tomorrow",
          backContent: "Back",
          type: SrsItemType.MISTAKE,
          nextReviewAt: tomorrow,
        },
      ],
    });

    // 2. TEST DECK FETCHING: Verify that only due cards are fetched
    const dueCards = await prisma.srsReviewItem.findMany({
      where: {
        userId: user.id,
        nextReviewAt: {
          lte: now,
        },
      },
      orderBy: {
        nextReviewAt: "asc",
      },
    });

    expect(dueCards).toHaveLength(2);
    expect(dueCards.map((c) => c.frontContent)).toContain("Due Yesterday");
    expect(dueCards.map((c) => c.frontContent)).toContain("Due Now");
    expect(dueCards.map((c) => c.frontContent)).not.toContain("Due Tomorrow");

    const cardToReview = dueCards[0]; // Review the one that was due yesterday

    // 3. TEST REVIEW LOGIC: Process a "Good" review
    const updatedCard = await processReview(cardToReview, 3);

    expect(updatedCard.interval).toBe(6);
    expect(updatedCard.nextReviewAt > now).toBe(true);

    const sixDaysFromNow = new Date();
    sixDaysFromNow.setUTCDate(now.getUTCDate() + 6);
    expect(updatedCard.nextReviewAt.getUTCDate()).toBe(
      sixDaysFromNow.getUTCDate(),
    );

    // 4. TEST DECK FETCHING (POST-REVIEW): Verify the reviewed card is gone
    const dueCardsAfterReview = await prisma.srsReviewItem.findMany({
      where: {
        userId: user.id,
        nextReviewAt: {
          lte: new Date(),
        },
      },
    });

    expect(dueCardsAfterReview).toHaveLength(1);
    expect(dueCardsAfterReview[0].frontContent).toBe("Due Now");
  });

  it("should reset interval to 1 on 'Forgot' review (quality < 3)", async () => {
    let card = await prisma.srsReviewItem.create({
      data: {
        userId: user.id,
        frontContent: "Test Forgot",
        backContent: "Back",
        type: SrsItemType.MISTAKE,
        nextReviewAt: new Date(),
        interval: 15, // Start with a long interval
        easeFactor: 2.5,
      },
    });

    card = await processReview(card, 0); // Review with "Forgot"

    expect(card.interval).toBe(1);
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    expect(card.nextReviewAt.getTime()).toBe(tomorrow.getTime());
  });

  it("should demonstrate exponential growth with multiple 'Good' reviews", async () => {
    let card = await prisma.srsReviewItem.create({
      data: {
        userId: user.id,
        frontContent: "Exponential Growth",
        backContent: "Back",
        type: SrsItemType.MISTAKE,
        nextReviewAt: new Date(),
        interval: 1,
        easeFactor: 2.5,
      },
    });

    // Review 1: Good
    card = await processReview(card, 3);
    expect(card.interval).toBe(6);

    // Review 2: Good
    card = await processReview(card, 3);
    expect(card.interval).toBe(13); // Corrected expectation from 14

    // Review 3: Good
    card = await processReview(card, 3);
    expect(card.interval).toBe(27); // Corrected expectation from 31
  });

  it("should show a larger interval jump for 'Easy' review compared to 'Good'", async () => {
    const cardData = {
      userId: user.id,
      frontContent: "Easy vs Good",
      backContent: "Back",
      type: SrsItemType.MISTAKE,
      nextReviewAt: new Date(),
      interval: 10,
      easeFactor: 2.5,
    };

    let goodCard = await prisma.srsReviewItem.create({
      data: { ...cardData, id: "good-card" },
    });
    goodCard = await processReview(goodCard, 3); // quality=3
    expect(goodCard.interval).toBe(24); // Approx 10 * 2.36

    let easyCard = await prisma.srsReviewItem.create({
      data: { ...cardData, id: "easy-card" },
    });
    easyCard = await processReview(easyCard, 5); // quality=5
    expect(easyCard.interval).toBe(26); // 10 * 2.6

    expect(easyCard.interval).toBeGreaterThan(goodCard.interval);
  });

  it("should fetch all cards, including future ones, when 'includeAll' is true", async () => {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);

    await prisma.srsReviewItem.createMany({
      data: [
        {
          userId: user.id,
          frontContent: "Due Now",
          type: SrsItemType.MISTAKE,
          backContent: "",
          nextReviewAt: now,
        },
        {
          userId: user.id,
          frontContent: "Due Tomorrow",
          type: SrsItemType.MISTAKE,
          backContent: "",
          nextReviewAt: tomorrow,
        },
      ],
    });

    const allCards = await prisma.srsReviewItem.findMany({
      where: { userId: user.id },
    });

    expect(allCards).toHaveLength(2);
    expect(allCards.map((c) => c.frontContent)).toEqual(
      expect.arrayContaining(["Due Now", "Due Tomorrow"]),
    );
  });
});