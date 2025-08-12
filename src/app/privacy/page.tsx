export default function PrivacyPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 prose dark:prose-invert max-w-4xl">
      <h1>Privacy Policy</h1>
      <p>Last updated: August 05, 2025</p>

      <p>
        This application ("we," "our," or "us") is committed to protecting your
        privacy. This Privacy Policy explains how we handle your information
        when you use our anonymous health risk assessment tool (the "Service").
      </p>

      <h2>1. Anonymity by Design</h2>
      <p>
        The core principle of this Service is user anonymity. We have designed
        the system to avoid collecting or storing any Personally Identifiable
        Information (PII).
      </p>
      <ul>
        <li>
          <strong>No User Accounts:</strong> You do not need to create an
          account to use the Service.
        </li>
        <li>
          <strong>No Personal Data Storage:</strong> We do not ask for,
          collect, or store your name, email address, date of birth, or any
          other direct personal identifiers.
        </li>
        <li>
          <strong>Session-Based Data:</strong> The answers you provide to the
          questionnaire are stored only in your browser's `sessionStorage`. This
          data is automatically deleted when you close your browser tab or
          window. It is never sent to our servers until you click "View
          Results".
        </li>
      </ul>

      <h2>2. Information We Process</h2>
      <p>
        To provide you with an assessment, we process the following information:
      </p>
      <ul>
        <li>
          <strong>Questionnaire Answers:</strong> The answers you provide are
          sent to our backend service and then to a third-party AI provider to
          generate your risk assessment. This data is processed in-memory and is
          not stored or logged in association with any personal identifiers.
        </li>
        <li>
          <strong>IP Address:</strong> Your IP address is used temporarily for
          rate-limiting purposes to prevent abuse of the service. It is not
          stored or linked to your assessment data.
        </li>
        <li>
          <strong>Operational Logs:</strong> We may keep anonymized logs about
          assessment events (e.g., "SUCCESS," "AI_ERROR") for the purpose of
          monitoring our system's health and usage statistics. These logs
          contain no part of your questionnaire data.
        </li>
      </ul>

      <h2>3. "Send-and-Forget" Email Feature</h2>
      <p>
        We offer an optional feature to email your results to you. This process
        is designed to be "send-and-forget":
      </p>
      <ul>
        <li>You voluntarily provide an email address in a form.</li>
        <li>
          Your assessment results and the provided email address are sent to our
          server.
        </li>
        <li>Our server immediately relays this information to our email
          provider (Resend) to send the email.
        </li>
        <li>
          <strong>We do not store your email address on our servers after the
            email has been sent.</strong>
        </li>
      </ul>

      <h2>4. Third-Party Services</h2>
      <ul>
        <li>
          <strong>AI Providers (Google Gemini, etc.):</strong> Your anonymized
          questionnaire answers are sent to our AI providers to generate the
          assessment. This data is subject to their respective privacy policies.
        </li>
        <li>
          <strong>Email Provider (Resend):</strong> If you use the email export
          feature, your email address and results are processed by Resend to
          deliver the email.
        </li>
      </ul>
      
      <h2>5. Your Choices</h2>
        <p>You are in control of your information. You can clear your assessment data at any time by closing your browser tab or starting a new assessment, which clears the previous session's data.</p>
    </div>
  );
}