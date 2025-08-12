/** @jest-environment node */
import { CompositeAIService } from "./composite-ai.service";
import { CerebrasService } from "./cerebras-service";
import { GroqService } from "./groq-service";
import { GeminiService } from "./gemini-service";
import * as compositeExecutor from "./composite-executor";
import type { AudioEvaluationContext } from "@/lib/types";

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

  describe("analyzeJournalEntry", () => {
    const commonArgs: [
      string,
      string,
      number,
      string,
      null,
      string,
      string,
    ] = ["content", "lang", 50, "native", null, "mode", "user1"];

    it("should call Gemini directly when an imageUrl is provided", async () => {
      const imageUrl = "http://image.com/test.jpg";
      mockGeminiInstance.generateJsonWithImage.mockResolvedValue({
        /* mock response */
      } as any);

      await service.analyzeJournalEntry(...commonArgs, imageUrl);

      expect(mockGeminiInstance.generateJsonWithImage).toHaveBeenCalledTimes(1);
      expect(mockGeminiInstance.generateJsonWithImage).toHaveBeenCalledWith(
        expect.any(String), // The generated prompt
        expect.any(String), // The model
        imageUrl,
      );
      expect(mockedExecutor.executeWithFallbacks).not.toHaveBeenCalled();
    });

    it("should use the fallback executor when no imageUrl is provided", async () => {
      mockedExecutor.executeWithFallbacks.mockResolvedValue({
        result: {
          /* mock response */
        },
        serviceUsed: "mock",
      } as any);

      await service.analyzeJournalEntry(...commonArgs, undefined);

      expect(mockGeminiInstance.generateJsonWithImage).not.toHaveBeenCalled();
      expect(mockedExecutor.executeWithFallbacks).toHaveBeenCalledTimes(1);
    });
  });

  describe("evaluateAudioAnswer", () => {
    it("should call Gemini directly for audio evaluation", async () => {
      const mockContext: AudioEvaluationContext = {
        audioBuffer: Buffer.from(""),
        mimeType: "audio/mp3",
        question: "q",
        idealAnswerSummary: "a",
      };
      mockGeminiInstance.evaluateAudioAnswer.mockResolvedValue({
        /* mock response */
      } as any);

      await service.evaluateAudioAnswer(mockContext);

      expect(mockGeminiInstance.evaluateAudioAnswer).toHaveBeenCalledTimes(1);
      expect(mockGeminiInstance.evaluateAudioAnswer).toHaveBeenCalledWith(
        mockContext,
      );
      expect(mockedExecutor.executeWithFallbacks).not.toHaveBeenCalled();
    });
  });
});