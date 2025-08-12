import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 prose dark:prose-invert max-w-4xl">
      <div className="mb-8">
        <Button asChild variant="ghost" className="pl-0">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
      <h1>Terms of Service</h1>
      <p>Last updated: August 05, 2025</p>
      <p>
        By using this anonymous health risk assessment tool (the "Service"), you
        agree to these Terms of Service.
      </p>

      <h2>1. Not Medical Advice</h2>
      <p>
        The Service provides information for educational and informational
        purposes only. It is not intended as a substitute for professional
        medical advice, diagnosis, or treatment for any health condition. The information provided by
        the AI is based on statistical data and general knowledge and cannot
        replace a consultation with a qualified healthcare provider who can
        assess your individual health needs.
      </p>

      <h2>2. No Warranty</h2>
      <p>
        The Service is provided "as is" without any warranties of any kind,
        express or implied. We do not warrant the accuracy, completeness, or
        usefulness of any information presented. You rely on the information provided
        by this Service at your own risk.
      </p>

      <h2>3. Limitation of Liability</h2>
      <p>
        In no event shall we or our affiliates be liable for any damages,
        including but not limited to direct, indirect, incidental, special, or
        consequential damages, arising out of or in connection with your use of
        or inability to use the Service.
      </p>
      
      <h2>4. Use of Service</h2>
      <p>
        You agree to use the Service responsibly and not to misuse it. Misuse
        includes, but is not limited to, attempting to overload the system,
        interfering with its security, or using it for any unlawful purpose. We
        employ rate-limiting to ensure fair access for all users.
      </p>

      <h2>5. Changes to Terms</h2>
      <p>
        We reserve the right to modify these terms at any time. We will post the
        most current version of these terms on this page. By continuing to use
        the Service after changes have been made, you agree to be bound by the
        revised terms.
      </p>
    </div>
  );
}