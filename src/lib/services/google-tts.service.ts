
import axios, { AxiosRequestConfig } from "axios";
import { GoogleAuth, GoogleAuthOptions } from "google-auth-library";
import { mapLanguageToGoogleHDVoice } from "@/lib/google-hd-voices";
import { mapLanguageToGoogleBasicVoice } from "@/lib/google-basic-voices";
import { logger } from "../logger";

export interface ITTS {
  synthesizeSpeech(
    text: string,
    languageCode: string,
    voice: string,
  ): Promise<string>;
  getVoice(languageCode: string, quality: "basic" | "hd"): string;
}

export class GoogleTTS implements ITTS {
  private auth!: GoogleAuth;
  private googleProjectId: string;

  constructor() {
    this.validateEnvironment();
    this.googleProjectId = process.env.GOOGLE_CLOUD_PROJECT!;
    this._initializeAuth();
  }

  private _initializeAuth(): void {
    try {
      const authOptions = this._prepareAuthOptions();
      this.auth = new GoogleAuth(authOptions);

      if (!this.googleProjectId) {
        throw new Error(
          "Google Project ID is missing. Set GOOGLE_CLOUD_PROJECT or ensure credentials file contains 'project_id'.",
        );
      }
      logger.info(
        `GoogleTTS service initialized for project: ${this.googleProjectId}`,
      );
    } catch (authError) {
      logger.error("Failed to initialize GoogleAuth instance:", authError);
      throw new Error(
        `Google Auth initialization failed: ${
          authError instanceof Error ? authError.message : String(authError)
        }`,
      );
    }
  }

  private _prepareAuthOptions(): GoogleAuthOptions {
    const authOptions: GoogleAuthOptions = {
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    };

    if (process.env.GOOGLE_CREDENTIALS_BASE64) {
      logger.info("Using GOOGLE_CREDENTIALS_BASE64 for Google Auth.");
      try {
        const rawBase64 = process.env.GOOGLE_CREDENTIALS_BASE64.trim().replace(
          /%/g,
          "",
        );
        const decodedCredentials = Buffer.from(rawBase64, "base64").toString();
        const credentials = JSON.parse(decodedCredentials);
        authOptions.credentials = credentials;

        if (credentials.project_id) {
          this.googleProjectId = credentials.project_id;
        }
      } catch (error) {
        logger.error("Failed to decode/parse GOOGLE_CREDENTIALS_BASE64.", error);
        throw new Error("Invalid Base64 credentials.");
      }
    } else {
      logger.warn(
        "GOOGLE_CREDENTIALS_BASE64 not set. Attempting Application Default Credentials (ADC).",
      );
    }

    return authOptions;
  }

  private async _getAccessToken(): Promise<string> {
    const client = await this.auth.getClient();
    const token = await client.getAccessToken();
    if (!token?.token) {
      throw new Error("Failed to retrieve Google Auth access token.");
    }
    return token.token;
  }

  private async _performTTSRequest(
    accessToken: string,
    requestData: object,
  ): Promise<string> {
    const config: AxiosRequestConfig = {
      method: "post",
      url: "https://texttospeech.googleapis.com/v1/text:synthesize",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-User-Project": this.googleProjectId,
        Authorization: `Bearer ${accessToken}`,
      },
      data: requestData,
      timeout: 10000,
      responseType: "json",
    };

    const response = await axios(config);

    if (response.status >= 400) {
      logger.error("Google TTS API Error:", {
        status: response.status,
        data: response.data,
      });
      throw new Error(
        `Google TTS API Error: ${response.status} - ${
          response.data?.error?.message || "Unknown error"
        }`,
      );
    }

    if (!response.data?.audioContent) {
      logger.error("Invalid response from Google TTS API:", response.data);
      throw new Error("Malformed response from Google TTS - missing audioContent");
    }

    return response.data.audioContent;
  }

  public async synthesizeSpeech(
    text: string,
    languageCode: string,
    voice: string,
  ): Promise<string> {
    try {
      const accessToken = await this._getAccessToken();

      const requestData = {
        input: { text },
        voice: { languageCode, name: voice },
        audioConfig: { audioEncoding: "MP3" },
      };

      return await this._performTTSRequest(accessToken, requestData);
    } catch (error: any) {
      logger.error("Google TTS synthesis failed:", error);
      if (error?.code === "ECONNABORTED") {
        throw new Error(
          "Failed to synthesize speech: Google TTS request timed out",
        );
      }
      throw new Error(
        `Failed to synthesize speech: ${error.message || "Unknown error"}`,
      );
    }
  }

  public getVoice(languageCode: string, quality: "basic" | "hd"): string {
    const voice =
      quality === "hd"
        ? mapLanguageToGoogleHDVoice(languageCode)
        : mapLanguageToGoogleBasicVoice(languageCode);
    logger.info(`Selected voice for ${languageCode} (${quality}): ${voice}`);
    return voice;
  }

  private validateEnvironment(): void {
    if (!process.env.GOOGLE_CLOUD_PROJECT) {
      throw new Error("Missing required environment variable: GOOGLE_CLOUD_PROJECT");
    }
    if (!process.env.GOOGLE_CREDENTIALS_BASE64) {
      logger.warn(
        "GOOGLE_CREDENTIALS_BASE64 is not set. Google Auth will attempt Application Default Credentials (ADC). This might not work in all environments without specific configuration.",
      );
    }
  }
}