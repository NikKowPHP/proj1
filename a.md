<reasoning>
I will implement Phase 6 and Phase 7 of the alignment plan.

**Phase 6: PDF Generator Updates**
1.  **Update `src/lib/utils/pdf-generator.ts`**:
    *   Update the `disclaimer` text in the `translations` object to match the exact phrasing from the PDF specifications ("information to support discussion with a doctor / not a diagnosis").
    *   Ensure the answer filtering logic explicitly excludes keys containing `_score` or `derived.` to prevent numeric risk scores from appearing in the PDF, as per the "no risk scores" constraint.

**Phase 7: UX / Microcopy (Localization)**
1.  **Update `messages/en.json` and `messages/pl.json`**:
    *   Add `biologicalFamilyHelper` with the definition of biological family.
    *   Add `decadeHelper` for smoking years.
    *   Add `approximateOk` helper.
2.  **Update `src/components/assessment/FamilyCancerHistory.tsx`**:
    *   Display the `biologicalFamilyHelper` text at the top of the component to guide users.
3.  **Update `src/components/assessment/SmokingDetails.tsx`**:
    *   Display the `decadeHelper` text near the `smoking.years_smoked` input.

**Task Tracking**
*   Update `TASKS.md` to mark Phase 6 and 7 as complete.
</reasoning>
<modifications>
<file path="messages/en.json">
<![CDATA[
{
  "HomePage": {
    "title": "ONKONO",
    "description": "Your personalized guide to proactive cancer screening. Answer a few questions to build a confidential, actionable plan.",
    "ctaButton": "Start My Assessment",
    "disclaimerTitle": "Important Disclaimer",
    "disclaimerContent1": "This tool provides information for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. The assessment is based on statistical data and cannot account for individual health conditions.",
    "disclaimerContent2": "<strong>Always consult with a qualified healthcare provider</strong> regarding any medical concerns or before making any decisions related to your health. We do not store any personally identifiable information."
  },
  "AppFooter": {
    "copyright": "© {year} ONKONO. All rights reserved.",
    "privacyPolicy": "Privacy Policy",
    "termsOfService": "Terms of Service"
  },
  "PrivacyPage": {
    "backToHome": "Back to Home",
    "title": "Privacy Policy",
    "lastUpdated": "Last updated: August 05, 2025",
    "intro": "This application (\"we,\" \"our,\" or \"us\") is committed to protecting your privacy. This Privacy Policy explains how we handle your information when you use our proactive health planner (the \"Service\").",
    "anonymityTitle": "1. Anonymity by Design",
    "anonymityIntro": "The core principle of this Service is user anonymity. We have designed the system to avoid collecting or storing any Personally Identifiable Information (PII).",
    "anonymityPoint1": "<strong>No User Accounts:</strong> You do not need to create an account to use the Service.",
    "anonymityPoint2": "<strong>No Personal Data Storage:</strong> We do not ask for, collect, or store your name, email address, date of birth, or any other direct personal identifiers.",
    "anonymityPoint3": "<strong>Session-Based Data:</strong> The answers you provide to the questionnaire are stored only in your browser's local storage. This data is automatically deleted if you start a new assessment. It is never sent to our servers until you click \"View Results\".",
    "processingTitle": "2. Information We Process",
    "processingIntro": "To provide you with an assessment, we process the following information:",
    "processingPoint1": "<strong>Questionnaire Answers:</strong> The answers you provide are sent to our backend service and then to a third-party AI provider to generate your preventive health plan. This data is processed in-memory and is not stored or logged in association with any personal identifiers.",
    "processingPoint2": "<strong>IP Address:</strong> Your IP address is used temporarily for rate-limiting purposes to prevent abuse of the service. It is not stored or linked to your assessment data.",
    "processingPoint3": "<strong>Operational Logs:</strong> We may keep anonymized logs about assessment events (e.g., \"SUCCESS,\" \"AI_ERROR\") for the purpose of monitoring our system's health and usage statistics. These logs contain no part of your questionnaire data.",
    "emailTitle": "3. \"Send-and-Forget\" Email Feature",
    "emailIntro": "We offer an optional feature to email your results to you. This process is designed to be \"send-and-forget\":",
    "emailPoint1": "You voluntarily provide an email address in a form.",
    "emailPoint2": "Your assessment results and the provided email address are sent to our server.",
    "emailPoint3": "Our server immediately relays this information to our email provider (Resend) to send the email.",
    "emailPoint4": "<strong>We do not store your email address on our servers after the email has been sent.</strong>",
    "thirdPartyTitle": "4. Third-Party Services",
    "thirdPartyPoint1": "<strong>AI Providers (Google Gemini, etc.):</strong> Your anonymized questionnaire answers are sent to our AI providers to generate the assessment. This data is subject to their respective privacy policies.",
    "thirdPartyPoint2": "<strong>Email Provider (Resend):</strong> If you use the email export feature, your email address and results are processed by Resend to deliver the email.",
    "choicesTitle": "5. Your Choices",
    "choicesContent": "You are in control of your information. You can clear your assessment data at any time by closing your browser tab or starting a new assessment, which clears the previous session's data."
  },
  "TermsPage": {
    "backToHome": "Back to Home",
    "title": "Terms of Service",
    "lastUpdated": "Last updated: August 05, 2025",
    "intro": "By using this proactive health planner (the \"Service\"), you agree to these Terms of Service.",
    "notMedicalAdviceTitle": "1. Not Medical Advice",
    "notMedicalAdviceContent": "The Service provides information for educational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. This tool does not calculate risk scores; it generates recommendations based on established public health guidelines and your inputs. Always consult with a qualified healthcare provider who can assess your individual needs.",
    "noWarrantyTitle": "2. No Warranty",
    "noWarrantyContent": "The Service is provided \"as is\" without any warranties of any kind, express or implied. We do not warrant the accuracy, completeness, or usefulness of any information presented. You rely on the information provided by this Service at your own risk.",
    "liabilityTitle": "3. Limitation of Liability",
    "liabilityContent": "In no event shall we or our affiliates be liable for any damages, including but not to direct, indirect, incidental, special, or consequential damages, arising out of or in connection with your use of or inability to use the Service.",
    "useOfServiceTitle": "4. Use of Service",
    "useOfServiceContent": "You agree to use the Service responsibly and not to misuse it. Misuse includes, but is not limited to, attempting to overload the system, interfering with its security, or using it for any unlawful purpose. We employ rate-limiting to ensure fair access for all users.",
    "changesToTermsTitle": "5. Changes to Terms",
    "changesToTermsContent": "We reserve the right to modify these terms at any time. We will post the most current version of these terms on this page. By continuing to use the Service after changes have been made, you agree to be bound by the revised terms."
  },
  "CookiesPage": {
    "backToHome": "Back to Home",
    "title": "Cookie Policy",
    "lastUpdated": "Last updated: July 16, 2024",
    "intro1": "ONKONO (\"us\", \"we\", or \"our\") uses cookies on our website (the \"Service\"). By using the Service, you consent to the use of cookies.",
    "intro2": "Our Cookie Policy explains what cookies are, how we use cookies, how third-parties we may partner with may use cookies on the Service, your choices regarding cookies, and further information about cookies.",
    "whatAreCookiesTitle": "What are cookies?",
    "whatAreCookiesContent": "Cookies are small pieces of text sent by your web browser by a website you visit. A cookie file is stored in your web browser and allows the Service or a third-party to recognize you and make your next visit easier and the Service more useful to you.",
    "howWeUseCookiesTitle": "How ONKONO uses cookies",
    "howWeUseCookiesIntro": "When you use and access the Service, we may place a number of cookie files in your web browser. We use cookies for the following purposes:",
    "essentialCookiesTitle": "1. Essential Cookies",
    "essentialCookiesContent": "These cookies are necessary for the website to function and cannot be switched off in our systems. They are essential for you to browse the website and use its features, such as accessing secure areas of the site.",
    "essentialCookiesPoint1": "<strong>Supabase Auth:</strong> We use Supabase for user authentication. Supabase sets a secure, http-only cookie to manage your login session. This is critical for keeping your account secure and maintaining your signed-in state as you navigate the app.",
    "functionalCookiesTitle": "2. Functional Cookies (Local Storage)",
    "functionalCookiesContent": "These are not traditional cookies, but use your browser's \"Local Storage\" feature. This allows us to remember choices you make and provide enhanced, more personal features. We use local storage for:",
    "functionalCookiesPoint1": "<strong>Theme Preference:</strong> To remember your light or dark mode preference across visits.",
    "functionalCookiesPoint2": "<strong>Language Preference:</strong> To remember your currently selected target language for a seamless learning experience.",
    "functionalCookiesPoint3": "<strong>Cookie Consent:</strong> To remember whether you have accepted our cookie policy so we don't have to ask you again on every visit.",
    "yourChoicesTitle": "Your choices regarding cookies",
    "yourChoicesContent1": "If you'd like to delete cookies or instruct your web browser to delete or refuse cookies, please visit the help pages of your web browser.",
    "yourChoicesContent2": "Please note, however, that if you delete cookies or refuse to accept them, you might not be able to use all of the features we offer, you may not be able to store your preferences, and some of our pages might not display properly. Our essential authentication cookie is required to log in to the service.",
    "moreInfoTitle": "Where can you find more information about cookies?",
    "moreInfoContent": "You can learn more about cookies and the following third-party websites:"
  },
  "AssessmentPage": {
    "loadingError": "Error loading assessment: {error}",
    "resumeDialogTitle": "Resume Session?",
    "resumeDialogDescription": "It looks like you have a session in progress. Would you like to resume or start a new assessment?",
    "resumeDialogStartNew": "Start New",
    "resumeDialogResume": "Resume",
    "step": "Step {currentStep} of {totalSteps}",
    "units": "Units",
    "unitsMetric": "Metric (cm / kg)",
    "unitsImperial": "Imperial (inches / lbs)",
    "selectOption": "Select an option",
    "back": "Back",
    "next": "Next",
    "viewResults": "View Results",
    "requiredField": "This field is required.",
    "validNumber": "Please enter a valid number.",
    "positiveValue": "Value must be positive.",
    "heightMetricRange": "Height must be between 50 and 250 cm.",
    "heightImperialRange": "Please enter a height between 20 and 120 inches.",
    "weightMetricRange": "Weight must be between 30 and 300 kg.",
    "weightImperialRange": "Please enter a weight between 40 and 660 lbs.",
    "heightWarningMetric": "Please check if this height is correct.",
    "weightWarningMetric": "Please check if this weight is correct.",
    "heightPlaceholderMetric": "e.g., 175",
    "heightPlaceholderImperial": "e.g., 69",
    "weightPlaceholderMetric": "e.g., 70",
    "weightPlaceholderImperial": "e.g., 154",
    "consentHealth": "I consent to the processing of my health data for the purpose of generating this one-time preventive plan. I understand this data is not stored and I have read the <privacyLink>Privacy Policy</privacyLink>.",
    "consentGenetics": "I give specific consent to process my genetic data for this assessment. I understand this information is sensitive and is covered by the <privacyLink>Privacy Policy</privacyLink>.",
    "safetyBannerTitle": "Important Note",
    "safetyBannerContent": "The symptom you selected can have many causes, but it is important to discuss with a healthcare provider promptly. This tool is not for diagnosis.",
    "addMother": "+ Add Mother",
    "addFather": "+ Add Father",
    "addSister": "+ Add Sister",
    "addBrother": "+ Add Brother",
    "addDaughter": "+ Add Daughter",
    "addSon": "+ Add Son",
    "addOther": "+ Other",
    "remove": "Remove",
    "addCancer": "+ Add Cancer",
    "addCustomRelative": "Add Custom Relative",
    "adultGateError": "This version of the tool is designed for adults. Please discuss any concerns with a paediatrician / family doctor.",
    "biologicalFamilyHelper": "Biological family = parents, children, full or half siblings, grandparents, aunts/uncles, nieces/nephews, first cousins.",
    "decadeHelper": "Tip: Sum up all periods of smoking. 10 years = 1 decade.",
    "approximateOk": "Approximate answers are fine."
  },
  "ResultsPage": {
    "noDataTitle": "No Plan Data",
    "noDataDescription": "It looks like you haven't generated a plan yet.",
    "noDataCta": "Build My Plan",
    "loadingTitle": "Analyzing Your Results...",
    "loadingMessage1": "Connecting to our secure analysis engine...",
    "loadingMessage2": "Analyzing your lifestyle factors against our risk models...",
    "loadingMessage3": "Synthesizing results and generating personalized recommendations...",
    "errorTitle": "Analysis Failed",
    "errorDescription": "We couldn't process your results at this time.",
    "errorCta": "Try Again",
    "resultsTitle": "Your Preventive Health Plan",
    "resultsDescription": "This is a personalized plan based on public health guidelines. Please discuss it with your healthcare provider.",
    "overallSummary": "Overall Summary",
    "riskLevel": "Risk Level: {level}",
    "positiveFactors": "Positive Lifestyle Factors",
    "recommendations": "Recommendations",
    "doctorStarters": "Conversation Starters for Your Doctor",
    "doctorStarter1": "\"Based on my lifestyle, what are the most important screenings for me at this age?\"",
    "doctorStarter2": "\"I'd like to discuss my diet and activity levels. What's one change you'd recommend I focus on first?\"",
    "doctorStarter3": "\"Given my smoking history and potential exposures, what should I be aware of regarding my lung health?\"",
    "doctorStarter4": "\"Are there any specific symptoms I should be aware of, given my risk factors?\"",
    "resources": "Helpful Resources",
    "exportTitle": "Export Your Plan",
    "exportDescription": "Save this plan to discuss with a healthcare professional. We do not store this data.",
    "exportPdf": "Download as PDF",
    "exportEmail": "Email My Plan",
    "emailDialogTitle": "Email Your Plan",
    "emailDialogDescription": "Enter your email address to receive a copy of your plan. We will not store or use your email for any other purpose.",
    "emailDialogCta": "Send Email",
    "newAssessment": "Build New Plan",
    "backToHome": "Back to Home"
  }
}
]]>
</file>
<file path="messages/pl.json">
<![CDATA[
{
  "HomePage": {
    "title": "ONKONO",
    "description": "Twój spersonalizowany przewodnik po proaktywnych badaniach przesiewowych w kierunku raka. Odpowiedz na kilka pytań, aby stworzyć poufny, praktyczny plan.",
    "ctaButton": "Rozpocznij Moją Ocenę",
    "disclaimerTitle": "Ważne Zastrzeżenie",
    "disclaimerContent1": "To narzędzie dostarcza informacji wyłącznie w celach edukacyjnych i nie zastępuje profesjonalnej porady medycznej, diagnozy ani leczenia. Ocena opiera się na danych statystycznych i nie może uwzględniać indywidualnych uwarunkowań zdrowotnych.",
    "disclaimerContent2": "<strong>Zawsze konsultuj się z wykwalifikowanym pracownikiem służby zdrowia</strong> w sprawie wszelkich problemów medycznych lub przed podjęciem jakichkolwiek decyzji związanych ze zdrowiem. Nie przechowujemy żadnych danych osobowych."
  },
  "AppFooter": {
    "copyright": "© {year} ONKONO. Wszelkie prawa zastrzeżone.",
    "privacyPolicy": "Polityka Prywatności",
    "termsOfService": "Warunki Korzystania z Usługi"
  },
  "PrivacyPage": {
    "backToHome": "Powrót do strony głównej",
    "title": "Polityka Prywatności",
    "lastUpdated": "Ostatnia aktualizacja: 5 sierpnia 2025",
    "intro": "Ta aplikacja („my”, „nasz” lub „nas”) zobowiązuje się do ochrony Twojej prywatności. Niniejsza Polityka Prywatności wyjaśnia, w jaki sposób postępujemy z Twoimi informacjami, gdy korzystasz z naszego proaktywnego planera zdrowia („Usługa”).",
    "anonymityTitle": "1. Anonimowość z założenia",
    "anonymityIntro": "Podstawową zasadą tej Usługi jest anonimowość użytkownika. Zaprojektowaliśmy system tak, aby unikać gromadzenia lub przechowywania jakichkolwiek danych osobowych (PII).",
    "anonymityPoint1": "<strong>Brak kont użytkowników:</strong> Nie musisz tworzyć konta, aby korzystać z Usługi.",
    "anonymityPoint2": "<strong>Brak przechowywania danych osobowych:</strong> Nie prosimy, nie zbieramy ani nie przechowujemy Twojego imienia i nazwiska, adresu e-mail, daty urodzenia ani żadnych innych bezpośrednich identyfikatorów osobistych.",
    "anonymityPoint3": "<strong>Dane oparte na sesji:</strong> Odpowiedzi udzielone w ankiecie są przechowywane wyłącznie w pamięci lokalnej przeglądarki. Dane te są automatycznie usuwane po rozpoczęciu nowej oceny. Nigdy nie są wysyłane na nasze serwery, dopóki nie klikniesz „Zobacz wyniki”.",
    "processingTitle": "2. Informacje, które przetwarzamy",
    "processingIntro": "Aby dostarczyć Ci ocenę, przetwarzamy następujące informacje:",
    "processingPoint1": "<strong>Odpowiedzi z ankiety:</strong> Udzielone przez Ciebie odpowiedzi są wysyłane do naszego serwisu backendowego, a następnie do zewnętrznego dostawcy AI w celu wygenerowania Twojego profilaktycznego planu zdrowia. Dane te są przetwarzane w pamięci i nie są przechowywane ani rejestrowane w powiązaniu z żadnymi danymi osobowymi.",
    "processingPoint2": "<strong>Adres IP:</strong> Twój adres IP jest tymczasowo używany do celów ograniczania liczby żądań, aby zapobiec nadużywaniu usługi. Nie jest on przechowywany ani łączony z danymi Twojej oceny.",
    "processingPoint3": "<strong>Logi operacyjne:</strong> Możemy przechowywać anonimowe logi dotyczące zdarzeń oceny (np. „SUKCES”, „BŁĄD_AI”) w celu monitorowania stanu naszego systemu i statystyk użytkowania. Logi te nie zawierają żadnej części danych z Twojej ankiety.",
    "emailTitle": "3. Funkcja e-mail „Wyślij i zapomnij”",
    "emailIntro": "Oferujemy opcjonalną funkcję wysłania wyników na Twój adres e-mail. Ten proces został zaprojektowany jako „wyślij i zapomnij”:",
    "emailPoint1": "Dobrowolnie podajesz adres e-mail w formularzu.",
    "emailPoint2": "Wyniki Twojej oceny i podany adres e-mail są wysyłane na nasz serwer.",
    "emailPoint3": "Nasz serwer natychmiast przekazuje te informacje do naszego dostawcy usług e-mail (Resend) w celu wysłania wiadomości.",
    "emailPoint4": "<strong>Nie przechowujemy Twojego adresu e-mail na naszych serwerach po wysłaniu wiadomości.</strong>",
    "thirdPartyTitle": "4. Usługi stron trzecich",
    "thirdPartyPoint1": "<strong>Dostawcy AI (Google Gemini itp.):</strong> Twoje zanonimizowane odpowiedzi z ankiety są wysyłane do naszych dostawców AI w celu wygenerowania oceny. Dane te podlegają ich odpowiednim politykom prywatności.",
    "thirdPartyPoint2": "<strong>Dostawca usług e-mail (Resend):</strong> Jeśli skorzystasz z funkcji eksportu e-mailem, Twój adres e-mail i wyniki zostaną przetworzone przez Resend w celu dostarczenia wiadomości.",
    "choicesTitle": "5. Twoje wybory",
    "choicesContent": "Masz kontrolę nad swoimi informacjami. Możesz w każdej chwili usunąć dane swojej oceny, zamykając kartę przeglądarki lub rozpoczynając nową ocenę, co usuwa dane z poprzedniej sesji."
  },
  "TermsPage": {
    "backToHome": "Powrót do strony głównej",
    "title": "Warunki Korzystania z Usługi",
    "lastUpdated": "Ostatnia aktualizacja: 5 sierpnia 2025",
    "intro": "Korzystając z tego proaktywnego planera zdrowia („Usługa”), zgadzasz się na niniejsze Warunki Korzystania z Usługi.",
    "notMedicalAdviceTitle": "1. To nie jest porada medyczna",
    "notMedicalAdviceContent": "Usługa dostarcza informacji wyłącznie w celach edukacyjnych. Nie zastępuje profesjonalnej porady medycznej, diagnozy ani leczenia. To narzędzie nie oblicza wyników ryzyka; generuje rekomendacje na podstawie ustalonych wytycznych zdrowia publicznego i Twoich odpowiedzi. Zawsze konsultuj się z wykwalifikowanym pracownikiem służby zdrowia, który może ocenić Twoje indywidualne potrzeby.",
    "noWarrantyTitle": "2. Brak gwarancji",
    "noWarrantyContent": "Usługa jest świadczona w stanie „tak jak jest”, bez żadnych gwarancji, wyraźnych ani dorozumianych. Nie gwarantujemy dokładności, kompletności ani użyteczności żadnych przedstawionych informacji. Korzystasz z informacji dostarczanych przez tę Usługę na własne ryzyko.",
    "liabilityTitle": "3. Ograniczenie odpowiedzialności",
    "liabilityContent": "W żadnym wypadku my ani nasi partnerzy nie ponosimy odpowiedzialności za jakiekolwiek szkody, w tym między innymi za szkody bezpośrednie, pośrednie, przypadkowe, specjalne lub wynikowe, wynikające z korzystania lub niemożności korzystania z Usługi.",
    "useOfServiceTitle": "4. Korzystanie z Usługi",
    "useOfServiceContent": "Zgadzasz się korzystać z Usługi w sposób odpowiedzialny i nie nadużywać jej. Nadużywanie obejmuje między innymi próby przeciążenia systemu, ingerowanie w jego zabezpieczenia lub wykorzystywanie go w jakimkolwiek celu niezgodnym z prawem. Stosujemy ograniczanie liczby żądań, aby zapewnić sprawiedliwy dostęp wszystkim użytkownikom.",
    "changesToTermsTitle": "5. Zmiany w Warunkach",
    "changesToTermsContent": "Zastrzegamy sobie prawo do modyfikacji niniejszych warunków w dowolnym momencie. Najnowszą wersję tych warunków opublikujemy na tej stronie. Kontynuując korzystanie z Usługi po wprowadzeniu zmian, zgadzasz się na związanie zmienionymi warunkami."
  },
  "CookiesPage": {
    "backToHome": "Powrót do strony głównej",
    "title": "Polityka Ciasteczek",
    "lastUpdated": "Ostatnia aktualizacja: 16 lipca 2024",
    "intro1": "ONKONO („nas”, „my” lub „nasze”) używa plików cookie na naszej stronie internetowej („Usługa”). Korzystając z Usługi, wyrażasz zgodę na używanie plików cookie.",
    "intro2": "Nasza Polityka Ciasteczek wyjaśnia, czym są pliki cookie, jak ich używamy, jak strony trzecie, z którymi możemy współpracować, mogą używać plików cookie w Usłudze, Twoje wybory dotyczące plików cookie oraz dalsze informacje na ich temat.",
    "whatAreCookiesTitle": "Czym są pliki cookie?",
    "whatAreCookiesContent": "Pliki cookie to małe fragmenty tekstu wysyłane przez Twoją przeglądarkę internetową przez odwiedzaną stronę. Plik cookie jest przechowywany w Twojej przeglądarce i pozwala Usłudze lub stronie trzeciej rozpoznać Cię i ułatwić Twoją następną wizytę oraz uczynić Usługę bardziej użyteczną.",
    "howWeUseCookiesTitle": "Jak ONKONO używa plików cookie",
    "howWeUseCookiesIntro": "Gdy korzystasz z Usługi i uzyskujesz do niej dostęp, możemy umieścić w Twojej przeglądarce internetowej szereg plików cookie. Używamy plików cookie w następujących celach:",
    "essentialCookiesTitle": "1. Niezbędne pliki cookie",
    "essentialCookiesContent": "Te pliki cookie są niezbędne do funkcjonowania strony internetowej i nie można ich wyłączyć w naszych systemach. Są one kluczowe, abyś mógł przeglądać stronę i korzystać z jej funkcji, takich jak dostęp do bezpiecznych obszarów witryny.",
    "essentialCookiesPoint1": "<strong>Uwierzytelnianie Supabase:</strong> Używamy Supabase do uwierzytelniania użytkowników. Supabase ustawia bezpieczny plik cookie typu http-only, aby zarządzać Twoją sesją logowania. Jest to kluczowe dla zapewnienia bezpieczeństwa Twojego konta i utrzymania stanu zalogowania podczas nawigacji po aplikacji.",
    "functionalCookiesTitle": "2. Funkcjonalne pliki cookie (Pamięć lokalna)",
    "functionalCookiesContent": "To nie są tradycyjne pliki cookie, ale wykorzystują one funkcję „Pamięci lokalnej” Twojej przeglądarki. Pozwala nam to zapamiętać Twoje wybory i oferować ulepszone, bardziej spersonalizowane funkcje. Używamy pamięci lokalnej do:",
    "functionalCookiesPoint1": "<strong>Preferencje motywu:</strong> Aby zapamiętać Twoje preferencje dotyczące trybu jasnego lub ciemnego między wizytami.",
    "functionalCookiesPoint2": "<strong>Preferencje językowe:</strong> Aby zapamiętać aktualnie wybrany język docelowy dla płynnego doświadczenia nauki.",
    "functionalCookiesPoint3": "<strong>Zgoda na pliki cookie:</strong> Aby zapamiętać, czy zaakceptowałeś naszą politykę ciasteczek, abyśmy nie musieli pytać Cię o to ponownie przy każdej wizycie.",
    "yourChoicesTitle": "Twoje wybory dotyczące plików cookie",
    "yourChoicesContent1": "Jeśli chcesz usunąć pliki cookie lub poinstruować swoją przeglądarkę, aby je usunęła lub odrzuciła, odwiedź strony pomocy swojej przeglądarki.",
    "yourChoicesContent2": "Pamiętaj jednak, że jeśli usuniesz pliki cookie lub odmówisz ich akceptacji, możesz nie być w stanie korzystać ze wszystkich oferowanych przez nas funkcji, nie będziesz mógł przechowywać swoich preferencji, a niektóre z naszych stron mogą nie wyświetlać się poprawnie. Nasz niezbędny plik cookie do uwierzytelniania jest wymagany do zalogowania się do usługi.",
    "moreInfoTitle": "Gdzie można znaleźć więcej informacji o plikach cookie?",
    "moreInfoContent": "Możesz dowiedzieć się więcej o plikach cookie na następujących stronach internetowych osób trzecich:"
  },
  "AssessmentPage": {
    "loadingError": "Błąd ładowania oceny: {error}",
    "resumeDialogTitle": "Wznowić sesję?",
    "resumeDialogDescription": "Wygląda na to, że masz rozpoczętą sesję. Czy chcesz ją wznowić, czy rozpocząć nową ocenę?",
    "resumeDialogStartNew": "Rozpocznij nową",
    "resumeDialogResume": "Wznów",
    "step": "Krok {currentStep} z {totalSteps}",
    "units": "Jednostki",
    "unitsMetric": "Metryczne (cm / kg)",
    "unitsImperial": "Imperialne (cale / funty)",
    "selectOption": "Wybierz opcję",
    "back": "Wstecz",
    "next": "Dalej",
    "viewResults": "Zobacz wyniki",
    "requiredField": "To pole jest wymagane.",
    "validNumber": "Proszę wprowadzić prawidłową liczbę.",
    "positiveValue": "Wartość musi być dodatnia.",
    "heightMetricRange": "Wzrost musi wynosić od 50 do 250 cm.",
    "heightImperialRange": "Proszę podać wzrost w zakresie 20-120 cali.",
    "weightMetricRange": "Waga musi wynosić od 30 do 300 kg.",
    "weightImperialRange": "Proszę podać wagę w zakresie 40-660 funtów.",
    "heightWarningMetric": "Proszę sprawdzić, czy ten wzrost jest poprawny.",
    "weightWarningMetric": "Proszę sprawdzić, czy ta waga jest poprawna.",
    "heightPlaceholderMetric": "np. 175",
    "heightPlaceholderImperial": "np. 69",
    "weightPlaceholderMetric": "np. 70",
    "weightPlaceholderImperial": "np. 154",
    "consentHealth": "Wyrażam zgodę na przetwarzanie moich danych o stanie zdrowia w celu wygenerowania tego jednorazowego planu profilaktycznego. Rozumiem, że te dane nie są przechowywane i zapoznałem/am się z <privacyLink>Polityką Prywatności</privacyLink>.",
    "consentGenetics": "Wyrażam szczególną zgodę na przetwarzanie moich danych genetycznych w celu tej oceny. Rozumiem, że te informacje są wrażliwe i objęte <privacyLink>Polityką Prywatności</privacyLink>.",
    "safetyBannerTitle": "Ważna Uwaga",
    "safetyBannerContent": "Wybrany objaw może mieć wiele przyczyn, ale ważne jest, aby niezwłocznie skonsultować się z lekarzem. To narzędzie nie służy do diagnozowania.",
    "addMother": "+ Dodaj Matkę",
    "addFather": "+ Dodaj Ojca",
    "addSister": "+ Dodaj Siostrę",
    "addBrother": "+ Dodaj Brata",
    "addDaughter": "+ Dodaj Córkę",
    "addSon": "+ Dodaj Syna",
    "addOther": "+ Inne",
    "remove": "Usuń",
    "addCancer": "+ Dodaj Nowotwór",
    "addCustomRelative": "Dodaj Innego Krewnego",
    "adultGateError": "Ta wersja narzędzia jest przeznaczona dla osób dorosłych. W razie wątpliwości skonsultuj się z lekarzem rodzinnym lub pediatrą.",
    "biologicalFamilyHelper": "Rodzina biologiczna = rodzice, dzieci, rodzeństwo (także przyrodnie), dziadkowie, ciocie/wujkowie, siostrzeńcy/bratankowie, kuzynostwo.",
    "decadeHelper": "Wskazówka: Zsumuj wszystkie okresy palenia. 10 lat = 1 dekada.",
    "approximateOk": "Przybliżone odpowiedzi są w porządku."
  },
  "ResultsPage": {
    "noDataTitle": "Brak Danych Planu",
    "noDataDescription": "Wygląda na to, że jeszcze nie wygenerowałeś/aś planu.",
    "noDataCta": "Zbuduj Mój Plan",
    "loadingTitle": "Analizowanie Twoich Wyników...",
    "loadingMessage1": "Łączenie z naszym bezpiecznym silnikiem analitycznym...",
    "loadingMessage2": "Analizowanie czynników Twojego stylu życia w oparciu o nasze modele ryzyka...",
    "loadingMessage3": "Syntezowanie wyników i generowanie spersonalizowanych rekomendacji...",
    "errorTitle": "Analiza Nieudana",
    "errorDescription": "W tej chwili nie mogliśmy przetworzyć Twoich wyników.",
    "errorCta": "Spróbuj Ponownie",
    "resultsTitle": "Twój Profilaktyczny Plan Zdrowia",
    "resultsDescription": "To jest spersonalizowany plan oparty na publicznych wytycznych zdrowotnych. Prosimy omówić go ze swoim lekarzem.",
    "overallSummary": "Ogólne Podsumowanie",
    "riskLevel": "Poziom Ryzyka: {level}",
    "positiveFactors": "Pozytywne Czynniki Stylu Życia",
    "recommendations": "Rekomendacje",
    "doctorStarters": "Tematy do rozmowy z lekarzem",
    "doctorStarter1": "\"Biorąc pod uwagę mój styl życia, jakie badania przesiewowe są dla mnie najważniejsze w tym wieku?\"",
    "doctorStarter2": "\"Chciał(a)bym omówić moją dietę i poziom aktywności. Jaką jedną zmianę polecił(a)by Pan(i) mi na początek?\"",
    "doctorStarter3": "\"Biorąc pod uwagę moją historię palenia i potencjalne narażenia, na co powinienem/powinnam zwrócić uwagę w kwestii zdrowia płuc?\"",
    "doctorStarter4": "\"Czy są jakieś konkretne objawy, na które powinienem/powinnam zwrócić uwagę, biorąc pod uwagę moje czynniki ryzyka?\"",
    "resources": "Pomocne Zasoby",
    "exportTitle": "Eksportuj Swój Plan",
    "exportDescription": "Zapisz ten plan, aby omówić go z pracownikiem służby zdrowia. Nie przechowujemy tych danych.",
    "exportPdf": "Pobierz jako PDF",
    "exportEmail": "Wyślij Plan E-mailem",
    "emailDialogTitle": "Wyślij Plan E-mailem",
    "emailDialogDescription": "Wpisz swój adres e-mail, aby otrzymać kopię swojego planu. Nie będziemy przechowywać ani używać Twojego e-maila w żadnym innym celu.",
    "emailDialogCta": "Wyślij E-mail",
    "newAssessment": "Zbuduj Nowy Plan",
    "backToHome": "Powrót do strony głównej"
  }
}
]]>
</file>
<file path="src/lib/utils/pdf-generator.ts">
<![CDATA[
import jsPDF from "jspdf";
import "jspdf-autotable";
import type { ActionPlan } from "../types";
import { onkonoLogoBase64 } from "../assets/onkono-logo-base64";
import { openSansBold } from "../assets/open-sans-bold-base64";
import { openSansRegular } from "../assets/open-sans-regular-base64";

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: {
    (options: any): jsPDF;
    previous?: { finalY: number };
  };
}

const THEME = {
  BRAND_COLOR: "#FF3B30",
  TEXT_COLOR: "#333333",
  HEADER_TEXT_COLOR: "#FFFFFF",
};

// Define styling constants for easier tweaking
const STYLING = {
  FONT_SIZES: {
    TITLE: 22,
    SUMMARY: 10,
    BODY: 10,
    HEADER_BAR: 10,
  },
  LINE_HEIGHT: 1.4,
  CHAR_SPACE: 0.05,
};

const translations: Record<string, any> = {
  en: {
    title: "Doctor's Discussion Guide",
    disclaimer:
      "information to support discussion with a doctor / not a diagnosis",
    overallSummary: "Overall Summary",
    recommendedScreenings: "Recommended Screenings",
    lifestyleGuidelines: "Lifestyle Guidelines",
    topicsForDoctor: "Topics For Your Doctor",
    yourAnswers: "Your Provided Answers",
    filename: "Doctors_Discussion_Guide",
    answersMap: {
      intent: "Goal",
      source: "Form filled by",
      language: "Language",
      dob: "Date of Birth",
      sex_at_birth: "Sex at Birth",
      gender_identity: "Gender Identity",
      height_cm: "Height (cm)",
      weight_kg: "Weight (kg)",
      smoking_status: "Smoking Status",
      cigs_per_day: "Cigarettes per day",
      smoking_years: "Years smoked",
      smoking_duration: "Smoking Duration",
      alcohol_use: "Alcohol Consumption",
      alcohol: "Alcohol Consumption",
      diet_pattern: "Diet Pattern",
      activity_level: "Activity Level",
      activity: "Weekly Activity",
      symptoms: "Symptoms",
      family_cancer_any: "Family History of Cancer",
      illness_any: "Chronic Illnesses",
      cancer_any: "Personal History of Cancer",
      job_history_enable: "Occupation details provided",
      family_cancer_history: "Family Cancer Details",
      personal_cancer_history: "Personal Cancer Details",
      illness_list: "Diagnosed Conditions",
      occupational_hazards: "Occupational History",
      labs_and_imaging: "Labs & Imaging",
      units: "Units",
      symptom_details_prefix: "Details for Symptom",
      illness_details_prefix: "Details for",
    },
  },
  pl: {
    title: "Przewodnik do Dyskusji z Lekarzem",
    disclaimer:
      "informacje wspierające rozmowę z lekarzem / nie diagnoza",
    overallSummary: "Ogólne Podsumowanie",
    recommendedScreenings: "Zalecane Badania Przesiewowe",
    lifestyleGuidelines: "Wskazówki Dotyczące Stylu Życia",
    topicsForDoctor: "Tematy do Omówienia z Lekarzem",
    yourAnswers: "Twoje Udzielone Odpowiedzi",
    filename: "Przewodnik_Do_Dyskusji_Z_Lekarzem",
    answersMap: {
      intent: "Cel",
      source: "Formularz wypełniony przez",
      language: "Język",
      dob: "Data urodzenia",
      sex_at_birth: "Płeć przy urodzeniu",
      gender_identity: "Tożsamość płciowa",
      height_cm: "Wzrost (cm)",
      weight_kg: "Waga (kg)",
      smoking_status: "Status palenia",
      cigs_per_day: "Papierosy dziennie",
      smoking_years: "Lata palenia",
      smoking_duration: "Okres palenia",
      alcohol_use: "Spożycie alkoholu",
      alcohol: "Spożycie alkoholu",
      diet_pattern: "Wzorzec żywieniowy",
      activity_level: "Poziom aktywności",
      activity: "Aktywność tygodniowa",
      symptoms: "Objawy",
      family_cancer_any: "Historia raka w rodzinie",
      illness_any: "Choroby przewlekłe",
      cancer_any: "Osobista historia nowotworów",
      job_history_enable: "Podano szczegóły zawodowe",
      family_cancer_history: "Szczegóły historii raka w rodzinie",
      personal_cancer_history: "Szczegóły osobistej historii nowotworów",
      illness_list: "Zdiagnozowane schorzenia",
      occupational_hazards: "Historia zawodowa",
      labs_and_imaging: "Badania laboratoryjne i obrazowe",
      units: "Jednostki",
      symptom_details_prefix: "Szczegóły objawu",
      illness_details_prefix: "Szczegóły dla",
    },
  },
};

const drawSectionHeader = (doc: jsPDFWithAutoTable, title: string, startY: number): number => {
  const headerHeight = 10;
  const padding = 14;

  doc.setFillColor(THEME.BRAND_COLOR);
  doc.rect(padding, startY, doc.internal.pageSize.getWidth() - (padding * 2), headerHeight, "F");

  doc.setFont("OpenSans", "bold");
  doc.setFontSize(STYLING.FONT_SIZES.HEADER_BAR);
  doc.setTextColor(THEME.HEADER_TEXT_COLOR);
  doc.text(title, padding + 4, startY + headerHeight / 2 + 2.5);

  return startY + headerHeight + 5;
};

function formatAnswerValue(value: any, key: string): string {
  if (typeof value !== 'string' || !value.trim().length) {
    return value;
  }
  
  const trimmedValue = value.trim();
  if (!((trimmedValue.startsWith('[') && trimmedValue.endsWith(']')) || (trimmedValue.startsWith('{') && trimmedValue.endsWith('}')))) {
      return value;
  }

  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {
      if (parsed.length === 0) return "None";

      if (parsed.every(item => typeof item === 'string')) {
        return parsed.join(', ');
      }
      
      if (key === 'family_cancer_history') {
        return parsed.map(item => `${item.relation || 'Relative'}${item.cancer_type ? ` (${item.cancer_type} at age ${item.age_dx || 'N/A'})` : ''}`).join('; ');
      }
      if (key === 'personal_cancer_history') {
        return parsed.map(item => `${item.type || 'Cancer'}${item.year_dx ? ` (diagnosed ${item.year_dx})` : ''}`).join('; ');
      }
      if (key === 'occupational_hazards') {
        return parsed.map(item => `${item.job_title || 'Job'}${item.job_years ? ` (${item.job_years} years)` : ''}`).join('; ');
      }
      if (key === 'labs_and_imaging') {
        return parsed.map(item => `${item.study_type || 'Study'}${item.study_date ? ` (${item.study_date})` : ''}`).join('; ');
      }

      if (parsed.every(item => typeof item === 'object' && item !== null)) {
        return `${parsed.length} detailed entry/entries provided.`;
      }
      
      return value;
    }

    if (typeof parsed === 'object' && parsed !== null) {
        return Object.entries(parsed)
            .map(([k, v]) => `${k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}: ${v}`)
            .join(', ');
    }

    return value;
  } catch (e) {
    return value;
  }
}

const formatQuestionKey = (key: string, t: any): string => {
    if (key.startsWith('symptom_details_')) {
        const symptomId = key.replace('symptom_details_', '');
        return `${t.answersMap['symptom_details_prefix'] || 'Details for Symptom'} (${symptomId})`;
    }
     if (key.startsWith('illness_details_')) {
        const illnessId = key.replace('illness_details_', '');
        const formattedIllnessId = illnessId.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        return `${t.answersMap['illness_details_prefix'] || 'Details for'} ${formattedIllnessId}`;
    }
    return t.answersMap[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};


export const generateAssessmentPdf = (
  planData: ActionPlan,
  answers: Record<string, string>,
  locale: string = "en",
) => {
  const t = translations[locale] || translations.en;
  const doc = new jsPDF() as jsPDFWithAutoTable;
  const pageMargin = 14;

  doc.addFileToVFS("OpenSans-Regular.ttf", openSansRegular);
  doc.addFileToVFS("OpenSans-Bold.ttf", openSansBold);
  doc.addFont("OpenSans-Regular.ttf", "OpenSans", "normal");
  doc.addFont("OpenSans-Bold.ttf", "OpenSans", "bold");

  doc.setFont("OpenSans", "normal");
  doc.setTextColor(THEME.TEXT_COLOR);
  doc.setCharSpace(STYLING.CHAR_SPACE);

  doc.addImage(onkonoLogoBase64, "PNG", pageMargin, 20, 45, 10.5);

  doc.setFontSize(STYLING.FONT_SIZES.TITLE);
  doc.setFont("OpenSans", "bold");
  doc.text(t.title, pageMargin, 45);
  
  doc.setFont("OpenSans", "normal");
  doc.setFontSize(STYLING.FONT_SIZES.BODY);
  doc.setTextColor(100);
  doc.text(t.disclaimer, pageMargin, 53, { lineHeightFactor: STYLING.LINE_HEIGHT });

  let startY = 65;

  if (planData.overallSummary) {
    doc.setFontSize(STYLING.FONT_SIZES.SUMMARY);
    const summaryLines = doc.splitTextToSize(planData.overallSummary, doc.internal.pageSize.getWidth() - (pageMargin * 2));
    doc.text(summaryLines, pageMargin, startY, { lineHeightFactor: STYLING.LINE_HEIGHT });
    startY += summaryLines.length * STYLING.FONT_SIZES.SUMMARY * 0.35 * STYLING.LINE_HEIGHT + 12;
  }
  
  const checkPageBreak = (currentY: number) => {
    if (currentY > 260) {
      doc.addPage();
      return 20;
    }
    return currentY;
  };

  const commonTableStyles = {
    showHead: false,
    theme: "plain",
    styles: {
      cellPadding: { top: 1.5, right: 3, bottom: 1.5, left: 1 },
      font: "OpenSans",
      fontSize: STYLING.FONT_SIZES.BODY,
      valign: 'top',
      lineHeight: STYLING.LINE_HEIGHT,
    },
    columnStyles: { 0: { fontStyle: 'bold' } },
    margin: { left: pageMargin },
  };

  if (planData.recommendedScreenings.length > 0) {
    startY = checkPageBreak(startY);
    startY = drawSectionHeader(doc, t.recommendedScreenings, startY);
    doc.autoTable({
      startY,
      body: planData.recommendedScreenings.map((s) => [s.title, s.why]),
      ...commonTableStyles,
    });
    startY = (doc.autoTable.previous?.finalY ?? startY) + 12;
  }

  if (planData.lifestyleGuidelines.length > 0) {
    startY = checkPageBreak(startY);
    startY = drawSectionHeader(doc, t.lifestyleGuidelines, startY);
    doc.autoTable({
      startY,
      body: planData.lifestyleGuidelines.map((l) => [l.title, l.description]),
      ...commonTableStyles,
    });
    startY = (doc.autoTable.previous?.finalY ?? startY) + 12;
  }

  if (planData.topicsForDoctor.length > 0) {
    startY = checkPageBreak(startY);
    startY = drawSectionHeader(doc, t.topicsForDoctor, startY);
    doc.autoTable({
      startY,
      body: planData.topicsForDoctor.map((topic) => [topic.title, topic.why]),
      ...commonTableStyles,
    });
    startY = (doc.autoTable.previous?.finalY ?? startY) + 12;
  }

  if (Object.keys(answers).length > 0) {
    startY = checkPageBreak(startY);
    startY = drawSectionHeader(doc, t.yourAnswers, startY);
    
    // Filter out internal derived scores or flags that shouldn't be shown to the user
    // This ensures no "risk scores" are printed in the PDF
    const filteredAnswers = Object.entries(answers).filter(([key]) => {
        return !key.startsWith('derived.') && 
               !key.includes('_score') && 
               !key.includes('brinkman_index');
    });

    doc.autoTable({
      startY,
      body: filteredAnswers.map(([key, value]) => [
        formatQuestionKey(key, t),
        formatAnswerValue(value, key),
      ]),
      ...commonTableStyles,
    });
  }

  doc.save(
    `${t.filename}_${new Date().toLocaleDateString().replace(/\//g, "-")}.pdf`,
  );
};
]]>
</file>
<file path="src/components/assessment/FamilyCancerHistory.tsx">
<![CDATA[
'use client'

import React, { useState } from "react";
import { RepeatingGroup } from "../ui/RepeatingGroup";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { SearchableSelect, SearchableSelectOption } from "../ui/SearchableSelect";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { useTranslations } from 'next-intl';
import { Card, CardContent } from "../ui/card";
import { Info } from "lucide-react";

interface CancerDiagnosis {
  cancer_type?: string;
  age_dx?: number;
  laterality?: string;
}

interface FamilyMember {
  relation?: string;
  side_of_family?: string; // Maternal, Paternal, Both parents, N/A, Not sure
  vital_status?: string; // Alive, Deceased
  age_now_death?: number; // Age now or at death
  cancers?: CancerDiagnosis[]; // Array of cancers instead of single cancer
  multiple_primaries?: boolean;
  known_genetic_syndrome?: boolean;
  sex_at_birth?: string;
  is_blood_related?: boolean;
}

interface FamilyCancerHistoryProps {
  value: FamilyMember[];
  onChange: (value: FamilyMember[]) => void;
  options: {
    relations: string[];
    cancerTypes: SearchableSelectOption[];
  };
}

export const FamilyCancerHistory = ({ value, onChange, options }: FamilyCancerHistoryProps) => {
  const t = useTranslations("AssessmentPage");
  const [errors, setErrors] = useState<Record<number, { age_now_death?: string, side_of_family?: string }>>({});

  const handleAdd = (relation?: string) => {
    let side = undefined;
    if (relation === 'Mother' || relation === 'Maternal Grandmother' || relation === 'Maternal Grandfather') side = 'Maternal';
    if (relation === 'Father' || relation === 'Paternal Grandmother' || relation === 'Paternal Grandfather') side = 'Paternal';
    if (relation === 'Sister' || relation === 'Brother') side = 'N/A'; // Siblings
    if (relation === 'Daughter' || relation === 'Son') side = 'Both parents'; // Children

    onChange([...value, { cancers: [], relation: relation || '', side_of_family: side }]);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, field: keyof FamilyMember, fieldValue: any) => {
    if (field === "age_now_death") {
      const num = Number(fieldValue);
      if (fieldValue && (isNaN(num) || num < 0 || num > 120)) {
        setErrors(prev => ({ ...prev, [index]: { ...prev[index], [field]: 'Invalid age.' } }));
      } else {
        const newErrors = { ...errors[index] };
        delete newErrors[field];
        setErrors(prev => ({ ...prev, [index]: newErrors }));
      }
    }

    const newValues = [...value];
    newValues[index] = { ...newValues[index], [field]: fieldValue };

    // Auto-infer side if relation changes
    if (field === 'relation') {
        let side = newValues[index].side_of_family;
        const rel = fieldValue as string;
        if (rel.includes('Maternal') || rel === 'Mother') side = 'Maternal';
        else if (rel.includes('Paternal') || rel === 'Father') side = 'Paternal';
        else if (['Sister', 'Brother'].includes(rel)) side = 'N/A';
        else if (['Daughter', 'Son'].includes(rel)) side = 'Both parents';
        else side = undefined; // Force user to pick for cousins etc.
        newValues[index].side_of_family = side;
    }

    onChange(newValues);
  };

  const handleAddCancer = (memberIndex: number) => {
    const newValues = [...value];
    const currentCancers = newValues[memberIndex].cancers || [];
    newValues[memberIndex] = {
      ...newValues[memberIndex],
      cancers: [...currentCancers, {}]
    };
    onChange(newValues);
  };

  const handleRemoveCancer = (memberIndex: number, cancerIndex: number) => {
    const newValues = [...value];
    const currentCancers = newValues[memberIndex].cancers || [];
    newValues[memberIndex] = {
      ...newValues[memberIndex],
      cancers: currentCancers.filter((_, i) => i !== cancerIndex)
    };
    onChange(newValues);
  };

  const handleCancerFieldChange = (memberIndex: number, cancerIndex: number, field: keyof CancerDiagnosis, cancerFieldValue: any) => {
    const newValues = [...value]; // Corrected from this.value
    const cancers = newValues[memberIndex].cancers || [];
    cancers[cancerIndex] = { ...cancers[cancerIndex], [field]: cancerFieldValue };
    newValues[memberIndex] = { ...newValues[memberIndex], cancers };
    onChange(newValues);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 mb-4">
        <CardContent className="p-3 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
                {t('biologicalFamilyHelper')}
            </p>
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-2 mb-4">
        {["Mother", "Father", "Sister", "Brother", "Daughter", "Son"].map(rel => (
            <button
                key={rel}
                type="button"
                onClick={() => handleAdd(rel)}
                className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-sm font-medium transition-colors"
            >
                {t(`add${rel}`)}
            </button>
        ))}
         <button
            type="button"
            onClick={() => handleAdd()}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm font-medium transition-colors"
        >
            {t('addOther')}
        </button>
    </div>
    <RepeatingGroup
      values={value}
      onAdd={() => handleAdd()}
      onRemove={handleRemove}
      addLabel="Add Custom Relative"
    >
      {(item, index) => (
        <div className="space-y-4 border-b pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Relation</Label>
              <Select
                value={item.relation}
                onValueChange={(val) => handleFieldChange(index, "relation", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select relation" />
                </SelectTrigger>
                <SelectContent>
                  {options.relations.map((relation) => (
                    <SelectItem key={relation} value={relation}>
                      {relation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Side of Family {['Aunt', 'Uncle', 'Grandmother', 'Grandfather', 'Cousin'].some(r => item.relation?.includes(r)) && <span className="text-red-500">*</span>}</Label>
              <Select
                value={item.side_of_family}
                onValueChange={(val) => handleFieldChange(index, "side_of_family", val)}
              >
                <SelectTrigger className={errors[index]?.side_of_family ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select side" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Maternal">Maternal</SelectItem>
                  <SelectItem value="Paternal">Paternal</SelectItem>
                  <SelectItem value="Both parents">Both parents</SelectItem>
                  <SelectItem value="N/A">N/A (e.g. Sibling)</SelectItem>
                  <SelectItem value="Not sure">Not sure</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label>Sex at Birth</Label>
                <Select
                  value={item.sex_at_birth}
                  onValueChange={(val) => handleFieldChange(index, "sex_at_birth", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sex" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                  </SelectContent>
                </Select>
             </div>
             <div className="space-y-2 flex items-end pb-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`blood_related_${index}`}
                    checked={item.is_blood_related}
                    onCheckedChange={(c) => handleFieldChange(index, "is_blood_related", !!c)}
                  />
                  <Label htmlFor={`blood_related_${index}`} className="font-normal">Blood Related?</Label>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
               <Label>Vital Status</Label>
               <Select
                value={item.vital_status}
                onValueChange={(val) => handleFieldChange(index, "vital_status", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alive">Alive</SelectItem>
                  <SelectItem value="Deceased">Deceased</SelectItem>
                  <SelectItem value="Unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
               <Label>{item.vital_status === 'Deceased' ? 'Age at Death' : 'Current Age'}</Label>
               <Input
                  type="number"
                  value={item.age_now_death ?? ""}
                  onChange={(e) => handleFieldChange(index, "age_now_death", e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="e.g. 65"
               />
               {errors[index]?.age_now_death && <p className="text-sm text-destructive">{errors[index].age_now_death}</p>}
            </div>
          </div>

          {/* Cancer History - Nested Repeating Group */}
          <div className="space-y-2">
            <Label className="font-semibold">Cancer History</Label>
            <div className="pl-4 border-l-2 border-gray-200 space-y-3">
              {(item.cancers || []).map((cancer, cancerIndex) => (
                <div key={cancerIndex} className="space-y-2 bg-gray-50 p-3 rounded relative">
                  <button
                    type="button"
                    onClick={() => handleRemoveCancer(index, cancerIndex)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                  <div className="space-y-2">
                    <Label>Type of Cancer</Label>
                    <SearchableSelect
                      value={cancer.cancer_type}
                      onChange={(val) => handleCancerFieldChange(index, cancerIndex, "cancer_type", val)}
                      options={options.cancerTypes}
                      placeholder="Search cancer type..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Age at Diagnosis</Label>
                    <Input
                      type="number"
                      value={cancer.age_dx ?? ""}
                      onChange={(e) => handleCancerFieldChange(index, cancerIndex, "age_dx", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="e.g. 55"
                      min={0}
                      max={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Laterality (if applicable)</Label>
                    <Select
                      value={cancer.laterality}
                      onValueChange={(val) => handleCancerFieldChange(index, cancerIndex, "laterality", val)}
                    >
                      <SelectTrigger><SelectValue placeholder="Select side" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Left">Left</SelectItem>
                        <SelectItem value="Right">Right</SelectItem>
                        <SelectItem value="Bilateral">Bilateral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleAddCancer(index)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add Cancer
              </button>
            </div>
          </div>
          
           <div className="flex flex-wrap gap-4">
             <div className="flex items-center space-x-2">
              <Checkbox
                id={`multiple_primaries_${index}`}
                checked={item.multiple_primaries}
                onCheckedChange={(checked) => handleFieldChange(index, "multiple_primaries", !!checked)}
              />
              <Label htmlFor={`multiple_primaries_${index}`} className="font-normal">
                Multiple primary cancers?
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`genetic_syndrome_${index}`}
                checked={item.known_genetic_syndrome}
                onCheckedChange={(checked) => handleFieldChange(index, "known_genetic_syndrome", !!checked)}
              />
              <Label htmlFor={`genetic_syndrome_${index}`} className="font-normal">
                Known Genetic Syndrome?
              </Label>
            </div>
          </div>
        </div>
      )}
    </RepeatingGroup>
    </div>
  );
};
]]>
</file>
<file path="src/components/assessment/SmokingDetails.tsx">
<![CDATA[
'use client'

import React, { useState, useEffect } from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { YearInput } from '../ui/YearInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { isQuestionVisible } from '@/lib/utils/question-visibility';
import { CheckboxGroup } from '../ui/CheckboxGroup';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SmokingDetailsProps {
  answers: Record<string, string>;
  onAnswer: (id: string, value: string) => void;
  questions: any[];
}

export const SmokingDetails = ({ answers, onAnswer, questions }: SmokingDetailsProps) => {
  const t = useTranslations("AssessmentPage");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const handleValidatedChange = (id: string, value: string, type: string) => {
    let error: string | undefined = undefined;
    
    if (type === 'number_input') {
        const num = Number(value);
        if (value && isNaN(num)) {
            error = t("validNumber");
        } else if (value && num < 0) {
            error = t("positiveValue");
        }

        // Specific validation for smoking intensity
        if (id === 'smoking.intensity') {
            const unit = answers['smoking.intensity_unit'];
            if (unit === 'Packs per day') {
                if (num > 10) error = "Value seems high for packs per day (max 10).";
            } else { // Cigarettes per day (default)
                if (num > 200) error = "Value seems high (max 200).";
            }
        }
    }

    setErrors(prev => ({ ...prev, [id]: error }));
    onAnswer(id, value);
  };

  const visibleQuestions = questions.filter(q => isQuestionVisible(q, answers));

  return (
    <div className="space-y-6">
      {visibleQuestions.map(q => {
        const value = answers[q.id] || "";
        const error = errors[q.id];

        // Custom rendering for unit toggle to match "Number with unit toggle" spec
        if (q.id === 'smoking.intensity_unit') {
             return (
                 <div key={q.id} className="space-y-2">
                     <Label>{q.text}</Label>
                     <div className="flex space-x-2">
                         {q.options?.map((opt: string) => (
                             <button
                                 key={opt}
                                 type="button"
                                 onClick={() => onAnswer(q.id, opt)}
                                 className={cn(
                                     "px-4 py-2 rounded-md text-sm font-medium transition-colors border",
                                     value === opt 
                                         ? "bg-primary text-primary-foreground border-primary" 
                                         : "bg-background text-foreground hover:bg-muted border-input"
                                 )}
                             >
                                 {opt}
                             </button>
                         ))}
                     </div>
                 </div>
             )
        }

        return (
        <div key={q.id} className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor={q.id}>{q.text}</Label>
            {q.id === 'smoking.years_smoked' && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{t('decadeHelper')}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
          </div>
          
          {q.type === 'year_input' ? (
             <YearInput
              id={q.id}
              value={value}
              onChange={(val) => onAnswer(q.id, val ? String(val) : '')}
              placeholder={q.placeholder}
            />
          ) : q.type === 'date_input' ? (
            <Input
              id={q.id}
              type="date"
              value={value}
              onChange={(e) => onAnswer(q.id, e.target.value)}
              placeholder={q.placeholder}
            />
          ) : q.type === 'select' ? (
             <Select onValueChange={(val) => onAnswer(q.id, val)} value={value}>
                <SelectTrigger id={q.id}>
                    <SelectValue placeholder={t("selectOption")} />
                </SelectTrigger>
                <SelectContent>
                    {q.options?.map((opt: any) => {
                         const val = typeof opt === 'object' ? opt.value : opt;
                         const label = typeof opt === 'object' ? (typeof opt.label === 'object' ? opt.label.en : opt.label) : opt;
                         return <SelectItem key={val} value={val}>{label}</SelectItem>
                    })}
                </SelectContent>
             </Select>
          ) : q.type === 'radio' ? (
             <Select onValueChange={(val) => onAnswer(q.id, val)} value={value}>
                <SelectTrigger id={q.id}>
                    <SelectValue placeholder={t("selectOption")} />
                </SelectTrigger>
                <SelectContent>
                    {q.options?.map((opt: any) => {
                         const val = typeof opt === 'object' ? opt.value : opt;
                         const label = typeof opt === 'object' ? (typeof opt.label === 'object' ? opt.label.en : opt.label) : opt;
                         return <SelectItem key={val} value={val}>{label}</SelectItem>
                    })}
                </SelectContent>
             </Select>
          ) : q.type === 'checkbox_group' ? (
             <CheckboxGroup
                options={q.options}
                value={value ? JSON.parse(value) : []}
                onChange={(val) => onAnswer(q.id, JSON.stringify(val))}
                exclusiveOption={q.exclusiveOptionId}
             />
          ) : (
            <>
                <Input
                id={q.id}
                type="number"
                value={value}
                onChange={(e) => handleValidatedChange(q.id, e.target.value, 'number_input')}
                placeholder={q.id === 'smoking.intensity' ? (answers['smoking.intensity_unit'] === 'Packs per day' ? 'e.g. 1.5' : 'e.g. 20') : q.placeholder}
                min="0"
                step={q.id === 'smoking.intensity' && answers['smoking.intensity_unit'] === 'Packs per day' ? "0.1" : "1"}
                className={cn(error && "border-destructive focus-visible:ring-destructive")}
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
            </>
          )}
        </div>
      )})}
    </div>
  );
};
]]>
</file>
<file path="TASKS.md">
<![CDATA[
# ONKONO Codebase Alignment Plan

This plan details the specific tasks required to align the `src/` codebase with the PDF specifications (ONKONO_form_specs).

## 1. Core & Biometrics Alignment
*File: `src/lib/assessment-questions.json`, `src/app/[locale]/assessment/page.tsx`*

- [x] **Adult Gate Logic:** Update `AssessmentPage.tsx` to strictly enforce the adult gate logic. If `derived.adult_gate_ok` is false, block navigation and show the specific EN/PL error message defined in PDF Page 2 ("This version of the tool is designed for adults...").
- [x] **Biometrics Soft Warnings:** Update `AssessmentPage.tsx` validation for `height_cm` and `weight_kg`.
    - **Height:** Hard range 50-250cm. **New:** Add *soft warning* if <120 or >220 ("Please check if this is correct").
    - **Weight:** Hard range 30-300kg. **New:** Add *soft warning* if <40 or >220.
- [x] **Sex at Birth:** Ensure the "Intersex" option is handled correctly in `derived-variables.service.ts` (mapped to `unknown` for screening logic as per PDF).

## 2. Lifestyle Modules (Smoking, Alcohol, Diet)
*Files: `src/components/assessment/SmokingDetails.tsx`, `src/components/assessment/GenericModule.tsx`, `src/lib/assessment-questions.json`*

- [x] **Smoking Intensity Toggle:** In `SmokingDetails.tsx`, ensure the UI allows toggling between "Cigarettes per day" and "Packs per day". The PDF specifies this toggle to normalize data to `cigs_per_day` on the backend.
- [x] **Alcohol Standard Drink Info:** Update `assessment-questions.json` for `alcohol.status` to include the specific `infoCard` definition from PDF Page 6 (10g pure ethanol examples).
- [x] **Diet - Legumes Logic:** In `assessment-questions.json`, update `dependsOn` for `diet.legumes_freq_week`.
    - **Current:** Simple dependence.
    - **PDF Requirement:** Show ONLY IF `diet.fv_portions_day < 4` **OR** `diet.whole_grains_servings_day < 1.5`. (Need to implement complex `OR` dependency logic in `GenericModule.tsx`).
- [x] **Diet - UPF Slider:** Update `diet.upf_share_pct` visibility.
    - **PDF Requirement:** Show ONLY IF `diet.fastfoods_freq_week >= 2`.

## 3. Advanced Clinical Modules
*Files: `src/components/assessment/`, `src/lib/mappings/`*

### Family History (`FamilyCancerHistory.tsx`)
- [x] **Relative Side Inference:** Ensure logic auto-fills `side_of_family` based on relation (e.g., Mother -> Maternal).
- [x] **Cancer Site List:** Verify `cancerTypes` options match the specific list on PDF Page 29 (ensure "Stomach", "Pancreas", "Melanoma" are present).
- [x] **Pattern Flags:** Ensure `derived-variables.service.ts` calculates `derived.famhx.pattern_colorectal_cluster` exactly as: "≥1 FDR with colorectal cancer <50y OR ≥2 blood relatives with colorectal on same side".

### Occupational Hazards (`OccupationalHazards.tsx`)
- [x] **Hazard List Alignment:** Update `options.exposures` in `OccupationalHazards.tsx` to match PDF Page 49 checklist exactly.
    - Ensure "Rubber, dye or chemical manufacturing" maps to `occ.hazard.rubber_chem`.
    - Ensure "Formaldehyde" and "Ionizing radiation" are present.
- [x] **Detail Row Logic:** Ensure the detail view (Job title, years, hours/week) appears for **each** selected hazard (as per PDF Page 50).

### Sexual Health (`SexualHealth.tsx`)
- [x] **Opt-in Logic:** Ensure `sexhx.section_opt_in` is the *only* visible question initially.
- [x] **MSM Flag:** In `derived-variables.service.ts`, verify `derived.sex.msm_behavior` logic:
    - Male users who select "Male" or "Both" in `sexhx.partner_genders`.
- [x] **Anal Risk Flag:** Update `derived.sex.highrisk_anal_cancer_group` to strictly follow PDF Page 14 logic (MSM + Age>=35 OR HIV OR Transplant).

## 4. Derived Variables Service Refactor
*File: `src/lib/services/derived-variables.service.ts`*

The PDF contains precise formulas that must be replicated.

- [x] **WCRF Score:** Verify `calculateWcrf` logic against PDF Page 8.
    - Component B (Fast Food): 1.0 if ≤1/wk, 0.5 if 2-3/wk.
    - Component C (Meat): 1.0 if Red ≤350g AND Processed=0.
- [x] **Lung Cancer Candidate:** Update `screen.lung_candidate` logic.
    - **PDF:** Pack-years ≥ 20 (Configurable) AND Age 50-80 (or config limits) AND (Current smoker OR Former quit <15y).
- [x] **Liver Surveillance:** Ensure `derived.hcc.surveillance_candidate` includes `cond.cirrhosis.etiology` logic (if collected) or simple `cond.cirrhosis=Yes` OR `cond.hbv.status=Chronic`.
- [x] **Skin Risk:** Update `derived.screen.skin_check_recommended`.
    - **PDF:** `skin.lymphoma_highrisk` (immunosuppression) **OR** `env.uv_high` (sunbeds) **OR** `occ.skin_uv_highrisk`.

## 5. Mappings & Codebooks
*Files: `src/lib/mappings/*.map.ts`*

- [x] **SNOMED/LOINC:** Ensure all new fields from the PDF (e.g., specific symptom HPO codes on PDF Page 15) are added to `symptom-details.map.ts` or `assessment-questions.json` IDs.
- [x] **Genetic Genes:** Update `genetic-genes.map.ts` to include any missing genes listed on PDF Page 35 (e.g., `MITF_E318K`, `RECQL` if listed).

## 6. PDF Generator Updates
*File: `src/lib/utils/pdf-generator.ts`*

- [x] **Disclaimer Text:** Update the PDF disclaimer text to match the exact EN/PL strings provided in the PDF "Microcopy" sections.
- [x] **Derived Values:** Ensure NO numeric risk scores (e.g., "WCRF Score: 3.5") are printed on the user PDF. Only print the *result* (e.g., "Lifestyle compliance: High").

## 7. UX / Microcopy (Localization)
*Files: `messages/en.json`, `messages/pl.json`*

- [x] **Standardize Helpers:** Copy the exact "Short helper" and "Tooltip" texts from the PDF columns into the i18n JSON files.
    - *Example:* For `smoking.years_smoked`, add the "decade helper" tooltip text.
    - *Example:* For `family_cancer_history`, ensure the definition of "Biological family" is visible.
]]>
</file>
</modifications>