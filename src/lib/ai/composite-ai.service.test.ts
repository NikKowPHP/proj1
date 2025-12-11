/** @jest-environment node */
import { CompositeAIService } from "./composite-ai.service";
import { CerebrasService } from "./cerebras-service";
import { GroqService } from "./groq-service";
import { GeminiService } from "./gemini-service";
import * as compositeExecutor from "./composite-executor";

// Mock the individual services and the executor
jest.mock("./cerebras-service");
jest.mock("./groq-service");
jest.mock("./gemini-service");
jest.mock("./composite-executor");

const mockedCerebrasService =
  CerebrasService as jest.MockedClass<typeof CerebrasService>;
const mockedGroqService = GroqService as jest.MockedClass<typeof GroqService>;
const mockedGeminiService =
  GeminiService as jest.MockedClass<typeof GeminiService>;
const mockedExecutor =
  compositeExecutor as jest.Mocked<typeof compositeExecutor>;

describe("CompositeAIService", () => {
  let service: CompositeAIService;

  // Mock instances
  let mockCerebrasInstance: jest.Mocked<CerebrasService>;
  let mockGroqInstance: jest.Mocked<GroqService>;
  let mockGeminiInstance: jest.Mocked<GeminiService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock instances for the services
    mockCerebrasInstance =
      new (CerebrasService as any)() as jest.Mocked<CerebrasService>;
    mockGroqInstance = new (GroqService as any)() as jest.Mocked<GroqService>;
    mockGeminiInstance =
      new (GeminiService as any)() as jest.Mocked<GeminiService>;

    // Mock the constructors to return our mock instances
    mockedCerebrasService.mockImplementation(() => mockCerebrasInstance);
    mockedGroqService.mockImplementation(() => mockGroqInstance);
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

      await service.getPlanExplanation({} as any);

      expect(mockedExecutor.executeWithFallbacks).toHaveBeenCalledTimes(1);
    });
  });
});