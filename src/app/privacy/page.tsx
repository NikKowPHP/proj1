
export default function PrivacyPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 prose dark:prose-invert max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>
      <p>Last updated: July 18, 2025</p>

      <p>
        Lexity ("we," "our," or "us") is committed to protecting your
        privacy. This Privacy Policy explains how we collect, use, disclose, and
        safeguard your information when you use our application.
      </p>

      <h2>1. Information We Collect</h2>
      <p>We may collect information about you in a variety of ways.</p>
      <ul>
        <li>
          <strong>Account and Profile Information:</strong> Personally
          identifiable information you provide when you register and configure
          your account, such as your email address, native language, target
          language(s), writing style, writing purpose, and self-assessed skill
          level.
        </li>
        <li>
          <strong>User-Generated Content:</strong> All journal entries, text,
          and content you create and submit within the application for the
          purpose of analysis and learning.
        </li>
        <li>
          <strong>Usage and Analytics Data:</strong> To help us improve the
          application, we use third-party analytics services (PostHog) to
          collect information about how you interact with our app. This includes
          actions you take, such as submitting a journal, reviewing a flashcard,
          or using the translator. We identify you in our analytics by your user
          ID and email address to understand your usage patterns.
        </li>
        <li>
          <strong>Derivative Data:</strong> Information our servers
          automatically collect, such as your IP address and browser type, when
          you access the app.
        </li>
        <li>
          <strong>Financial Data:</strong> We do not collect or store any
          payment information. All financial data is collected and stored by our
          payment processor, Stripe. We encourage you to review their privacy
          policy.
        </li>
      </ul>

      <h2>2. Use of Your Information</h2>
      <p>
        Having accurate information about you permits us to provide you with a
        smooth, efficient, and customized experience. Specifically, we may use
        information collected about you via the application to:
      </p>
      <ul>
        <li>Create and manage your account.</li>
        <li>Process your journal entries for AI-powered analysis.</li>
        <li>
          Personalize and improve your user experience by tracking your
          progress.
        </li>
        <li>
          Generate personalized forecasts to predict your future progress based
          on your performance data.
        </li>
        <li>
          Email you regarding your account or periodic progress reports if you
          opt-in.
        </li>
        <li>Process payments and refunds through our payment processor.</li>
        <li>Monitor and analyze usage and trends to improve the Service.</li>
      </ul>

      <h2>3. Disclosure of Your Information (Third-Party Sharing)</h2>
      <p>
        We may share information we have collected about you in certain
        situations.
      </p>
      <ul>
        <li>
          <strong>AI Service Providers:</strong> We send your journal entry
          content to our third-party AI service provider (currently Google
          Gemini API) for the sole purpose of providing analysis and feedback.
          This data is processed according to their terms and privacy policies.
          We do not send personally identifiable information like your email
          along with your journal content.
        </li>
        <li>
          <strong>Authentication and Storage:</strong> We use Supabase for user
          authentication and database hosting. Your email and encrypted password
          hash are managed by Supabase.
        </li>
        <li>
          <strong>Payment Processing:</strong> We use Stripe for payment
          processing. Your payment details are sent directly to Stripe and are
          not stored on our servers.
        </li>
        <li>
          <strong>Analytics Services:</strong> We use PostHog for product
          analytics. We send usage data, which may include your user ID and
          email, to PostHog to help us understand how you use our service and
          where we can make improvements.
        </li>
        <li>
          <strong>Email Services:</strong> We use Resend to send transactional
          emails and periodic progress reports. Your email address is shared
          with Resend for this purpose.
        </li>
        <li>
          <strong>By Law or to Protect Rights:</strong> If we believe the
          release of information about you is necessary to respond to legal
          process, to investigate or remedy potential violations of our

          policies, or to protect the rights, property, and safety of others, we
          may share your information as permitted or required by any applicable
          law, rule, or regulation.
        </li>
      </ul>

      <h2>4. Your Rights and Choices</h2>
      <ul>
        <li>
          <strong>Account Information:</strong> You may at any time review or
          change the information in your account or terminate your account by
          logging into your account settings.
        </li>
        <li>
          <strong>Data Export:</strong> You have the right to request an export
          of your user-generated content (journal entries and analyses). This
          can be done from your account settings page.
        </li>
        <li>
          <strong>Data Deletion:</strong> You can request the deletion of your
          account and associated data from your account settings page. This
          initiates a two-stage deletion process. Your account is first marked
          for deletion and becomes inactive. After a 14-day grace period, all of
          your data is permanently and irreversibly erased from our systems.
        </li>
      </ul>

      <h2>5. Security of Your Information</h2>
      <p>
        We use administrative, technical, and physical security measures to help
        protect your personal information. While we have taken reasonable steps
        to secure the personal information you provide to us, please be aware
        that no security measures are perfect or impenetrable, and no method of
        data transmission can be guaranteed against any interception or other
        type of misuse.
      </p>
      <p>Specifically, we implement the following key security measures:</p>
      <ul>
        <li>
          <strong>Encryption at Rest:</strong> All of your user-generated
          content, including journal entries and AI feedback, is encrypted at
          rest in our database using industry-standard AES-256-GCM encryption.
        </li>
        <li>
          <strong>Secure Authentication:</strong> User authentication is handled
          by Supabase, which provides secure management of passwords and login
          sessions.
        </li>
        <li>
          <strong>Secure Payments:</strong> We do not store your payment card
          details. All payment processing is handled securely by Stripe, a
          PCI-compliant payment processor.
        </li>
      </ul>
    </div>
  );
}