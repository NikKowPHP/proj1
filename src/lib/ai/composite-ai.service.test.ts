/** @jest-environment node */
import { CompositeAIService } from "./composite-ai.service";
import { GeminiService } from "./gemini-service";
import * as compositeExecutor from "./composite-executor";

// Mock the individual services and the executor
jest.mock("./gemini-service");
jest.mock("./composite-executor");

const mockedGeminiService =
  GeminiService as jest.MockedClass<typeof GeminiService>;
const mockedExecutor =
  compositeExecutor as jest.Mocked<typeof compositeExecutor>;

describe("CompositeAIService", () => {
  let service: CompositeAIService;

  // Mock instances
  let mockGeminiInstance: jest.Mocked<GeminiService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock instances for the services
    mockGeminiInstance =
      new (GeminiService as any)() as jest.Mocked<GeminiService>;

    // Mock the constructors to return our mock instances
    mockedGeminiService.mockImplementation(() => mockGeminiInstance);

    service = new CompositeAIService();
  });

  describe("getPlanExplanation", () => {
    it("should use the fallback executor", async () => {
      mockedExecutor.executeWithFallbacks.mockResolvedValue({
        result: {
          /* mock response */
        },
        serviceUsed: "mock",
      } as any);

      await service.getPlanExplanation({
        derived_variables: { age_years: 30 },
      } as any);

      expect(mockedExecutor.executeWithFallbacks).toHaveBeenCalledTimes(1);
    });
  });
});