import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function CookiesPage() {
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
      <h1 className="text-2xl font-bold mb-4">Cookie Policy</h1>
      <p>Last updated: July 16, 2024</p>

      <p>
        Lexity ("us", "we", or "our") uses cookies on our website (the
        "Service"). By using the Service, you consent to the use of cookies.
      </p>

      <p>
        Our Cookie Policy explains what cookies are, how we use cookies, how
        third-parties we may partner with may use cookies on the Service, your
        choices regarding cookies, and further information about cookies.
      </p>

      <h2>What are cookies?</h2>
      <p>
        Cookies are small pieces of text sent by your web browser by a website
        you visit. A cookie file is stored in your web browser and allows the
        Service or a third-party to recognize you and make your next visit
        easier and the Service more useful to you.
      </p>

      <h2>How Lexity uses cookies</h2>
      <p>
        When you use and access the Service, we may place a number of cookie
        files in your web browser. We use cookies for the following purposes:
      </p>

      <h3>1. Essential Cookies</h3>
      <p>
        These cookies are necessary for the website to function and cannot be
        switched off in our systems. They are essential for you to browse the
        website and use its features, such as accessing secure areas of the
        site.
      </p>
      <ul>
        <li>
          <strong>Supabase Auth:</strong> We use Supabase for user
          authentication. Supabase sets a secure, http-only cookie to manage
          your login session. This is critical for keeping your account secure
          and maintaining your signed-in state as you navigate the app.
        </li>
      </ul>

      <h3>2. Functional Cookies (Local Storage)</h3>
      <p>
        These are not traditional cookies, but use your browser's "Local
        Storage" feature. This allows us to remember choices you make and
        provide enhanced, more personal features. We use local storage for:
      </p>
      <ul>
        <li>
          <strong>Theme Preference:</strong> To remember your light or dark mode
          preference across visits.
        </li>
        <li>
          <strong>Language Preference:</strong> To remember your currently
          selected target language for a seamless learning experience.
        </li>
        <li>
          <strong>Cookie Consent:</strong> To remember whether you have accepted
          our cookie policy so we don't have to ask you again on every visit.
        </li>
      </ul>

      <h2>Your choices regarding cookies</h2>
      <p>
        If you'd like to delete cookies or instruct your web browser to delete
        or refuse cookies, please visit the help pages of your web browser.
      </p>
      <p>
        Please note, however, that if you delete cookies or refuse to accept
        them, you might not be able to use all of the features we offer, you may
        not be able to store your preferences, and some of our pages might not
        display properly. Our essential authentication cookie is required to log
        in to the service.
      </p>

      <h2>Where can you find more information about cookies?</h2>
      <p>
        You can learn more about cookies and the following third-party websites:
      </p>
      <ul>
        <li>
          AllAboutCookies:{" "}
          <a
            href="http://www.allaboutcookies.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            http://www.allaboutcookies.org/
          </a>
        </li>
        <li>
          Network Advertising Initiative:{" "}
          <a
            href="http://www.networkadvertising.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            http://www.networkadvertising.org/
          </a>
        </li>
      </ul>
    </div>
  );
}