
/** @jest-environment node */

import { GoogleTTS } from "./google-tts.service";
import axios from "axios";
import { GoogleAuth } from "google-auth-library";
import { logger } from "../logger";
import { mapLanguageToGoogleHDVoice } from "@/lib/google-hd-voices";
import { mapLanguageToGoogleBasicVoice } from "@/lib/google-basic-voices";

// Mock dependencies
jest.mock("axios");
jest.mock("google-auth-library");
jest.mock("../logger");
jest.mock("@/lib/google-hd-voices");
jest.mock("@/lib/google-basic-voices");

const mockedAxios = axios as jest.MockedFunction<typeof axios>;
const mockedGoogleAuth = GoogleAuth as jest.MockedClass<typeof GoogleAuth>;
const mockedLogger = logger as jest.Mocked<typeof logger>;
const mockedMapHDVoice = mapLanguageToGoogleHDVoice as jest.Mock;
const mockedMapBasicVoice = mapLanguageToGoogleBasicVoice as jest.Mock;

describe("GoogleTTS Service", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules(); // Clear cache to re-evaluate env vars
    process.env = { ...originalEnv }; // Restore original env
    jest.clearAllMocks(); // Clear mocks

    // Mock the GoogleAuth constructor and its methods
    (mockedGoogleAuth as jest.Mock).mockImplementation(() => ({
      getClient: jest.fn().mockResolvedValue({
        getAccessToken: jest
          .fn()
          .mockResolvedValue({ token: "fake-access-token" }),
      }),
    }));
  });

  afterAll(() => {
    process.env = originalEnv; // Restore env after all tests
  });

  describe("Constructor and Initialization", () => {
    it("should throw an error if GOOGLE_CLOUD_PROJECT is not set", () => {
      delete process.env.GOOGLE_CLOUD_PROJECT;
      expect(() => new GoogleTTS()).toThrow(
        "Missing required environment variable: GOOGLE_CLOUD_PROJECT",
      );
    });

    it("should initialize with Base64 credentials", () => {
      process.env.GOOGLE_CLOUD_PROJECT = "test-project";
      const creds = { client_email: "test@test.com", private_key: "key" };
      process.env.GOOGLE_CREDENTIALS_BASE64 = Buffer.from(
        JSON.stringify(creds),
      ).toString("base64");

      new GoogleTTS();
      expect(mockedGoogleAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          credentials: creds,
        }),
      );
    });

    it("should throw an error for invalid Base64 credentials", () => {
      process.env.GOOGLE_CLOUD_PROJECT = "test-project";
      process.env.GOOGLE_CREDENTIALS_BASE64 = "invalid-base64";
      expect(() => new GoogleTTS()).toThrow("Invalid Base64 credentials.");
    });

    it("should warn if no credentials are provided (ADC case)", () => {
      process.env.GOOGLE_CLOUD_PROJECT = "test-project";
      delete process.env.GOOGLE_CREDENTIALS_BASE64;

      new GoogleTTS();
      expect(mockedLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Attempting Application Default Credentials"),
      );
    });
  });

  describe("synthesizeSpeech", () => {
    let service: GoogleTTS;
    beforeEach(() => {
      process.env.GOOGLE_CLOUD_PROJECT = "test-project";
      service = new GoogleTTS();
    });

    it("should synthesize speech successfully", async () => {
      mockedAxios.mockResolvedValue({
        status: 200,
        data: { audioContent: "base64-audio-content" },
      });

      const result = await service.synthesizeSpeech(
        "Hello",
        "en-US",
        "en-US-Wavenet-A",
      );

      expect(result).toBe("base64-audio-content");
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "https://texttospeech.googleapis.com/v1/text:synthesize",
          data: {
            input: { text: "Hello" },
            voice: { languageCode: "en-US", name: "en-US-Wavenet-A" },
            audioConfig: { audioEncoding: "MP3" },
          },
        }),
      );
    });

    it("should throw an error for a failed API call", async () => {
      mockedAxios.mockResolvedValue({
        status: 403,
        data: { error: { message: "Permission denied" } },
      });

      await expect(
        service.synthesizeSpeech("Test", "en-US", "en-US-Wavenet-A"),
      ).rejects.toThrow("Failed to synthesize speech: Google TTS API Error: 403 - Permission denied");
    });

    it("should throw an error if the response is malformed", async () => {
      mockedAxios.mockResolvedValue({
        status: 200,
        data: { notAudioContent: "wrong-key" },
      });

      await expect(
        service.synthesizeSpeech("Test", "en-US", "en-US-Wavenet-A"),
      ).rejects.toThrow("Malformed response from Google TTS - missing audioContent");
    });

    it("should throw a specific error on request timeout", async () => {
      const axiosError = new Error("Timeout");
      (axiosError as any).code = "ECONNABORTED";
      mockedAxios.mockRejectedValue(axiosError);

      await expect(
        service.synthesizeSpeech("Test", "en-US", "en-US-Wavenet-A"),
      ).rejects.toThrow("Failed to synthesize speech: Google TTS request timed out");
    });
  });

  describe("getVoice", () => {
    let service: GoogleTTS;
    beforeEach(() => {
      process.env.GOOGLE_CLOUD_PROJECT = "test-project";
      service = new GoogleTTS();
    });

    it("should call mapLanguageToGoogleHDVoice for 'hd' quality", () => {
      service.getVoice("es-ES", "hd");
      expect(mockedMapHDVoice).toHaveBeenCalledWith("es-ES");
    });

    it("should call mapLanguageToGoogleBasicVoice for 'basic' quality", () => {
      service.getVoice("de-DE", "basic");
      expect(mockedMapBasicVoice).toHaveBeenCalledWith("de-DE");
    });
  });
});