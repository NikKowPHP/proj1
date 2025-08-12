/** @jest-environment node */
import { GeminiService } from "./gemini-service";
import * as keyProvider from "./gemini-key-provider";
import { withRetry } from "../utils/withRetry";
import axios from "axios";

// Mock our key provider module
jest.mock("./gemini-key-provider");

// Mock the withRetry utility to prevent delays and multiple attempts in this test suite
jest.mock("../utils/withRetry", () => ({
  withRetry: jest.fn((fn) => fn()),
}));

// Mock axios
jest.mock("axios");

const mockedKeyProvider = keyProvider as jest.Mocked<typeof keyProvider>;
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("GeminiService with Key Rotation (REST)", () => {
  let service: GeminiService;

  beforeEach(() => {
    jest.clearAllMocks();
    (withRetry as jest.Mock).mockImplementation((fn) => fn());
    service = new GeminiService();
  });

  it("should succeed on the first key if it is valid", async () => {
    mockedKeyProvider.getAllKeys.mockReturnValue(["valid-key-1"]);
    mockedAxios.post.mockResolvedValue({
      data: {
        candidates: [
          { content: { parts: [{ text: '{"feedback": "Great job!"}' }] } },
        ],
      },
    });

    const result = await service.generateJson(
      "Test content",
      "gemini-2.5-flash",
    );

    expect(result).toEqual({ feedback: "Great job!" });
    expect(mockedKeyProvider.getAllKeys).toHaveBeenCalledTimes(1);
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining("models/gemini-2.5-flash:generateContent"),
      expect.any(Object),
      { headers: { "x-goog-api-key": "valid-key-1" } },
    );
  });

  it("should failover to another key if one is rate-limited (429)", async () => {
    mockedKeyProvider.getAllKeys.mockReturnValue([
      "rate-limited-key",
      "valid-key-2",
    ]);

    // First call fails with a 429-like error, second call succeeds
    mockedAxios.post
      .mockRejectedValueOnce({ response: { status: 429 } })
      .mockResolvedValueOnce({
        data: {
          candidates: [
            {
              content: {
                parts: [{ text: '{"feedback": "Success on second key!"}' }],
              },
            },
          ],
        },
      });

    const result = await service.generateJson(
      "Test content",
      "gemini-2.5-flash",
    );

    expect(result).toEqual({ feedback: "Success on second key!" });
    expect(mockedKeyProvider.getAllKeys).toHaveBeenCalledTimes(1);
    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      { headers: { "x-goog-api-key": "rate-limited-key" } },
    );
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      { headers: { "x-goog-api-key": "valid-key-2" } },
    );
  });

  it("should throw an error if all keys fail", async () => {
    mockedKeyProvider.getAllKeys.mockReturnValue(["key1", "key2"]);

    mockedAxios.post.mockRejectedValue({
      response: { status: 401 },
      message: "API key not valid",
    });

    await expect(
      service.generateJson("Test content", "gemini-2.5-flash"),
    ).rejects.toThrow(
      "All Gemini API keys failed. Last error: API key not valid",
    );

    expect(mockedKeyProvider.getAllKeys).toHaveBeenCalledTimes(1);
    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
  });

  it("should throw immediately for non-rotation errors", async () => {
    mockedKeyProvider.getAllKeys.mockReturnValue(["key1", "key2"]);

    const nonRotationError = new Error("Invalid request");
    mockedAxios.post.mockRejectedValue(nonRotationError);

    await expect(
      service.generateJson("Test content", "gemini-2.5-flash"),
    ).rejects.toThrow("Invalid request");

    // It should only try once
    expect(mockedKeyProvider.getAllKeys).toHaveBeenCalledTimes(1);
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });
});

describe("GeminiService Audio/Image Evaluation (REST)", () => {
  let service: GeminiService;

  beforeEach(() => {
    jest.clearAllMocks();
    (withRetry as jest.Mock).mockImplementation((fn) => fn());
    mockedKeyProvider.getAllKeys.mockReturnValue(["valid-key"]);
    service = new GeminiService();
  });

  it("should handle audio evaluation successfully, including file cleanup", async () => {
    const mockAudioContext = {
      audioBuffer: Buffer.from("fake-audio"),
      mimeType: "audio/mp3",
      question: "test question",
      idealAnswerSummary: "summary",
    };
    const mockApiResponse = {
      data: {
        candidates: [
          { content: { parts: [{ text: '{"transcription":"test"}' }] } },
        ],
      },
    };
    const mockUploadedFile = {
      name: "files/temp-file-name",
      uri: "some-uri",
      mimeType: "audio/mp3",
    };

    // Mock the sequence of axios calls
    mockedAxios.post
      // 1. Start resumable upload
      .mockResolvedValueOnce({
        headers: { "x-goog-upload-url": "https://upload.url" },
      })
      // 2. Finalize upload
      .mockResolvedValueOnce({ data: { file: mockUploadedFile } })
      // 3. Generate content
      .mockResolvedValueOnce(mockApiResponse);
    // 4. Delete file
    mockedAxios.delete.mockResolvedValue({});

    const result = await service.evaluateAudioAnswer(mockAudioContext);

    expect(result).toEqual({ transcription: "test" });
    expect(mockedAxios.post).toHaveBeenCalledTimes(3);
    expect(mockedAxios.delete).toHaveBeenCalledTimes(1);
    expect(mockedAxios.delete).toHaveBeenCalledWith(
      expect.stringContaining(mockUploadedFile.name),
      { headers: { "x-goog-api-key": "valid-key" } },
    );
  });
});