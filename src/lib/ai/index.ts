import { CompositeAIService } from "./composite-ai.service";

let aiServiceInstance: CompositeAIService;

/**
 * Factory function to get a singleton instance of the CompositeAIService.
 * @returns An instance of the CompositeAIService.
 */
export function getAIService(): CompositeAIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new CompositeAIService();
  }
  return aiServiceInstance;
}