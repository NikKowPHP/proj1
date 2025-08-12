export const getSentenceCompletionPrompt = (text: string) => `
      You are an AI writing assistant. Your task is to complete the sentence fragment provided by the user.
      Your response MUST ONLY contain the text that should be appended to the user's input to complete the sentence. Do NOT repeat the user's original text.
      For example, if the user's input is "I am going to the", a good response would be " park.".

      Here is the user's input:
      "${text}"
    `;
