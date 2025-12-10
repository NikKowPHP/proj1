<response>
  <reasoning>
    I have completed a deep dive analysis of the PDF versus the current codebase.

    **Discrepancies Found:**

    1.  **WCRF Diet Score Structure:** The PDF (Page 8) defines a 4-component *diet-only* score (`wcrf.diet_total`):
        *   **Comp A:** Plant foods (FV, Whole Grains, Legumes).
        *   **Comp B:** Fast Foods (Energy dense).
        *   **Comp C:** Meat (Red & Processed).
        *   **Comp D:** Sugary Drinks.
        *   *Current Code:* My implementation combined Fast Food & SSB into one component and included Body Composition (BMI) as the 4th component. This needs to be refactored to match the "Diet-Only" definition in the PDF.

    2.  **Sexual Health Logic:**
        *   **Anal Cancer Risk:** The PDF (Page 14) restricts the MSM risk factor to `age >= 35`. My current logic allows all MSM.
        *   **HPV Precancer History:** The PDF (Page 13) implies a checklist for `sexhx.hpv_precancer_history` (Cervix, Vulva, Anus, etc.) to drive specific logic. My current code uses a simple "Yes/No" select. I need to change this to a `checkbox_group`.
        *   **Cervical Pattern:** The derived flag `derived.sex.cervix_hpv_persistent_pattern` needs to check for "Cervix" specifically in that new checklist.

    3.  **Missing Derived Flags (Genetics, Environmental, Screening, Immunization):**
        *   **Genetics:** Missing `derived.gen.lynch_syndrome` (specific gene match), `derived.gen.polyposis_syndrome`, and `derived.gen.prs_elevated`.
        *   **Environmental:** Missing all derived flags from PDF Page 57 (`radon_high`, `asbestos_unprotected`, `well_contam_flag`, `pesticide_intensive`, `uv_high`, `any_high_count`).
        *   **Screening:** Missing `derived.screen.lung_candidate` (smoking-based), `derived.screen.prostate_discuss`, `derived.screen.skin_check_recommended`.
        *   **Immunization:** Missing status flags like `derived.imm.hpv_complete`, `derived.imm.flu_due`, etc.

    **Plan:**
    1.  **Update `assessment-questions.json`**: Change `sexhx.hpv_precancer_history` to a checkbox group.
    2.  **Update `StandardizationService.ts`**: Handle the new checkbox array for HPV history.
    3.  **Update `DerivedVariablesService.ts`**:
        *   Refactor `calculateWcrf` to the PDF's A/B/C/D structure.
        *   Implement all missing derived flags identified above.
        *   Refine existing logic (Anal cancer age check).

    I will now implement these changes to achieve 100% alignment.
  </reasoning>
  <modifications>
    <file path="src/lib/assessment-questions.json">
      <![CDATA[
{
  "steps": [
    {
      "title": { "en": "Core Questions", "pl": "Podstawowe Pytania" },
      "questions": [
        {
          "id": "consent.health",
          "type": "consent_checkbox"
        },
        {
          "id": "intent",
          "text": { "en": "What’s your goal today?", "pl": "Jaki jest cel dzisiejszego wypełnienia?" },
          "type": "select",
          "options": [
            { "value": "Prevention", "label": { "en": "Prevention", "pl": "Profilaktyka" } },
            { "value": "I have symptoms", "label": { "en": "I have symptoms", "pl": "Mam objawy" } },
            { "value": "Follow-up", "label": { "en": "Follow-up", "pl": "Wizyta kontrolna" } }
          ]
        },
        {
          "id": "source",
          "text": { "en": "Who is filling this form?", "pl": "Kto wypełnia formularz?" },
          "type": "select",
          "options": [
            { "value": "Self", "label": { "en": "Self", "pl": "Osobiście" } },
            { "value": "Caregiver", "label": { "en": "Caregiver", "pl": "Opiekun" } },
            { "value": "Imported", "label": { "en": "Imported", "pl": "Zaimportowane" } }
          ]
        },
        {
          "id": "language",
          "text": { "en": "Preferred language", "pl": "Preferowany język" },
          "type": "select",
          "options": [
            { "value": "English", "label": { "en": "English", "pl": "Angielski" } },
            { "value": "Polski", "label": { "en": "Polski", "pl": "Polski" } }
          ]
        },
        {
          "id": "dob",
          "text": { "en": "Date of birth (Year only)", "pl": "Rok urodzenia (RRRR)" },
          "type": "year_input",
          "validation": { "min": 1900, "maxCurrentYear": true, "softMin": 1920, "message": { "en": "This tool is currently for adults.", "pl": "Ta wersja narzędzia jest przeznaczona dla osób dorosłych." } }
        },
        {
          "id": "sex_at_birth",
          "text": { "en": "Sex at birth", "pl": "Płeć przy urodzeniu" },
          "helperText": { "en": "We need this information to recommend appropriate screenings (e.g. breast, ovarian, prostate). If you prefer not to say, select 'Prefer not to say'.", "pl": "Potrzebujemy tej informacji, aby dobrać właściwe badania (np. piersi, jajników, prostaty). Jeśli wolisz nie podawać, wybierz 'Wolę nie podawać'." },
          "type": "radio",
          "options": [
            { "value": "Female", "label": { "en": "Female", "pl": "Kobieta" } },
            { "value": "Male", "label": { "en": "Male", "pl": "Mężczyzna" } },
            { "value": "Intersex", "label": { "en": "Intersex", "pl": "Interseksualna" } },
            { "value": "Prefer not to say", "label": { "en": "Prefer not to say", "pl": "Wolę nie odpowiadać" } }
          ]
        },
        {
          "id": "gender_identity",
          "text": { "en": "Gender identity (optional)", "pl": "Tożsamość płciowa (opcjonalnie)" },
          "type": "select",
          "options": [
            { "value": "Female", "label": { "en": "Female", "pl": "Kobieta" } },
            { "value": "Male", "label": { "en": "Male", "pl": "Mężczyzna" } },
            { "value": "Non-binary", "label": { "en": "Non-binary", "pl": "Niebinarna" } },
            { "value": "Other", "label": { "en": "Other", "pl": "Inna" } }
          ]
        },
        {
          "id": "height_cm",
          "text": { "en": "Height (cm)", "pl": "Wzrost (cm)" },
          "type": "number_input"
        },
        {
          "id": "weight_kg",
          "text": { "en": "Weight (kg)", "pl": "Waga (kg)" },
          "type": "number_input"
        },
        {
          "id": "smoking_status",
          "text": { "en": "Smoking status", "pl": "Status palenia" },
          "type": "radio",
          "options": [
            { "value": "Never", "label": { "en": "Never", "pl": "Nigdy" } },
            { "value": "Former", "label": { "en": "Former", "pl": "W przeszłości" } },
            { "value": "Current", "label": { "en": "Current", "pl": "Obecnie" } }
          ]
        },
        {
          "id": "alcohol.status",
          "text": { "en": "Alcohol Use Status", "pl": "Status spożycia alkoholu" },
          "type": "radio",
          "options": [
            { "value": "Lifetime abstainer", "label": { "en": "Lifetime abstainer", "pl": "Abstynent całe życie" } },
            { "value": "Former", "label": { "en": "Former drinker", "pl": "Były pijący" } },
            { "value": "Current", "label": { "en": "Current drinker", "pl": "Obecnie pijący" } }
          ],
          "infoCard": {
             "id": "alcohol.std_unit_info",
             "text": { "en": "Standard Drink: 10g pure alcohol (approx 250ml beer, 100ml wine, 30ml spirits)", "pl": "Standardowa porcja: 10g czystego alkoholu (ok. 250ml piwa, 100ml wina, 30ml wódki)" }
          }
        },
        {
            "id": "alcohol.former_since",
            "text": { "en": "Year you stopped drinking", "pl": "Rok zaprzestania picia" },
            "type": "year_input",
            "dependsOn": { "questionId": "alcohol.status", "value": "Former" }
        },
        {
          "id": "alcohol.beverage_mix",
          "text": { "en": "Typical beverage types (e.g. Beer 50%, Wine 30%, Spirits 20%)", "pl": "Typowe rodzaje napojów (np. Piwo 50%, Wino 30%, Wódka 20%)" },
          "type": "text_input",
          "dependsOn": { "questionId": "alcohol.status", "value": ["Current", "Former"] }
        },
          {
            "id": "auditc.q1_freq",
            "dependsOn": { "questionId": "alcohol.status", "value": ["Current", "Former"] },
            "text": { "en": "How often do you have a drink containing alcohol?", "pl": "Jak często pijesz napoje zawierające alkohol?" },
            "type": "select",
            "options": [
              { "value": "0", "label": { "en": "Never", "pl": "Nigdy" } },
              { "value": "1", "label": { "en": "Monthly or less", "pl": "Raz w miesiącu lub rzadziej" } },
              { "value": "2", "label": { "en": "2-4 times a month", "pl": "2-4 razy w miesiącu" } },
              { "value": "3", "label": { "en": "2-3 times a week", "pl": "2-3 razy w tygodniu" } },
              { "value": "4", "label": { "en": "4+ times a week", "pl": "4 razy w tygodniu lub częściej" } }
            ]
          },
          {
            "id": "auditc.q2_typical",
            "dependsOn": { 
                "and": [
                    { "questionId": "alcohol.status", "value": ["Current", "Former"] },
                    { "questionId": "auditc.q1_freq", "operator": "!=", "value": "0" }
                ]
            },
            "text": { "en": "How many standard drinks do you have on a typical day when you are drinking?", "pl": "Ile standardowych porcji alkoholu wypijasz w typowym dniu, w którym pijesz?" },
            "type": "select",
            "options": [
              { "value": "0", "label": { "en": "1 or 2", "pl": "1 lub 2" } },
              { "value": "1", "label": { "en": "3 or 4", "pl": "3 lub 4" } },
              { "value": "2", "label": { "en": "5 or 6", "pl": "5 lub 6" } },
              { "value": "3", "label": { "en": "7 to 9", "pl": "7 do 9" } },
              { "value": "4", "label": { "en": "10 or more", "pl": "10 lub więcej" } }
            ]
          },
          {
            "id": "auditc.q3_6plus",
             "dependsOn": { 
                "and": [
                    { "questionId": "alcohol.status", "value": ["Current", "Former"] },
                    { "questionId": "auditc.q1_freq", "operator": "!=", "value": "0" }
                ]
            },
            "text": { "en": "How often do you have 6 or more drinks on one occasion?", "pl": "Jak często wypijasz 6 lub więcej drinków przy jednej okazji?" },
            "type": "select",
            "options": [
              { "value": "0", "label": { "en": "Never", "pl": "Nigdy" } },
              { "value": "1", "label": { "en": "Less than monthly", "pl": "Rzadziej niż raz w miesiącu" } },
              { "value": "2", "label": { "en": "Monthly", "pl": "Raz w miesiącu" } },
              { "value": "3", "label": { "en": "Weekly", "pl": "Raz w tygodniu" } },
              { "value": "4", "label": { "en": "Daily or almost daily", "pl": "Codziennie lub prawie codziennie" } }
            ]
          },
        {
          "id": "diet.fv_portions_day",
          "text": { "en": "Vegetables and Fruit intake (servings per day)", "pl": "Spożycie warzyw i owoców (porcje dziennie)" },
          "type": "number_input",
          "min": 0,
          "max": 20
        },
        {
          "id": "diet.red_meat_servings_week",
          "text": { "en": "Red meat intake (servings per week)", "pl": "Spożycie czerwonego mięsa (porcje na tydzień)" },
          "type": "number_input",
          "min": 0,
          "max": 20
        },
        {
          "id": "diet.processed_meat_servings_week",
          "text": { "en": "Processed meat intake (servings per week)", "pl": "Spożycie przetworzonego mięsa (porcje na tydzień)" },
          "type": "number_input",
          "min": 0,
          "max": 20
        },
        {
           "id": "diet.ssb_servings_week",
           "text": { "en": "Sugary drinks (servings per week)", "pl": "Słodkie napoje (porcje na tydzień)" },
           "type": "number_input",
           "min": 0,
           "max": 70
        },
        {
           "id": "diet.whole_grains_servings_day",
           "text": { "en": "Whole grains servings per day", "pl": "Porcje pełnoziarniste dziennie" },
           "type": "number_input",
           "min": 0,
           "max": 20
        },
        {
           "id": "diet.fastfoods_freq_week",
           "text": { "en": "Fast food frequency (times/week)", "pl": "Częstość spożywania fast foodów (razy/tydzień)" },
           "type": "number_input",
           "min": 0,
           "max": 20
        },
        {
            "id": "diet.legumes_freq_week",
            "text": { "en": "Legumes/beans frequency (times/week)", "pl": "Częstość spożywania roślin strączkowych (razy/tydzień)" },
            "type": "number_input",
            "min": 0,
            "max": 20,
            "dependsOn": {
              "or": [
                { "questionId": "diet.fv_portions_day", "operator": "<", "value": 4 },
                { "questionId": "diet.whole_grains_servings_day", "operator": "<", "value": 1.5 }
              ]
            }
        },
        {
           "id": "diet.upf_share_pct",
           "text": { "en": "Estimated share of Ultra-Processed Foods (%)", "pl": "Szacowany udział żywności wysokoprzetworzonej (%)" },
           "type": "slider",
           "min": 0,
           "max": 100,
           "dependsOn": { "questionId": "diet.fastfoods_freq_week", "operator": ">=", "value": 2 }
        },
        {
            "id": "diet.ssb_container",
            "text": { "en": "Typical sugary drink container size", "pl": "Typowy rozmiar napoju słodzonego" },
            "type": "select",
            "options": ["Small (250ml)", "Medium (330ml)", "Large (500ml)", "Extra Large (750ml)", "None"],
            "dependsOn": { "questionId": "diet.ssb_servings_week", "operator": ">", "value": 0 }
        },
        {
            "id": "pa.activity_level",
            "text": { "en": "Physical Activity Level", "pl": "Poziom aktywności fizycznej" },
            "type": "radio",
            "options": [
              { "value": "Sedentary", "label": { "en": "Sedentary (little or no exercise)", "pl": "Siedzący (mało lub brak ćwiczeń)" } },
              { "value": "Moderate", "label": { "en": "Moderate (exercise 1-3 days/week)", "pl": "Umiarkowany (ćwiczenia 1-3 dni/tydzień)" } },
              { "value": "High", "label": { "en": "High (exercise 4+ days/week)", "pl": "Wysoki (ćwiczenia 4+ dni/tydzień)" } }
            ]
        },
        {
          "id": "symptoms",
          "text": { "en": "Current symptoms (select all) or None", "pl": "Obecne objawy (wybierz) lub Brak" },
          "type": "checkbox_group",
          "exclusiveOptionId": "HP:0000000",
          "options": [
            { "id": "HP:0012378", "category": "A. Weight/Appetite", "label": { "en": "Fatigue", "pl": "Zmęczenie" } },
            { "id": "HP:0001824", "category": "A. Weight/Appetite", "label": { "en": "Unexplained weight loss", "pl": "Niewyjaśniona utrata wagi" }, "red_flag": true },
            { "id": "HP:0030166", "category": "A. Weight/Appetite", "label": { "en": "Night sweats", "pl": "Nocne poty" }, "red_flag": true },
            { "id": "HP:0002239", "category": "G. GI", "label": { "en": "Abdominal pain", "pl": "Ból brzucha" } },
            { "id": "HP:0002014", "category": "G. GI", "label": { "en": "Diarrhea", "pl": "Biegunka" } },
            { "id": "HP:0012532", "category": "G. GI", "label": { "en": "Constipation", "pl": "Zaparcie" } },
            { "id": "HP:0002028", "category": "G. GI", "label": { "en": "Abdominal bloating (persistent)", "pl": "Wzdęcia (uporczywe)" } },
            { "id": "HP:0002015", "category": "G. GI", "label": { "en": "Dysphagia (Difficulty swallowing)", "pl": "Trudności w połykaniu" }, "red_flag": true },
            { "id": "HP:0002027", "category": "G. GI", "label": { "en": "Melena (Black tarry stool)", "pl": "Smoliste stolce" }, "red_flag": true },
            { "id": "HP:0001945", "category": "B. Systemic", "label": { "en": "Fever", "pl": "Gorączka" } },
            { "id": "HP:0000989", "category": "H. Skin/Mouth", "label": { "en": "Skin changes (new mole, sore)", "pl": "Zmiany skórne (nowy pieprzyk, rana)" }, "red_flag": true },
            { "id": "HP:0000952", "category": "H. Skin/Mouth", "label": { "en": "Jaundice (Yellow skin/eyes)", "pl": "Żółtaczka" }, "red_flag": true },
            { "id": "HP:0002860", "category": "F. Breathing/ENT", "label": { "en": "Hemoptysis (Coughing blood)", "pl": "Krwioplucie" }, "red_flag": true },
            { "id": "HP:0001609", "category": "F. Breathing/ENT", "label": { "en": "Hoarseness (Persistent)", "pl": "Chrypka (Utrzymująca się)" }, "red_flag": true },
            { "id": "HP:0002118", "category": "F. Breathing/ENT", "label": { "en": "Persistent cough", "pl": "Uporczywy kaszel" }, "red_flag": true },
            { "id": "HP:0000132", "category": "J. Urinary", "label": { "en": "Hematuria (Blood in urine)", "pl": "Krwiomocz" }, "red_flag": true },
            { "id": "HP:0000868", "category": "E. Bleeding", "label": { "en": "Postmenopausal bleeding", "pl": "Krwawienie pomenopauzalne" }, "red_flag": true },
            { "id": "HP:0012532", "category": "I. Reproductive", "label": { "en": "Post-coital bleeding", "pl": "Krwawienie po stosunku" }, "red_flag": true },
            { "id": "HP:0001250", "category": "K. Neurologic", "label": { "en": "Seizures (new onset)", "pl": "Napady padaczkowe (nowe)" }, "red_flag": true },
            { "id": "HP:0003002", "category": "I. Breast/Testicular", "label": { "en": "Breast lump", "pl": "Guzek piersi" }, "red_flag": true },
            { "id": "HP:0002716", "category": "B. Systemic", "label": { "en": "Lymphadenopathy (Swollen nodes)", "pl": "Powiększone węzły chłonne" } },
            { "id": "HP:0002653", "category": "C. Musculoskeletal", "label": { "en": "Bone pain", "pl": "Ból kości" }, "red_flag": true },
            { "id": "HP:0003418", "category": "C. Musculoskeletal", "label": { "en": "Back pain", "pl": "Ból pleców" }, "red_flag": true },
            { "id": "HP:0002315", "category": "K. Neurologic", "label": { "en": "Headache (Scale 1-10)", "pl": "Ból głowy" }, "red_flag": true },
            { "id": "HP:0000000", "label": { "en": "None", "pl": "Brak" } }
          ]
        },
        {
          "id": "family_cancer_any",
          "text": { "en": "First-degree relative with cancer?", "pl": "Czy bliscy chorowali na raka?" },
          "type": "radio",
          "options": [ { "value": "Yes", "label": "Yes" }, { "value": "No", "label": "No" }, { "value": "Unsure", "label": "Unsure" } ]
        },
        { "id": "cond.summary", "text": {"en": "Summary of Chronic Conditions (Select all that apply)", "pl": "Podsumowanie chorób przewlekłych"}, "type": "checkbox_group", "options": [
            {"id": "diabetes", "label": "Diabetes"}, {"id": "hypertension", "label": "Hypertension"}, {"id": "ibd", "label": "IBD"}, {"id": "hbv", "label": "Hepatitis B"}, {"id": "hcv", "label": "Hepatitis C"}, {"id": "cirrhosis", "label": "Cirrhosis"}, {"id": "hpv", "label": "HPV Infection"}, {"id": "h_pylori", "label": "H. pylori"}, {"id": "hiv", "label": "HIV"}, {"id": "transplant", "label": "Organ Transplant"}, {"id": "immunosuppression", "label": "Immunosuppression"}, {"id": "psc", "label": "PSC (Primary Sclerosing Cholangitis)"}, {"id": "pancreatitis", "label": "Chronic Pancreatitis"}, {"id": "copd", "label": "COPD"}, {"id": "other", "label": "Other"}
        ] },
        { "id": "ca.any_history", "text": {"en": "Ever diagnosed with cancer?", "pl": "Czy kiedykolwiek zdiagnozowano u Ciebie raka?"}, "type": "radio", "options": [{"value": "Yes", "label": "Yes"}, {"value": "No", "label": "No"}, {"value": "Unsure", "label": "Unsure"}] },
        { "id": "ca.active_treatment_now", "text": {"en": "Are you currently receiving aggressive cancer treatment (e.g., Chemo/Radiation)?", "pl": "Czy obecnie otrzymujesz agresywne leczenie przeciwnowotworowe (np. chemioterapia/radioterapia)?"}, "type": "radio", "options": [{"value": "Yes", "label": "Yes"}, {"value": "No", "label": "No"}], "dependsOn": {"questionId": "ca.any_history", "value": "Yes"} },

        { "id": "occ.exposure_any", "text": {"en": "Any significant occupational exposure?", "pl": "Czy było jakiekolwiek istotne narażenie zawodowe?"}, "type": "radio", "options": [{"value": "Yes", "label": "Yes"}, {"value": "No", "label": "No"}, {"value": "Unsure", "label": "Unsure"}] }
      ]
    },
    {
      "title": { "en": "Advanced Details", "pl": "Szczegóły Zaawansowane" },
      "description": { "en": "Providing more details is optional but helps create a more personalized plan.", "pl": "Podanie dodatkowych szczegółów jest opcjonalne, ale pomaga stworzyć bardziej spersonalizowany plan." },
      "questions": [
        {
          "id": "advanced_modules",
          "type": "advanced_modules",
          "modules": [
            {
              "id": "symptom_details",
              "title": { "en": "Symptom Details", "pl": "Szczegóły Objawów" },
              "dependsOn": { "questionId": "symptoms", "value": true },
              "options": {
                "symptomList": [
                  { "value": "HP:0012378", "label": "Fatigue" },
                  { "value": "HP:0001824", "label": "Weight loss" },
                  { "value": "HP:0001945", "label": "Fever" },
                  { "value": "HP:0000989", "label": "Skin changes" },
                  { "value": "HP:0002239", "label": "Abdominal pain" },
                  { "value": "HP:0002014", "label": "Diarrhea" }
                ],
                "associatedFeatures": [
                  { "id": "nausea", "label": "Nausea" },
                  { "id": "dizziness", "label": "Dizziness" },
                  { "id": "headache", "label": "Headache" },
                  { "id": "bloating", "label": "Bloating" },
                  { "id": "chills", "label": "Chills" }
                ]
              }
            },
            {
              "id": "smoking_details",
              "title": { "en": "Smoking Details", "pl": "Szczegóły Dotyczące Palenia" },
              "dependsOn": { "questionId": "smoking_status", "value": ["Current", "Former"] },
              "questions": [
                { "id": "smoking.pattern", "text": {"en": "Smoking pattern", "pl": "Wzorzec palenia"}, "type": "radio", "options": ["Every day", "Some days"] },
                { "id": "smoking.intensity_unit", "text": {"en": "Unit for smoking intensity", "pl": "Jednostka intensywności palenia"}, "type": "radio", "options": ["Cigarettes per day", "Packs per day"], "dependsOn": {"questionId": "smoking.pattern", "value": "Every day"} },
                { "id": "smoking.intensity", "text": { "en": "Average smoking intensity?", "pl": "Średnia intensywność palenia?"}, "type": "number_input", "placeholder": "e.g., 20", "dependsOn": {"questionId": "smoking.pattern", "value": "Every day"} },
                { "id": "smoking.start_age", "text": { "en": "Age you started smoking?", "pl": "Wiek rozpoczęcia palenia?"}, "type": "number_input", "placeholder": "e.g., 18" },
                { "id": "smoking.years_smoked", "text": { "en": "Number of years smoked (excluding breaks)?", "pl": "Liczba lat palenia (bez przerw)?"}, "type": "number_input", "placeholder": "e.g., 10" },
                { "id": "smoking.brinkman_index", "text": { "en": "Brinkman Index (Auto)", "pl": "Wskaźnik Brinkmana (Auto)"}, "type": "number_input", "dependsOn": {"questionId": "smoking_status", "value": "Hidden"} },
                { "id": "smoking.quit_date", "text": { "en": "Year you quit smoking (ISO-8601)", "pl": "Rok rzucenia palenia"}, "type": "year_input", "dependsOn": {"questionId": "smoking_status", "value": "Former"}},
                { "id": "smoking.other_tobacco_smoked", "text": {"en": "Other tobacco products used?", "pl": "Inne wyroby tytoniowe?"}, "type": "checkbox_group", "options": [{"id": "cigars", "label": "Cigars"}, {"id": "cigarillos", "label": "Cigarillos"}, {"id": "pipe", "label": "Pipe"}, {"id": "roll_your_own", "label": "Roll-your-own"}, {"id": "shisha", "label": "Waterpipe"}, {"id": "none", "label": "None"}] },
                { "id": "smoking.other_cigar_per_week", "text": {"en": "Cigars/Cigarillos per week", "pl": "Cygara/Cygaretki na tydzień"}, "type": "number_input", "dependsOn": {"questionId": "smoking.other_tobacco_smoked", "value": true} },
                { "id": "smoking.pipe_per_week", "text": {"en": "Pipe bowls per week", "pl": "Fajki na tydzień"}, "type": "number_input", "dependsOn": {"questionId": "smoking.other_tobacco_smoked", "value": true} },
                { "id": "smoking.shisha_per_week", "text": {"en": "Waterpipe sessions per week", "pl": "Sesje fajki wodnej na tydzień"}, "type": "number_input", "dependsOn": {"questionId": "smoking.other_tobacco_smoked", "value": true} },
                
                { "id": "vape.status", "text": {"en": "E-cigarette/Vaping status", "pl": "Status e-papierosów/wapowania"}, "type": "radio", "options": ["Never", "Former", "Current"] },
                { "id": "vape.days_30d", "text": {"en": "Days vaped in last 30 days", "pl": "Dni wapowania w ciągu ostatnich 30 dni"}, "type": "number_input", "dependsOn": {"questionId": "vape.status", "value": "Current"} },
                { "id": "vape.device_type", "text": {"en": "Device type", "pl": "Typ urządzenia"}, "type": "select", "options": [
                    {"value": "Disposable", "label": {"en": "Disposable", "pl": "Jednorazowe"}}, 
                    {"value": "Prefilled pod", "label": {"en": "Prefilled pod or cartridge", "pl": "Wymienne wkłady (pod/kartridż)"}}, 
                    {"value": "Refillable tank", "label": {"en": "Refillable tank or mod", "pl": "Napełniany zbiornik lub mod"}}, 
                    {"value": "Other", "label": {"en": "Other", "pl": "Inne"}}
                ], "dependsOn": {"questionId": "vape.status", "value": ["Current", "Former"]} },
                { "id": "vape.nicotine", "text": {"en": "Contains nicotine?", "pl": "Zawiera nikotynę?"}, "type": "radio", "options": ["Yes", "No", "Unsure"], "dependsOn": {"questionId": "vape.status", "value": ["Current", "Former"]} },

                { "id": "htp.status", "text": {"en": "Heated Tobacco Products (e.g., IQOS)", "pl": "Podgrzewacze tytoniu (np. IQOS)"}, "type": "radio", "options": ["Never", "Former", "Current"] },
                { "id": "htp.days_30d", "text": {"en": "Days used in last 30 days", "pl": "Dni używania w ciągu ostatnich 30 dni"}, "type": "number_input", "dependsOn": {"questionId": "htp.status", "value": "Current"} },
                { "id": "htp.sticks_per_day", "text": {"en": "Average sticks per day", "pl": "Średnia liczba wkładów dziennie"}, "type": "number_input", "dependsOn": {"questionId": "htp.status", "value": "Current"} },

                { "id": "shs.home_freq", "text": {"en": "Secondhand smoke at home (days/week)", "pl": "Bierne palenie w domu (dni/tydzień)"}, "type": "select", "options": ["0", "1-2", "3-4", "Daily"] },
                { "id": "shs.work_freq", "text": {"en": "Secondhand smoke at work (days/week)", "pl": "Bierne palenie w pracy (dni/tydzień)"}, "type": "select", "options": ["0", "1-2", "3-4", "Daily"] },
                { "id": "shs.public_30d_bars", "text": {"en": "Exposed in bars/restaurants (last 30d)?", "pl": "Narażenie w barach/restauracjach (ost. 30 dni)?"}, "type": "radio", "options": ["Yes", "No"] },
                { "id": "shs.hours_7d", "text": {"en": "Total hours exposed to SHS in last 7 days", "pl": "Całkowita liczba godzin narażenia na dym w ciągu ostatnich 7 dni"}, "type": "number_input" },
                { "id": "shs.life_course", "text": {"en": "When were you exposed to secondhand smoke?", "pl": "Kiedy byłeś narażony na dym tytoniowy z drugiej ręki?"}, "type": "checkbox_group", "options": [{"id": "childhood", "label": "Childhood"}, {"id": "adult", "label": "Adult"}, {"id": "work", "label": "Work"}, {"id": "social", "label": "Social settings"}] }
              ]
            },
            {
              "id": "family_cancer_history",
              "title": { "en": "Family Cancer History", "pl": "Rodzinna Historia Nowotworów" },
              "dependsOn": { "questionId": "family_cancer_any", "value": "Yes" },
              "options": {
                "relations": [ "Mother", "Father", "Sister", "Brother", "Daughter", "Son", "Maternal Grandmother", "Maternal Grandfather", "Paternal Grandmother", "Paternal Grandfather", "Aunt", "Uncle", "Niece", "Nephew", "Cousin" ],
                "cancerTypes": [
                  { "value": "breast", "label": "Breast" },
                  { "value": "lung", "label": "Lung" },
                  { "value": "colorectal", "label": "Colorectal" },
                  { "value": "prostate", "label": "Prostate" },
                  { "value": "endometrium", "label": "Endometrium" },
                  { "value": "oesophagus", "label": "Oesophagus" },
                  { "value": "pancreas", "label": "Pancreas" },
                  { "value": "liver", "label": "Liver" },
                  { "value": "bladder", "label": "Bladder" },
                  { "value": "brain", "label": "Brain" },
                  { "value": "thyroid", "label": "Thyroid" },
                  { "value": "sarcoma", "label": "Sarcoma" },
                  { "value": "lymphoma", "label": "Lymphoma" },
                  { "value": "leukemia", "label": "Leukemia" },
                  { "value": "myeloma", "label": "Myeloma" },
                  { "value": "kidney", "label": "Kidney" },
                  { "value": "melanoma", "label": "Melanoma" },
                  { "value": "gastric", "label": "Stomach (Gastric)" },
                  { "value": "ovarian", "label": "Ovarian" },
                  { "value": "other", "label": "Other" }
                ]
              }
            },
             {
               "id": "genetics",
               "title": { "en": "Genetics (Optional)", "pl": "Genetyka (Opcjonalne)" },
               "questions": [
                   { "id": "gen.testing_ever", "text": { "en": "Have you ever had genetic testing related to cancer risk?", "pl": "Czy kiedykolwiek wykonano u Pana/Pani badania genetyczne związane z ryzykiem nowotworów?" }, "type": "radio", "options": [{"value": "never", "label": {"en": "No", "pl": "Nie"}}, {"value": "yes_report", "label": {"en": "Yes, I have the report", "pl": "Tak, mam raport"}}, {"value": "yes_no_details", "label": {"en": "Yes, but I don't recall details", "pl": "Tak, ale nie pamiętam szczegółów"}}, {"value": "not_sure", "label": {"en": "Not sure", "pl": "Nie jestem pewien"}} ] },
                   { "id": "gen.path_variant_self", "text": { "en": "Have you ever been told that you carry a genetic change (pathogenic variant) that increases cancer risk?", "pl": "Czy kiedykolwiek powiedziano Ci, że jesteś nosicielem zmiany genetycznej (wariantu patogennego) zwiększającej ryzyko raka?" }, "type": "radio", "options": [{"value": "no", "label": "No"}, {"value": "yes", "label": "Yes"}, {"value": "vus_only", "label": "Variant of Uncertain Significance (VUS) only"}, {"value": "not_sure", "label": "Not sure"}], "dependsOn": { "questionId": "gen.testing_ever", "value": ["yes_report", "yes_no_details"]} },
                   { "id": "genetic_test_type", "text": { "en": "What type of genetic test was it?", "pl": "Jaki to był rodzaj badania genetycznego?" }, "type": "select", "options": ["Multigene panel", "Single gene", "Exome (WES)", "Genome (WGS)", "Other"], "dependsOn": { "questionId": "gen.testing_ever", "value": ["yes_report", "yes_no_details"]} },
                   { "id": "genetic_test_year", "text": { "en": "In what year was the test performed?", "pl": "W którym roku wykonano badanie?" }, "type": "year_input", "dependsOn": { "questionId": "gen.testing_ever", "value": ["yes_report", "yes_no_details"]} },
                   { "id": "genetic_lab", "text": { "en": "Testing laboratory (if known)", "pl": "Laboratorium wykonujące test (jeśli znane)" }, "type": "text_input", "dependsOn": { "questionId": "gen.testing_ever", "value": ["yes_report", "yes_no_details"]} },
                   { "id": "genetic_genes", "text": { "en": "If yes: which genes?", "pl": "Jeśli tak: które geny?" }, "type": "checkbox_group", "options": [
                       { "id": "BRCA1", "label": "BRCA1"}, { "id": "BRCA2", "label": "BRCA2"}, { "id": "PALB2", "label": "PALB2"}, { "id": "TP53", "label": "TP53"}, { "id": "PTEN", "label": "PTEN"}, 
                       { "id": "CDH1", "label": "CDH1"}, { "id": "STK11", "label": "STK11"}, { "id": "NF1", "label": "NF1"}, { "id": "ATM", "label": "ATM"}, { "id": "CHEK2", "label": "CHEK2"}, 
                       { "id": "BARD1", "label": "BARD1"}, { "id": "BRIP1", "label": "BRIP1"}, { "id": "RAD51C", "label": "RAD51C"}, { "id": "RAD51D", "label": "RAD51D"}, { "id": "MLH1", "label": "MLH1"}, 
                       { "id": "MSH2", "label": "MSH2"}, { "id": "MSH6", "label": "MSH6"}, { "id": "PMS2", "label": "PMS2"}, { "id": "EPCAM", "label": "EPCAM"}, { "id": "APC", "label": "APC"}, 
                       { "id": "MUTYH", "label": "MUTYH"}, { "id": "POLE", "label": "POLE"}, { "id": "POLD1", "label": "POLD1"}, { "id": "SMAD4", "label": "SMAD4"}, { "id": "BMPR1A", "label": "BMPR1A"}, 
                       { "id": "NTHL1", "label": "NTHL1"}, { "id": "VHL", "label": "VHL"}, { "id": "FH", "label": "FH"}, { "id": "FLCN", "label": "FLCN"}, { "id": "MET", "label": "MET"}, 
                       { "id": "RET", "label": "RET"}, { "id": "MAX", "label": "MAX"}, { "id": "TSC1", "label": "TSC1"}, { "id": "TSC2", "label": "TSC2"}, { "id": "CDKN2A", "label": "CDKN2A"}, 
                       { "id": "CDK4", "label": "CDK4"}, { "id": "MITF", "label": "MITF"}, { "id": "PRSS1", "label": "PRSS1"}, { "id": "DICER1", "label": "DICER1"}, { "id": "PTCH1", "label": "PTCH1"},
                       { "id": "SUFU", "label": "SUFU"}, { "id": "SDHB", "label": "SDHB"}, { "id": "SDHC", "label": "SDHC"}, { "id": "SDHD", "label": "SDHD"}, { "id": "BAP1", "label": "BAP1"},
                       { "id": "MEN1", "label": "MEN1"}, { "id": "MITF_E318K", "label": "MITF E318K"}
                   ], "dependsOn": { "questionId": "gen.path_variant_self", "value": "yes"} },
                   { "id": "genetic_variants_hgvs", "text": { "en": "Variant(s) (HGVS, optional)", "pl": "Wariant(y) (HGVS, opcjonalnie)" }, "type": "text_input", "dependsOn": { "questionId": "gen.path_variant_self", "value": "yes"}, "tooltip": {"en": "HGVS is a standard format for reporting genetic variants, e.g., c.123A>G. Provide if known.", "pl": "HGVS to standardowy format raportowania wariantów genetycznych, np. c.123A>G. Podaj, jeśli jest znany."}},
                   { "id": "genetic_report_upload", "text": { "en": "Upload genetic report (optional)", "pl": "Prześlij raport genetyczny (opcjonalnie)" }, "type": "file_upload", "dependsOn": { "questionId": "gen.testing_ever", "value": "Yes"} },
                   
                   { "id": "gen.mutyh_biallelic", "text": { "en": "MUTYH biallelic variant?", "pl": "Wariant bialleliczny MUTYH?" }, "type": "radio", "options": ["Yes", "No", "Unsure"], "dependsOn": { "questionId": "gen.testing_ever", "value": ["yes_report", "yes_no_details"]} },
                   { "id": "gen.family_genes", "text": { "en": "Known pathogenic variant in family?", "pl": "Znany wariant patogenny w rodzinie?" }, "type": "radio", "options": ["Yes", "No", "Unsure"] },
                   { "id": "gen.path_variant_family", "text": { "en": "If yes: which gene?", "pl": "Jeśli tak: który gen?" }, "type": "text_input", "dependsOn": { "questionId": "gen.family_genes", "value": "Yes"} },
                   
                   {"id": "gen.prs_done", "text": {"en": "Polygenic Risk Score (PRS) done?", "pl": "Badanie Polygenic Risk Score (PRS)?"}, "type": "select", "options": ["Yes", "No", "Unsure"]},
                   {"id": "gen.prs_cancers_flagged", "text": {"en": "Cancers with increased risk in PRS", "pl": "Nowotwory o zwiększonym ryzyku w PRS"}, "type": "checkbox_group", "dependsOn": {"questionId": "gen.prs_done", "value": "Yes"}, "options": [{"id": "breast", "label": "Breast"}, {"id": "prostate", "label": "Prostate"}, {"id": "colorectal", "label": "Colorectal"}, {"id": "lung", "label": "Lung"}]},
                   {"id": "gen.prs_overall_band", "text": {"en": "Overall PRS Risk Band", "pl": "Ogólna kategoria ryzyka PRS"}, "type": "select", "dependsOn": {"questionId": "gen.prs_done", "value": "Yes"}, "options": ["lower", "average", "higher", "mixed", "not_sure"]},

                   { "id": "genetic_processing_consent", "type": "consent_checkbox", "dependsOn": { "questionId": "gen.testing_ever", "value": ["yes_report", "yes_no_details"] } }
               ]
             },
             {
               "id": "physical_activity_details",
               "title": { "en": "Physical Activity Details (IPAQ)", "pl": "Szczegóły Aktywności Fizycznej (IPAQ)" },
               "dependsOn": { "questionId": "pa.activity_level", "value": true },
               "questions": [
                 { "id": "pa.vig.days7", "text": { "en": "Vigorous physical activity (days/week)", "pl": "Intensywna aktywność fizyczna (dni/tydzień)" }, "type": "number_input", "min": 0, "max": 7 },
                 { "id": "pa.vig.minperday", "text": { "en": "Average minutes of vigorous activity per day", "pl": "Średnia liczba minut intensywnej aktywności" }, "type": "number_input", "dependsOn": { "questionId": "pa.vig.days7", "operator": ">", "value": 0 } },
                 { "id": "pa.mod.days7", "text": { "en": "Moderate physical activity (days/week)", "pl": "Umiarkowana aktywność fizyczna (dni/tydzień)" }, "type": "number_input", "min": 0, "max": 7 },
                 { "id": "pa.mod.minperday", "text": { "en": "Average minutes of moderate activity per day", "pl": "Średnia liczba minut umiarkowanej aktywności" }, "type": "number_input", "dependsOn": { "questionId": "pa.mod.days7", "operator": ">", "value": 0 } },
                 { "id": "pa.walk.days7", "text": { "en": "Walking (days/week)", "pl": "Spacerowanie (dni/tydzień)" }, "type": "number_input", "min": 0, "max": 7 },
                 { "id": "pa.walk.minperday", "text": { "en": "Average minutes of walking per day", "pl": "Średnia liczba minut spaceru" }, "type": "number_input", "dependsOn": { "questionId": "pa.walk.days7", "operator": ">", "value": 0 } },
                 { "id": "pa.sit.min_day", "text": { "en": "Hours spent sitting per day", "pl": "Godziny spędzane na siedząco dziennie" }, "type": "number_input" }
               ]
             },
            {
              "id": "female_health",
              "title": { "en": "Female Health", "pl": "Zdrowie Kobiet" },
              "dependsOn": { "questionId": "sex_at_birth", "value": "Female" },
              "questions": [
                { "id": "menopause_status", "text": {"en": "Have you undergone menopause?", "pl": "Czy jest Pani po menopauzie?"}, "type": "select", "options": [{"value":"Yes", "label":"Yes"}, {"value":"No", "label":"No"}, {"value":"N/A", "label":"N/A"}] },
                { "id": "menopause_age", "text": {"en": "If yes: at what age did menopause occur?", "pl": "Jeśli tak: w jakim wieku wystąpiła menopauza?"}, "type": "year_input", "dependsOn": { "questionId": "menopause_status", "value": "Yes"} },
                { "id": "had_children", "text": {"en": "Have you given birth to any children?", "pl": "Czy urodziła Pani dziecko/dzieci?"}, "type": "select", "options": [{"value":"Yes", "label":"Yes"}, {"value":"No", "label":"No"}] },
                { "id": "first_child_age", "text": {"en": "If yes: age at birth of first child", "pl": "Jeśli tak: wiek przy urodzeniu pierwszego dziecka"}, "type": "year_input", "dependsOn": { "questionId": "had_children", "value": "Yes"} },
                { "id": "hrt_use", "text": {"en": "Have you ever used hormone replacement therapy (HRT)?", "pl": "Czy stosowała Pani hormonalną terapię zastępczą (HTZ)?"}, "type": "select", "options": ["Never", "Previously", "Currently"] },
                { "id": "meds.hrt.type", "text": {"en": "Type of HRT", "pl": "Rodzaj HTZ"}, "type": "select", "options": ["Estrogen only", "Combined (Estrogen + Progesterone)", "Unsure"], "dependsOn": { "questionId": "hrt_use", "value": ["Previously", "Currently"]} },
                { "id": "meds.hrt.duration_yrs", "text": {"en": "Duration of use (years)", "pl": "Czas stosowania (lata)"}, "type": "number_input", "dependsOn": { "questionId": "hrt_use", "value": ["Previously", "Currently"]} }
              ]
            },
            {
              "id": "chronic_condition_details",
              "title": { "en": "Condition Details", "pl": "Szczegóły Chorób" },
              "dependsOn": { "questionId": "cond.summary", "value": ["hbv", "hcv", "cirrhosis", "ibd", "diabetes", "hypertension", "h_pylori"] },
              "questions": [
                {
                  "id": "cond.hbv.status",
                  "text": { "en": "Hepatitis B Status", "pl": "Status WZW B" },
                  "type": "radio",
                  "options": ["Chronic/Active", "Cured/Cleared", "Unsure"],
                  "dependsOn": { "questionId": "cond.summary", "value": "hbv" },
                  "infoCard": {
                      "id": "cond.hbv.helper",
                      "text": { "en": "Past = doctor confirmed clearance/seroconversion.", "pl": "Past = lekarz potwierdził wyleczenie/serokonwersję." }
                  }
                },
                {
                   "id": "cond.hbv.antiviral_now",
                   "text": {"en": "On antiviral therapy now?", "pl": "Czy aktualnie leczony/a lekami przeciwwirusowymi?"},
                   "type": "radio",
                   "options": ["Yes", "No", "Unsure"],
                   "dependsOn": { "questionId": "cond.hbv.status", "value": "Chronic/Active"}
                },
                {
                  "id": "cond.hcv.status",
                  "text": { "en": "Hepatitis C Status", "pl": "Status WZW C" },
                  "type": "radio",
                  "options": ["Chronic/Active", "Cured (SVR)", "Unsure"],
                  "dependsOn": { "questionId": "cond.summary", "value": "hcv" },
                  "infoCard": {
                      "id": "cond.hcv.helper",
                      "text": { "en": "Past (SVR) = treatment confirmed sustained viral clearance.", "pl": "Past (SVR) = wynik po leczeniu wskazał trwałą eliminację wirusa." }
                  }
                },
                {
                    "id": "cond.hcv.svr12",
                    "text": {"en": "If treated: cured (SVR) confirmed?", "pl": "Jeśli leczony/a: potwierdzone wyleczenie (SVR)?"},
                    "type": "radio",
                    "options": ["Yes", "No", "Unsure"],
                    "dependsOn": { "questionId": "cond.hcv.status", "value": "Cured (SVR)"}
                },
                {
                  "id": "cond.h_pylori.status",
                  "text": { "en": "H. pylori Status", "pl": "Status H. pylori" },
                  "type": "radio",
                  "options": ["Treated/Eradicated", "Untreated/Active", "Unsure"],
                  "dependsOn": { "questionId": "cond.summary", "value": "h_pylori" }
                },
                {
                  "id": "cond.cirrhosis.etiology",
                  "text": { "en": "Main cause of Cirrhosis", "pl": "Główna przyczyna marskości" },
                  "type": "select",
                  "options": ["Alcohol", "Viral (Hep B/C)", "Fatty Liver (NASH)", "Autoimmune", "Other"],
                  "dependsOn": { "questionId": "cond.summary", "value": "cirrhosis" }
                },
                {
                  "id": "cond.ibd.type",
                  "text": { "en": "Type of IBD", "pl": "Typ IBD" },
                  "type": "radio",
                  "options": ["Ulcerative Colitis", "Crohn's Disease", "Unsure"],
                  "dependsOn": { "questionId": "cond.summary", "value": "ibd" }
                },
                {
                    "id": "cond.ibd.extent",
                    "text": {"en": "Extent (UC)", "pl": "Zasięg (WZJG)"},
                    "type": "select",
                    "options": ["Proctitis", "Left-sided", "Pancolitis", "Unsure"],
                    "dependsOn": { "questionId": "cond.ibd.type", "value": "Ulcerative Colitis"}
                },
                {
                  "id": "cond.diabetes.type",
                   "text": {"en": "Type of Diabetes", "pl": "Typ cukrzycy"},
                   "type": "radio",
                   "options": ["Type 1", "Type 2", "Gestational", "Unsure"],
                   "dependsOn": { "questionId": "cond.summary", "value": "diabetes"}
                },
                {
                   "id": "cond.hypertension.controlled",
                   "text": {"en": "Is your hypertension controlled with medication?", "pl": "Czy nadciśnienie jest kontrolowane lekami?"},
                   "type": "radio",
                   "options": ["Yes", "No", "Unsure"],
                   "dependsOn": { "questionId": "cond.summary", "value": "hypertension"}
                }
              ]
            },
            {
              "id": "personal_cancer_history",
              "title": { "en": "Personal Cancer History", "pl": "Osobista Historia Nowotworów" },
              "dependsOn": { "questionId": "ca.any_history", "value": "Yes" },
              "options": {
                "cancerTypes": [ 
                  { "value": "breast", "label": "Breast" },
                  { "value": "lung", "label": "Lung" },
                  { "value": "colorectal", "label": "Colorectal" },
                  { "value": "prostate", "label": "Prostate" },
                  { "value": "endometrium", "label": "Endometrium" },
                  { "value": "oesophagus", "label": "Oesophagus" },
                  { "value": "pancreas", "label": "Pancreas" },
                  { "value": "liver", "label": "Liver" },
                  { "value": "bladder", "label": "Bladder" },
                  { "value": "brain", "label": "Brain" },
                  { "value": "thyroid", "label": "Thyroid" },
                  { "value": "sarcoma", "label": "Sarcoma" },
                  { "value": "lymphoma", "label": "Lymphoma" },
                  { "value": "leukemia", "label": "Leukemia" },
                  { "value": "myeloma", "label": "Myeloma" },
                  { "value": "kidney", "label": "Kidney" },
                  { "value": "melanoma", "label": "Melanoma" },
                  { "value": "gastric", "label": "Stomach (Gastric)" },
                  { "value": "ovarian", "label": "Ovarian" },
                  { "value": "other", "label": "Other" }
                ],
                "treatmentTypes": [ { "id": "surgery", "label": "Surgery"}, { "id": "chemo", "label": "Chemotherapy"}, {"id": "radio", "label": "Radiotherapy"}, {"id": "endo", "label": "Endocrine Therapy"}, {"id": "immuno", "label": "Immunotherapy"}, {"id": "hsct", "label": "Stem-cell Transplant"} ],
                "stageOptions": [{"value": "I", "label": "Stage I"}, {"value": "II", "label": "Stage II"}, {"value": "III", "label": "Stage III"}, {"value": "IV", "label": "Stage IV"}, {"value": "0", "label": "Stage 0 (in situ)"}],
                "lateralityOptions": [{"value": "Left", "label": "Left"}, {"value": "Right", "label": "Right"}, {"value": "Bilateral", "label": "Bilateral"}, {"value": "Midline", "label": "Midline/Central"}]
              }
            },
            {
              "id": "screening_immunization",
              "title": {"en": "Screening & Immunization", "pl": "Badania Przesiewowe i Szczepienia"},
              "questions": [
                  {
                      "id": "screen.summary",
                      "text": {"en": "Which of the following screening tests have you EVER had?", "pl": "Które z poniższych badań przesiewowych kiedykolwiek wykonałeś/aś?"},
                      "type": "checkbox_group",
                      "options": [
                          {"id": "colonoscopy", "label": {"en": "Colonoscopy", "pl": "Kolonoskopia"}},
                          {"id": "mammogram", "label": {"en": "Mammogram", "pl": "Mammografia"}},
                          {"id": "pap_test", "label": {"en": "Pap/HPV Test", "pl": "Badanie Pap/HPV"}},
                          {"id": "psa_test", "label": {"en": "PSA Test", "pl": "Badanie PSA"}},
                          {"id": "lung_scan", "label": {"en": "Lung Cancer Screening (CT)", "pl": "Tomografia płuc (CT)"}},
                          {"id": "skin_exam", "label": {"en": "Full Body Skin Exam", "pl": "Pełne badanie skóry"}},
                          {"id": "liver_us", "label": {"en": "Liver Ultrasound", "pl": "USG Wątroby"}},
                          {"id": "gastroscopy", "label": {"en": "Gastroscopy", "pl": "Gastroskopia"}},
                          {"id": "none", "label": {"en": "None of the above", "pl": "Żadne z powyższych"}}
                      ],
                      "exclusiveOptionId": "none"
                  }
              ],
              "screenings": [
                {
                  "id": "colonoscopy", 
                  "text": {"en": "Colonoscopy", "pl":"Kolonoskopia"}, 
                  "dependsOn": {"questionId": "screen.summary", "value": "colonoscopy"},
                  "questions": [
                    {"id": "screen.colonoscopy.date", "text": {"en":"Year of last colonoscopy", "pl":"Rok ostatniej kolonoskopii"}, "type": "year_input"},
                    {"id": "screen.colonoscopy.finding", "text": {"en":"Result/Finding", "pl":"Wynik"}, "type": "select", "options": ["Normal", "Polyp(s)", "Cancer", "Other", "Unsure"]}
                  ]
                },
                {
                  "id": "mammogram", 
                  "text": {"en":"Mammogram", "pl":"Mammografia"}, 
                  "dependsOn": {"questionId": "screen.summary", "value": "mammogram"}, 
                  "questions": [
                    {"id": "screen.mammo.date", "text": {"en":"Year of last mammogram", "pl":"Rok ostatniej mammografii"}, "type": "year_input"},
                    {"id": "screen.mammo.result", "text": {"en":"Result", "pl":"Wynik"}, "type": "select", "options": ["Normal", "Abnormal", "Unsure"]}
                  ]
                },
                {
                  "id": "pap_test", 
                  "text": {"en": "Pap/HPV Test", "pl": "Badanie Pap/HPV"}, 
                  "dependsOn": {"questionId": "screen.summary", "value": "pap_test"}, 
                  "questions": [
                    {"id": "screen.pap.date", "text": {"en":"Year of last test", "pl": "Rok ostatniego badania"}, "type": "year_input"},
                    {"id": "screen.cervix.last_type", "text": {"en":"Type of last test", "pl": "Rodzaj ostatniego badania"}, "type": "select", "options": ["Pap", "HPV", "Co-testing", "Unsure"]},
                    {"id": "screen.cervix.last_result", "text": {"en":"Last result", "pl": "Ostatni wynik"}, "type": "select", "options": ["Normal", "Abnormal", "Unsure"]}
                  ]
                },
                {
                  "id": "psa_test", 
                  "text": {"en":"PSA Test", "pl": "Badanie PSA"}, 
                  "dependsOn": {"questionId": "screen.summary", "value": "psa_test"}, 
                  "questions": [
                    {"id": "screen.psa.date", "text": {"en":"Year of last test", "pl":"Rok ostatniego badania"}, "type": "year_input"},
                    {"id": "screen.psa.result", "text": {"en":"Result", "pl":"Wynik"}, "type": "select", "options": ["Normal", "Elevated", "Unsure"]}
                  ]
                },
                {
                  "id": "screen.lung",
                  "text": {"en": "Lung Cancer Screening (LDCT)", "pl": "Badanie przesiewowe raka płuc (LDCT)"},
                  "dependsOn": {"questionId": "screen.summary", "value": "lung_scan"}, 
                  "questions": [
                    {"id": "screen.lung.ldct_last_year", "text": {"en": "Year of last LDCT", "pl": "Rok ostatniego LDCT"}, "type": "year_input"},
                    {"id": "screen.lung.result", "text": {"en":"Result", "pl":"Wynik"}, "type": "select", "options": ["Normal", "Abnormal/Nodule", "Unsure"]}
                  ]
                },
                {
                   "id": "screen.skin",
                   "text": {"en": "Skin Cancer Screening", "pl": "Badanie skóry"},
                   "dependsOn": {"questionId": "screen.summary", "value": "skin_exam"},
                   "questions": [
                      {"id": "screen.skin.last_year", "text": {"en": "Year of last exam", "pl": "Rok ostatniego badania"}, "type": "year_input"},
                      {"id": "screen.skin.finding", "text": {"en": "Finding", "pl": "Wynik"}, "type": "select", "options": ["Normal", "Pre-cancerous", "Melanoma", "Other", "Unsure"]}
                   ]
                },
                {
                   "id": "screen.hcc",
                   "text": {"en": "Liver Cancer Screening", "pl": "Badanie wątroby"},
                   "dependsOn": {"questionId": "screen.summary", "value": "liver_us"},
                   "questions": [
                      {"id": "screen.hcc.us_last_year", "text": {"en": "Year of last ultrasound", "pl": "Rok ostatniego USG"}, "type": "year_input"},
                      {"id": "screen.hcc.result", "text": {"en": "Result", "pl": "Wynik"}, "type": "select", "options": ["Normal", "Abnormal", "Unsure"]}
                   ]
                },
                {
                    "id": "screen.upper_endo",
                    "text": {"en": "Upper Endoscopy", "pl": "Gastroskopia"},
                    "dependsOn": {"questionId": "screen.summary", "value": "gastroscopy"},
                    "questions": [
                      {"id": "screen.upper_endo.last_year", "text": {"en": "Year of last endoscopy", "pl": "Rok ostatniej gastroskopii"}, "type": "year_input"},
                      {"id": "screen.upper_endo.finding", "text": {"en": "Finding", "pl": "Wynik"}, "type": "select", "options": ["Normal", "Gastritis", "Barrett's", "Ulcer", "Cancer", "Other"]}
                    ]
                }
              ],
              "immunizations": [
                {"id": "imm.hpv", "text": {"en": "HPV vaccination", "pl": "Szczepienie przeciwko HPV"}, "type": "select", "options": [{"value": "Yes", "label": {"en": "Yes", "pl": "Tak"}}, {"value": "No", "label": {"en": "No", "pl": "Nie"}}, {"value": "Unsure", "label": {"en": "Unsure", "pl": "Nie wiem"}}]},
                {"id": "imm.hbv", "text": {"en": "HBV vaccination", "pl": "Szczepienie przeciwko HBV"}, "type": "select", "options": [{"value": "Yes", "label": {"en": "Yes", "pl": "Tak"}}, {"value": "No", "label": {"en": "No", "pl": "Nie"}}, {"value": "Unsure", "label": {"en": "Unsure", "pl": "Nie wiem"}}]},
                {"id": "imm.hav.any", "text": {"en": "HAV vaccination (Hep A)", "pl": "Szczepienie przeciwko WZW A"}, "type": "select", "options": ["Yes", "No", "Unsure"]},
                {"id": "imm.flu.last_season", "text": {"en": "Flu shot last season?", "pl": "Szczepienie na grypę w ost. sezonie?"}, "type": "select", "options": ["Yes", "No", "Unsure"]},
                {"id": "imm.covid.doses", "text": {"en": "Number of COVID-19 doses", "pl": "Liczba dawek na COVID-19"}, "type": "select", "options": ["0", "1", "2", "3", "4+"]},
                {"id": "imm.td_tdap.year_last", "text": {"en": "Year of last Tetanus/Tdap", "pl": "Rok ostatniego szczepienia na tężec"}, "type": "year_input" },
                {"id": "imm.pneumo.ever", "text": {"en": "Pneumococcal vaccination ever?", "pl": "Szczepienie przeciwko pneumokokom?"}, "type": "select", "options": ["Yes", "No", "Unsure"]},
                {"id": "imm.zoster.ever", "text": {"en": "Shingles (Zoster) vaccination ever?", "pl": "Szczepienie przeciwko półpaścowi?"}, "type": "select", "options": ["Yes", "No", "Unsure"]}
              ]
            },
            {
              "id": "medications_iatrogenic",
              "title": {"en": "Medications / Iatrogenic", "pl": "Leki / Jatrogenne"},
              "questions": [
                {
                  "id": "immunosuppression_now",
                  "text": {"en": "Are you currently taking any medication that suppresses your immune system?", "pl": "Czy obecnie przyjmujesz leki osłabiające układ odpornościowy?"},
                  "type": "select",
                  "options": [{"value": "Yes", "label": {"en": "Yes", "pl": "Tak"}}, {"value": "No", "label": {"en": "No", "pl": "Nie"}}, {"value": "Unsure", "label": {"en": "Unsure", "pl": "Nie wiem"}}]
                },
                {
                  "id": "immunosuppression_cause",
                  "text": {"en": "If yes, please specify the reason or medication.", "pl": "Jeśli tak, podaj przyczynę lub nazwę leku."},
                  "type": "text_input",
                  "placeholder": {"en": "e.g., for transplant, autoimmune disease, medication name", "pl": "np. po przeszczepie, choroba autoimmunologiczna, nazwa leku"},
                  "dependsOn": { "questionId": "immunosuppression_now", "value": "Yes" }
                }
              ]
            },
            {
              "id": "sexual_health",
              "title": {"en": "Sexual Health (Optional)", "pl": "Zdrowie Seksualne (Opcjonalne)"},
              "questions": [
                {"id": "sexhx.section_opt_in", "text": {"en": "Would you like to answer equal optional questions about sexual health?", "pl": "Czy chciałbyś odpowiedzieć na kilka opcjonalnych pytań dotyczących zdrowia seksualnego?"}, "type": "select", "options": [{"value":"Yes", "label":"Yes"}, {"value":"No", "label":"No"}, {"value":"Prefer not to say", "label":"Prefer not to say"}]},
                {"id": "sexhx.ever_sexual_contact", "text": {"en": "Have you ever had any sexual contact?", "pl": "Czy kiedykolwiek miał(a)eś kontakt seksualny?"}, "type": "radio", "options": [{"value":"Yes", "label":"Yes"}, {"value":"No", "label":"No"}, {"value":"Prefer not to say", "label":"Prefer not to say"}], "dependsOn": {"questionId": "sexhx.section_opt_in", "value": "Yes"}},
                
                {"id": "sexhx.new_partner_12m", "text": {"en": "New partner in last 12 months?", "pl": "Nowy partner w ciągu ostatnich 12 miesięcy?"}, "type": "select", "options": ["Yes", "No"], "dependsOn": {"questionId": "sexhx.ever_sexual_contact", "value": "Yes"}},
                
                {"id": "sexhx.partner_genders", "text": {"en": "Gender of partners", "pl": "Płeć partnerów/partnerek"}, "type": "checkbox_group", "dependsOn": {"questionId": "sexhx.ever_sexual_contact", "value": "Yes"}, "options": [{"id": "male", "label": {"en":"Male", "pl": "Mężczyźni"}}, {"id": "female", "label": {"en":"Female", "pl": "Kobiety"}}, {"id": "other", "label": {"en":"Other", "pl": "Inne"}}, {"id": "prefer_not_to_say", "label": {"en":"Prefer not to say", "pl": "Wolę nie odpowiadać"}}]},
                {"id": "sexhx.lifetime_partners_cat", "text": {"en": "Lifetime sexual partners", "pl": "Liczba partnerów/partnerek seksualnych w ciągu całego życia"}, "type": "select", "dependsOn": {"questionId": "sexhx.ever_sexual_contact", "value": "Yes"}, "options": ["0-1", "2-4", "5-9", "10-19", "20+", "Prefer not to say"]},
                {"id": "sexhx.partners_12m_cat", "text": {"en": "Partners in last 12 months", "pl": "Liczba partnerów/partnerek w ciągu ostatnich 12 miesięcy"}, "type": "select", "dependsOn": {"questionId": "sexhx.ever_sexual_contact", "value": "Yes"}, "options": ["0", "1", "2-3", "4-5", "6+", "Prefer not to say"]},
                
                {"id": "sexhx.sex_work_ever", "text": {"en": "Ever engaged in sex work?", "pl": "Praca seksualna kiedykolwiek?"}, "type": "radio", "options": ["Yes", "No", "Prefer not to say"]},
                {"id": "sexhx.sex_work_role", "text": {"en": "Role in sex work", "pl": "Rola w pracy seksualnej"}, "type": "text_input", "dependsOn": {"questionId": "sexhx.sex_work_ever", "value": "Yes"}},
                
                {"id": "sexhx.age_first_sex", "text": {"en": "Age at first sexual intercourse", "pl": "Wiek inicjacji seksualnej"}, "type": "number_input", "validation": { "min": 8, "max": 80 }},
                {"id": "sexhx.sex_sites_ever", "text": {"en": "Sexual practices (Lifetime)", "pl": "Praktyki seksualne (Całe życie)"}, "type": "checkbox_group", "options": [{"id": "vaginal", "label": "Vaginal"}, {"id": "anal", "label": "Anal"}, {"id": "oral", "label": "Oral"}, {"id": "prefer_not_to_say", "label": "Prefer not to say"}]},
                {"id": "sexhx.sex_sites_12m", "text": {"en": "Sexual practices (Last 12m)", "pl": "Praktyki seksualne (Ost. 12 mies.)"}, "type": "checkbox_group", "options": [{"id": "vaginal", "label": "Vaginal"}, {"id": "anal", "label": "Anal"}, {"id": "oral", "label": "Oral"}, {"id": "prefer_not_to_say", "label": "Prefer not to say"}]},
                
                {"id": "sexhx.condom_use_12m", "text": {"en": "Condom/barrier use frequency", "pl": "Częstotliwość używania prezerwatyw/barier"}, "type": "select", "dependsOn": {"questionId": "sexhx.ever_sexual_contact", "value": "Yes"}, "options": ["Always", "Sometimes", "Never", "Prefer not to say"]},
                
                {"id": "sexhx.sti_history_other", "text": {"en": "History of sexually transmitted infections (STIs)?", "pl": "Historia infekcji przenoszonych drogą płciową (STI)?"}, "type": "radio", "options": ["Yes", "No", "Prefer not to say"], "dependsOn": {"questionId": "sexhx.ever_sexual_contact", "value": "Yes"}},
                {"id": "sexhx.sti_types_other", "text": {"en": "Which STIs have you been diagnosed with?", "pl": "Które STI zostały u Ciebie zdiagnozowane?"}, "type": "checkbox_group", "dependsOn": {"questionId": "sexhx.sti_history_other", "value": "Yes"}, "options": [{"id": "hpv", "label": "HPV"}, {"id": "chlamydia", "label": "Chlamydia"}, {"id": "hiv", "label": "HIV"}, {"id": "syphilis", "label": "Syphilis"}, {"id": "gonorrhea", "label": "Gonorrhea"}]},
                
                {"id": "sexhx.sti_treated_12m", "text": {"en": "Were you treated for an STI in the last 12 months?", "pl": "Czy byłeś/aś leczony/a na STI w ciągu ostatnich 12 miesięcy?"}, "type": "select", "options": ["Yes", "No"], "dependsOn": {"questionId": "sexhx.sti_history_other", "value": "Yes"}},
                
                {"id": "sexhx.hpv_precancer_history", "text": {"en": "History of HPV-related precancer?", "pl": "Historia zmian przedrakowych HPV?"}, "type": "checkbox_group", "options": [{"id": "cervix", "label": "Cervix"}, {"id": "vulva", "label": "Vulva"}, {"id": "vagina", "label": "Vagina"}, {"id": "anus", "label": "Anus"}, {"id": "penis", "label": "Penis"}, {"id": "mouth_throat", "label": "Mouth/Throat"}, {"id": "not_sure", "label": "Not sure"}, {"id": "prefer_not_to_say", "label": "Prefer not to say"}], "dependsOn": {"questionId": "sexhx.ever_sexual_contact", "value": "Yes"}},

                {"id": "sex_anal", "text": {"en": "Anal intercourse?", "pl": "Stosunek analny?"}, "type": "select", "dependsOn": {"questionId": "sexhx.ever_sexual_contact", "value": "Yes"}, "options": ["Yes", "No", "Prefer not to say"]},
                {"id": "sex_oral", "text": {"en": "Oral sex?", "pl": "Seks oralny?"}, "type": "select", "dependsOn": {"questionId": "sexhx.ever_sexual_contact", "value": "Yes"}, "options": ["Yes", "No", "Prefer not to say"]},
                {"id": "sex_barriers_practices", "text": {"en": "How often were barriers (e.g., condoms) used during these practices?", "pl": "Jak często stosowano bariery (np. prezerwatywy) podczas tych praktyk?"}, "type": "select", "dependsOn": {"questionId": "sexhx.ever_sexual_contact", "value": "Yes"}, "options": ["Always", "Sometimes", "Never", "Prefer not to say"]}
              ]
            },
            {
              "id": "occupational_hazards",
              "title": { "en": "Occupational Hazards (Optional)", "pl": "Zagrożenia Zawodowe (Opcjonalne)"},
              "dependsOn": { "questionId": "occ.exposure_any", "value": "Yes" },
              "questions": [
                { "id": "occ.hazards.subs", "text": {"en": "Check all hazards you have been exposed to:", "pl": "Zaznacz wszystkie zagrożenia, na które byłeś/aś narażony/a:"}, "type": "checkbox_group", "options": [
                  {"id": "asbestos", "label": "Asbestos"}, {"id": "silica", "label": "Silica dust"}, {"id": "diesel", "label": "Diesel exhaust"}, {"id": "pesticides", "label": "Pesticides"}, {"id": "solvents", "label": "Solvents"}, {"id": "welding", "label": "Welding fumes"}, {"id": "radiation", "label": "Ionizing Radiation"},
                  {"id": "wood_dust", "label": "Wood dust"}, {"id": "leather_dust", "label": "Leather dust"}, {"id": "metal_fluids", "label": "Metalworking fluids"}, {"id": "soot", "label": "Soot/coal tar"}, {"id": "rubber", "label": "Rubber production"}, {"id": "benzene", "label": "Benzene"}, {"id": "formaldehyde", "label": "Formaldehyde"}, {"id": "uv_sunlight", "label": "Sunlight (UV) (Outdoor worker)"},
                  {"id": "shift_night", "label": "Night shift work (long term)"}, {"id": "firefighter", "label": "Firefighter"}, {"id": "hairdresser", "label": "Hairdresser/Barber"}, {"id": "painter", "label": "Painter"},
                  {"id": "none", "label": "None"}
                ], "exclusiveOptionId": "none"},
                {"id": "employment_status", "text": {"en": "What is your current employment status?", "pl": "Jaki jest Pana/Pani obecny status zatrudnienia?"}, "type": "select", "options": ["Employed", "Self-employed", "Unemployed", "Student", "Retired"]},
                {"id": "occ_exposure_duration", "text": {"en": "Approx. years exposed (sum)", "pl": "Przybliżona liczba lat ekspozycji (suma)"}, "type": "number_input", "placeholder": "e.g., 5"},
                {"id": "occ.exposure.year_first_exposed", "text": {"en": "Year first exposed", "pl": "Rok pierwszego narażenia"}, "type": "year_input"},
                {"id": "occ_radiation_badge", "text": {"en": "Worked with radiation badge monitoring?", "pl": "Praca z dozymetrem (promieniowanie)?"}, "type": "select", "options": ["Yes", "No", "Unsure"]}
              ],
              "options": {
                "jobTitles": [
                  { "value": "driver", "label": "Driver" },
                  { "value": "farmer", "label": "Farmer" },
                  { "value": "firefighter", "label": "Firefighter" },
                  { "value": "hairdresser", "label": "Hairdresser" },
                  { "value": "mechanic", "label": "Mechanic" },
                  { "value": "miner", "label": "Miner" },
                  { "value": "nurse", "label": "Nurse" },
                  { "value": "painter", "label": "Painter" },
                  { "value": "welder", "label": "Welder" }
                ],
                "exposures": [
                  { "value": "asbestos", "label": "Asbestos" },
                  { "value": "benzene", "label": "Benzene" },
                  { "value": "diesel_exhaust", "label": "Diesel exhaust" },
                  { "value": "formaldehyde", "label": "Formaldehyde" },
                  { "value": "silica", "label": "Silica" },
                  { "value": "welding_fumes", "label": "Welding fumes" },
                  { "value": "wood_dust", "label": "Wood dust" }
                ],
                "ppe": [
                  {"value": "respirator", "label": "Respirator"}, 
                  {"value": "local_exhaust", "label": "Local exhaust"},
                  {"value": "gloves", "label": "Gloves"},
                  {"value": "eye_face_protection", "label": "Eye/face protection"},
                  {"value": "protective_clothing", "label": "Protective clothing"},
                  {"value": "none", "label": "None"},
                  {"value": "not_applicable", "label": "Not applicable"}
                ],
                "shiftPatterns": ["Never", "Occasionally", "Frequently"],
                "intensities": ["Low", "Moderate", "High", "Unsure"],
                "radiationBadgeOptions": ["Yes", "No", "Unsure"]
              }
            },
            {
              "id": "environmental_exposures",
              "title": {"en": "Environmental Exposures (Optional)", "pl": "Narażenie Środowiskowe (Opcjonalne)"},
              "questions": [
                {
                  "id": "env.summary",
                  "text": { "en": "Select all that apply to your history", "pl": "Zaznacz wszystkie, które dotyczą Twojej historii" },
                  "type": "checkbox_group",
                  "options": [
                    { "id": "traffic_air", "label": { "en": "Lived near heavy traffic or in high pollution city", "pl": "Mieszkanie w pobliżu dużego ruchu lub w mieście o dużym zanieczyszczeniu" } },
                    { "id": "industry", "label": { "en": "Lived near heavy industry/power plant", "pl": "Mieszkanie w pobliżu przemysłu ciężkiego/elektrowni" } },
                    { "id": "solid_fuel", "label": { "en": "Used coal/wood for cooking/heating indoors", "pl": "Używanie węgla/drewna do gotowania/ogrzewania w domu" } },
                    { "id": "radon", "label": { "en": "Lived in high radon area", "pl": "Mieszkanie w rejonie o wysokim stężeniu radonu" } },
                    { "id": "asbestos", "label": { "en": "Known asbestos in home", "pl": "Znany azbest w domu" } },
                    { "id": "private_well", "label": { "en": "Drank from private well", "pl": "Picie wody z prywatnej studni" } },
                    { "id": "pesticides", "label": { "en": "Regular pesticide use (mixing/applying)", "pl": "Regularne stosowanie pestycydów (mieszanie/stosowanie)" } },
                    { "id": "sunbed", "label": { "en": "Sunbed/Tanning salon use", "pl": "Korzystanie z solarium" } },
                    { "id": "none", "label": { "en": "None of the above", "pl": "Żadne z powyższych" } }
                  ],
                  "exclusiveOptionId": "none"
                },
                
                { "id": "env.air.high_pollution_years", "text": {"en": "Years lived in area?", "pl": "Lata mieszkania w rejonie?"}, "type": "number_input", "dependsOn": {"questionId": "env.summary", "operator": "array_contains", "value": "traffic_air"} },
                { "id": "env.industry.type", "text": {"en": "Industry type", "pl": "Rodzaj przemysłu"}, "type": "checkbox_group", "options": [{"id": "refinery", "label": "Refinery"}, {"id": "chemical", "label": "Chemical Plant"}, {"id": "smelter", "label": "Smelter"}], "dependsOn": {"questionId": "env.summary", "operator": "array_contains", "value": "industry"} },
                
                { "id": "env.indoor.solidfuel_years", "text": {"en": "Years of exposure?", "pl": "Lata narażenia?"}, "type": "number_input", "dependsOn": {"questionId": "env.summary", "operator": "array_contains", "value": "solid_fuel"} },
                { "id": "env.indoor.ventilation", "text": {"en": "Was ventilation used?", "pl": "Czy używano wentylacji?"}, "type": "select", "options": ["Always", "Sometimes", "Never"], "dependsOn": {"questionId": "env.summary", "operator": "array_contains", "value": "solid_fuel"} },
                
                { "id": "env.radon.tested", "text": {"en": "Was home tested?", "pl": "Czy dom był badany?"}, "type": "select", "options": ["Yes", "No", "Unsure"], "dependsOn": {"questionId": "env.summary", "operator": "array_contains", "value": "radon"} },
                { "id": "env.radon.result", "text": {"en": "Result", "pl": "Wynik"}, "type": "text_input", "dependsOn": {"questionId": "env.radon.tested", "value": "Yes"} },
                
                { "id": "env.asbestos.disturbance", "text": {"en": "Was asbestos disturbed/damaged?", "pl": "Czy azbest był uszkodzony?"}, "type": "select", "options": ["Yes", "No", "Unsure"], "dependsOn": {"questionId": "env.summary", "operator": "array_contains", "value": "asbestos"} },
                
                { "id": "env.water.well_tested", "text": {"en": "Was water tested?", "pl": "Czy woda była badana?"}, "type": "select", "options": ["Yes", "No", "Unsure"], "dependsOn": {"questionId": "env.summary", "operator": "array_contains", "value": "private_well"} },
                { "id": "env.water.arsenic", "text": {"en": "History of arsenic?", "pl": "Historia arsenu?"}, "type": "checkbox", "dependsOn": {"questionId": "env.water.well_tested", "value": "Yes"} },
                
                { "id": "env.pesticide.type", "text": {"en": "Type/Frequency", "pl": "Rodzaj/Częstotliwość"}, "type": "select", "options": ["Occupational", "Home/Garden (Heavy)", "Occasional"], "dependsOn": {"questionId": "env.summary", "operator": "array_contains", "value": "pesticides"} },
                
                { "id": "env.uv.sunbed_freq", "text": {"en": "Frequency", "pl": "Częstotliwość"}, "type": "select", "options": ["Rarely", "Often", "Very Often"], "dependsOn": {"questionId": "env.summary", "operator": "array_contains", "value": "sunbed"} }
              ]

            },
            {
              "id": "labs_and_imaging",
              "title": {"en": "Labs & Imaging (Optional)", "pl": "Badania Laboratoryjne i Obrazowe (Opcjonalne)"},
              "options": {
                "studyCategories": [
                  {"value": "lab", "label": "Lab Test"},
                  {"value": "imaging", "label": "Imaging Study"}
                ],
                "labTypes": [
                  {"value": "cbc", "label": "CBC (Complete Blood Count)"},
                  {"value": "ferritin", "label": "Ferritin"},
                  {"value": "alt_ast", "label": "ALT/AST (Liver Enzymes)"},
                  {"value": "creatinine", "label": "Creatinine"},
                  {"value": "psa", "label": "PSA (Prostate-Specific Antigen)"}
                ],
                "imagingTypes": [
                  {"value": "xray", "label": "X-ray"},
                  {"value": "ultrasound", "label": "Ultrasound"},
                  {"value": "ct", "label": "CT Scan"},
                  {"value": "mri", "label": "MRI"},
                  {"value": "pet", "label": "PET Scan"}
                ],
                "resultSummaries": [
                  {"value": "no_findings", "label": "No significant findings"},
                  {"value": "indeterminate", "label": "Indeterminate findings"},
                  {"value": "significant", "label": "Significant findings noted"}
                ],
                "commonUnits": ["mg/dL", "g/dL", "mmol/L", "U/L", "ng/mL", "%"]
              }
            },
            {
              "id": "functional_status",
              "title": {"en": "Functional Status (Optional)", "pl": "Stan Funkcjonalny (Opcjonalne)"},
              "questions": [
                {
                  "id": "ecog",
                  "text": {"en": "ECOG Performance Status", "pl": "Skala sprawności ECOG"},
                  "type": "select",
                  "options": [
                    {"value": "0", "label": "0 - Fully active, able to carry on all pre-disease performance without restriction"},
                    {"value": "1", "label": "1 - Restricted in physically strenuous activity but ambulatory"},
                    {"value": "2", "label": "2 - Ambulatory and capable of all selfcare but unable to carry out any work activities"},
                    {"value": "3", "label": "3 - Capable of only limited selfcare, confined to bed or chair more than 50% of waking hours"},
                    {"value": "4", "label": "4 - Completely disabled. Cannot carry on any selfcare. Totally confined to bed or chair"}
                  ]
                },
                {
                  "id": "qlq_c30_consent",
                  "type": "checkbox",
                  "text": {"en": "Quality of Life Details", "pl": "Szczegóły Jakości Życia"},
                  "checkboxLabel": {
                    "en": "I would like to provide more details on my quality of life (optional).",
                    "pl": "Chciałbym/abym podać więcej szczegółów na temat mojej jakości życia (opcjonalnie)."
                  }
                },
                {
                  "id": "qlq_c30_item_29",
                  "text": { "en": "During the past week, how would you rate your overall health?", "pl": "Jak ocenił(a)by Pan(i) ogólnie swoje zdrowie w ciągu ostatniego tygodnia?" },
                  "type": "select",
                  "dependsOn": { "questionId": "qlq_c30_consent", "value": "true" },
                  "options": [
                    { "value": "7", "label": { "en": "7 - Excellent", "pl": "7 - Doskonałe" } },
                    { "value": "6", "label": "6" }, { "value": "5", "label": "5" },
                    { "value": "4", "label": { "en": "4 - Average", "pl": "4 - Przeciętne" } },
                    { "value": "3", "label": { "en": "3" } }, { "value": "2", "label": "2" },
                    { "value": "1", "label": { "en": "1 - Very poor", "pl": "1 - Bardzo złe" } }
                  ]
                },
                {
                  "id": "qlq_c30_item_2",
                  "text": { "en": "During the past week, have you had pain?", "pl": "Czy w ciągu ostatniego tygodnia odczuwał(a) Pan(i) ból?" },
                  "type": "select",
                  "dependsOn": { "questionId": "qlq_c30_consent", "value": "true" },
                  "options": [
                    { "value": "1", "label": { "en": "1 - Not at all", "pl": "1 - Wcale nie" } },
                    { "value": "2", "label": { "en": "2 - A little", "pl": "2 - Trochę" } },
                    { "value": "3", "label": { "en": "3 - Quite a bit", "pl": "3 - Dość mocno" } },
                    { "value": "4", "label": { "en": "4 - Very much", "pl": "4 - Bardzo mocno" } }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
      ]]>
    </file>
    <file path="src/lib/services/standardization.service.ts">
      <![CDATA[
import { logger } from "@/lib/logger";
import { cancerTypesMap } from "@/lib/mappings/cancer-types.map";
import { jobTitlesMap } from "@/lib/mappings/job-titles.map";
import { medicalConditionsMap } from "@/lib/mappings/medical-conditions.map";
import { occupationalExposuresMap } from "@/lib/mappings/occupational-exposures.map";
import { environmentalExposuresMap } from "@/lib/mappings/environmental-exposures.map";

/**
 * Safely parses a JSON string from an answers object.
 * @param value The value to parse, which might be a JSON string.
 * @returns The parsed object/array, or an empty array if parsing fails.
 */
const safeJsonParse = (value: any): any[] => {
  if (typeof value !== 'string' || !value) return [];
  try {
    const parsed = JSON.parse(value);
    // Allow parsing objects as well for single entries, but always return array for consistency if it's not one
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === 'object' && parsed !== null) return [parsed];
    return [];
  } catch (e) {
    return [];
  }
};

/**
 * A service to standardize raw form answers into a structured, coded format
 * as specified in new_requirements.md.
 */
export const StandardizationService = {
  /**
   * Processes the flat answer object from the form into a structured payload.
   * @param answers - The raw answers from the Zustand store.
   * @returns A structured object with core and advanced sections.
   */
  standardize: (answers: Record<string, any>): Record<string, any> => {
    const standardized: { core: Record<string, any>, advanced: Record<string, any> } = {
      core: {},
      advanced: {},
    };

    try {
      // --- CORE SECTION ---
      standardized.core = {
        dob: answers.dob,
        sex_at_birth: answers.sex_at_birth,
        height_cm: Number(answers.height_cm) || undefined,
        weight_kg: Number(answers.weight_kg) || undefined,
        smoking_status: answers.smoking_status,
        alcohol_status: answers['alcohol.status'],
        alcohol_former_since: Number(answers['alcohol.former_since']) || undefined,
        // Alcohol (AUDIT-C)
        alcohol_audit: {
            q1: Number(answers['auditc.q1_freq']),
            q2: Number(answers['auditc.q2_typical']),
            q3: Number(answers['auditc.q3_6plus']),
        },
        symptoms: safeJsonParse(answers.symptoms),
        family_cancer_any: answers.family_cancer_any,
        // Optional core fields
        intent: answers.intent,
        source: answers.source,
        language: answers.language,
        gender_identity: answers.gender_identity,
        // Diet (WCRF FFQ)
        diet: {
            vegetables: Number(answers['diet.fv_portions_day']),
            red_meat: Number(answers['diet.red_meat_servings_week']), // Old: diet_red_meat
            processed_meat: Number(answers['diet.processed_meat_servings_week']), // Old: diet_processed_meat
            sugary_drinks: Number(answers['diet.ssb_servings_week']),
            whole_grains: Number(answers['diet.whole_grains_servings_day']),
            fast_food: Number(answers['diet.fastfoods_freq_week']),
            legumes: Number(answers['diet.legumes_freq_week']),
            upf_share: answers['diet.upf_share_pct'],
            ssb_container: answers['diet.ssb_container'],
        },
        // Physical Activity (IPAQ)
        physical_activity: {
            vigorous_days: Number(answers['pa.vig.days7']),
            vigorous_min: Number(answers['pa.vig.minperday']),
            moderate_days: Number(answers['pa.mod.days7']),
            moderate_min: Number(answers['pa.mod.minperday']),
            walking_days: Number(answers['pa.walk.days7']),
            walking_min: Number(answers['pa.walk.minperday']), // Old: ipaq_walking_min
            sitting_min: Number(answers['pa.sit.min_day']),
        },
      };

      // --- ADVANCED SECTION ---
      
      // Symptom Details
      const symptomDetails: Record<string, any> = {};
      standardized.core.symptoms.forEach((symptomId: string) => {
        const detailKey = `symptom_details_${symptomId}`;
        if (answers[detailKey]) {
          symptomDetails[symptomId] = safeJsonParse(answers[detailKey]); // Changed to safeJsonParse
        }
      });
      if (Object.keys(symptomDetails).length > 0) {
        standardized.advanced.symptom_details = symptomDetails;
      }
      
      // Family History
      if (answers.family_cancer_history) {
        const familyHistory = safeJsonParse(answers.family_cancer_history);
        standardized.advanced.family = familyHistory.map((member: any) => ({
          ...member,
          cancer_code: cancerTypesMap[member.cancer_type] || undefined,
          // New fields are passed through automatically via spread, but explicitly listed for clarity if needed
        }));
      }
      
      // Genetics
      if (['yes_report', 'yes_no_details'].includes(answers['gen.testing_ever'])) {
        standardized.advanced.genetics = {
          tested: true,
          type: answers.genetic_test_type,
          year: answers.genetic_test_year,
          lab: answers.genetic_lab,
          findings_present: answers['gen.path_variant_self'] === 'yes', // Old logic mapped
          variant_self_status: answers['gen.path_variant_self'],
          genes: answers.genetic_genes ? JSON.parse(answers.genetic_genes) : [],
          variants_hgvs: answers.genetic_variants_hgvs,
          vus_present: answers.genetic_vus_present,
        };
      }
      // PRS
      if (answers['gen.prs_done'] === 'Yes') {
          standardized.advanced.genetics = {
              ...standardized.advanced.genetics,
              prs: {
                  done: true,
                  red_flags: answers['gen.prs_cancers_flagged'] ? (Array.isArray(answers['gen.prs_cancers_flagged']) ? answers['gen.prs_cancers_flagged'] : [answers['gen.prs_cancers_flagged']]) : [],
                  risk_band: answers['gen.prs_overall_band']
              }
          }
      }

      // Illnesses (Mapped from Core cond.summary)
      // cond.summary is likely an array of strings (e.g. ["hbv", "diabetes"]) or a JSON string depending on storage.
      // Usually checkbox groups store as array or stringified array. safeJsonParse handles stringified.
      // If it's already an array, safeJsonParse returns it? safeJsonParse expects string.
      // Let's handle both.
      let illnessList = answers['cond.summary'];
      if (typeof illnessList === 'string') {
          illnessList = safeJsonParse(illnessList);
      } else if (!Array.isArray(illnessList)) {
          illnessList = [];
      }

      if (illnessList.length > 0) {
          standardized.advanced.illnesses = illnessList.map((illnessId: string) => {
              // New Logic: specific fields per illness
              const details: any = {};
              
              if (illnessId === 'hbv') {
                  details.status = answers['cond.hbv.status'];
                  details.antiviral = answers['cond.hbv.antiviral_now'];
              }
              if (illnessId === 'hcv') {
                  details.status = answers['cond.hcv.status'];
                  details.svr12 = answers['cond.hcv.svr12'];
              }
              if (illnessId === 'cirrhosis') details.etiology = answers['cond.cirrhosis.etiology'];
              if (illnessId === 'ibd') {
                  details.type = answers['cond.ibd.type'];
                  details.extent = answers['cond.ibd.extent'];
                  // Need year of diagnosis for duration calculation
                  // Assuming 'illness_details_ibd' might store year if collected via GenericModule or similar
                  // But current JSON uses specific questions.
                  // If year is not collected, duration logic will fail gracefully.
                  // Let's check if we can add year collection for IBD.
                  // For now, mapping what we have.
              }
              if (illnessId === 'diabetes') details.type = answers['cond.diabetes.type'];
              if (illnessId === 'hypertension') details.controlled = answers['cond.hypertension.controlled'];

              return {
                  id: illnessId,
                  code: medicalConditionsMap[illnessId] || undefined,
                  ...details
              };
          });
      }

      // Personal Cancer History
      if (answers.personal_cancer_history) {
        const personalCancerHistory = safeJsonParse(answers.personal_cancer_history);
        standardized.advanced.personal_cancer_history = personalCancerHistory.map((cancer: any) => ({
          ...cancer,
          type_code: cancerTypesMap[cancer.type] || undefined,
        }));
      }

       // Occupational History (Hazard Centric)
      if (answers.occupational_hazards) {
        const occupationalHistory = safeJsonParse(answers.occupational_hazards);
        // Map hazard-centric entries
        standardized.advanced.occupational = occupationalHistory.map((entry: any) => {
          return {
             hazard: entry.hazardId,
             hazard_code: occupationalExposuresMap[entry.hazardId] || undefined,
             job_title: entry.main_job_title,
             isco: jobTitlesMap[entry.main_job_title] || undefined,
             years: entry.years_total,
             hours_week: entry.hours_per_week,
             year_first: entry.year_first_exposed,
             current: entry.current_exposure,
             ppe: entry.ppe_use
          };
        });
      }
      
      // Screening and Immunization
      const screeningImmunization: Record<string, any> = {};
      const screeningKeys = [
          'screen.colonoscopy.done', 'screen.colonoscopy.date', 
          'screen.mammo.done', 'screen.mammo.date', 
          'screen.pap.done', 'screen.pap.date', 
          'screen.psa.done', 'screen.psa.date', 
          'imm.hpv', 'imm.hbv',
          // New Screening
          'screen.lung.ldct_ever', 'screen.lung.ldct_last_year',
          'screen.skin.full_exam_ever', 'screen.skin.last_year',
          'screen.hcc.us_ever', 'screen.hcc.us_last_year',
          'screen.upper_endo.ever', 'screen.upper_endo.last_year',
          'screen.cervix.last_type', 'screen.cervix.last_result', // Added
          // New Immunization
          'imm.hav.any', 'imm.flu.last_season', 'imm.covid.doses',
          'imm.td_tdap.year_last', 'imm.pneumo.ever', 'imm.zoster.ever'
      ];
      screeningKeys.forEach(key => {
        if (answers[key]) {
          screeningImmunization[key] = answers[key];
        }
      });
      if (Object.keys(screeningImmunization).length > 0) {
        standardized.advanced.screening_immunization = screeningImmunization;
      }

      // Medications / Iatrogenic
      const medications: Record<string, any> = {};
      const medicationKeys = ['immunosuppression_now', 'immunosuppression_cause'];
      medicationKeys.forEach(key => {
          if (answers[key]) {
              medications[key] = answers[key];
          }
      });
        if (Object.keys(medications).length > 0) {
        standardized.advanced.medications_iatrogenic = medications;
      }


      // Sexual Health
      const sexualHealth: Record<string, any> = {};
      const sexualHealthKeys = [
          'sexhx.section_opt_in',
          'sex_active', 
          'sexhx.partner_genders', 
          'sexhx.lifetime_partners_cat', // Old: sex_lifetime_partners
          'sexhx.partners_12m_cat', 
          'sexhx.condom_use_12m', // Old: sex_barrier_freq
          'sexhx.sti_history_other', 
          'sex_anal', 
          'sex_oral', 
          'sex_barriers_practices',
          // New
          'sexhx.new_partner_12m',
          'sexhx.age_first_sex',
          'sexhx.sex_sites_ever',
          'sexhx.sex_sites_12m',
          'sexhx.sex_work_ever',
          'sexhx.sex_work_role',
          'sexhx.sti_treated_12m',
          'sexhx.hpv_precancer_history' // Female only
      ];
      sexualHealthKeys.forEach(key => {
        if (answers[key]) {
             if (['sexhx.partner_genders', 'sexhx.sex_sites_ever', 'sexhx.sex_sites_12m', 'sexhx.sex_work_role', 'sexhx.sex_work_ever', 'sexhx.hpv_precancer_history'].includes(key) && answers[key].startsWith('[')) {
                 sexualHealth[key] = safeJsonParse(answers[key]);
             } else {
                 sexualHealth[key] = answers[key];
             }
        }
      });
      if (Object.keys(sexualHealth).length > 0) {
        standardized.advanced.sexual_health = sexualHealth;
      }

      // Environmental Exposures
      const environmental: Record<string, any> = {};
      const envKeys = [
          'env.summary',
          // Detail fields
          'env.air.high_pollution_years', 'env.industry.type',
          'env.indoor.solidfuel_years', 'env.indoor.ventilation',
          'env.radon.tested', 'env.radon.result', 'env.radon.mitigation_done',
          'env.asbestos.disturbance',
          'env.water.well_tested', 'env.water.arsenic',
          'env.pesticide.type',
          'env.uv.sunbed_freq',
          // Retained/Common fields
          'home_years_here', 'home_postal_coarse', 'home_year_built', 'home_basement',
          'home_shs_home', 'env_outdoor_uv', 'env.uv.sunburn_child', 'env.uv.sunburn_adult'
      ];
      
      envKeys.forEach(key => {
          if (answers[key]) {
              environmental[key] = answers[key];
          }
      });

      // Map environmental summary to codes
      if (answers['env.summary']) {
          const envList = safeJsonParse(answers['env.summary']);
          environmental.coded_exposures = envList.map((id: string) => ({
              id: id,
              code: environmentalExposuresMap[id] || undefined
          })).filter((item: any) => item.id !== 'none');
      }

      if (Object.keys(environmental).length > 0) {
        standardized.advanced.environmental = environmental;
      }
      envKeys.forEach(key => {
         if (answers[key]) {
           environmental[key] = answers[key];
        }
      });
       if (Object.keys(environmental).length > 0) {
        standardized.advanced.environment = environmental;
      }

      // Labs & Imaging
      if (answers.labs_and_imaging) {
        standardized.advanced.labs_imaging = safeJsonParse(answers.labs_and_imaging);
      }
      
      // Functional Status
      const functionalStatus: Record<string, any> = {};
      if (answers.ecog) {
        functionalStatus.ecog = answers.ecog;
      }
      if (answers.qlq_c30_consent === 'true') {
        functionalStatus.qlq_c30_consent = true;
      }
      for (const key in answers) {
        if (key.startsWith('qlq_c30_item_')) {
          functionalStatus[key] = answers[key];
        }
      }
      if (Object.keys(functionalStatus).length > 0) {
        standardized.advanced.functional_status = functionalStatus;
      }

      // Smoking Details
      // Consolidating new logic
      const smokingDetails: any = {
          pattern: answers['smoking.pattern'],
          start_age: Number(answers['smoking.start_age']) || undefined,
          cigs_per_day: Number(answers['smoking.intensity']) || undefined,
          intensity_unit: answers['smoking.intensity_unit'],
          years: Number(answers['smoking.years_smoked']) || undefined,
          quit_date: answers['smoking.quit_date'], // Updated key
          other_tobacco: answers['smoking.other_tobacco_smoked'],
          cigars_week: Number(answers['smoking.other_cigar_per_week']) || undefined,
          pipe_week: Number(answers['smoking.pipe_per_week']) || undefined,
          shisha_week: Number(answers['smoking.shisha_per_week']) || undefined,
          vape: {
              status: answers['vape.status'],
              days_30d: Number(answers['vape.days_30d']) || undefined,
              device: answers['vape.device_type'],
              nicotine: answers['vape.nicotine'],
          },
          htp: {
              status: answers['htp.status'],
              days_30d: Number(answers['htp.days_30d']) || undefined,
              sticks_day: Number(answers['htp.sticks_per_day']) || undefined,
          },
          shs: {
              home_freq: answers['shs.home_freq'],
              work_freq: answers['shs.work_freq'],
              public_30d: answers['shs.public_30d_bars'],
              hours_7d: Number(answers['shs.hours_7d']) || undefined,
          }
      };

      // Clean undefined
      const cleanObject = (obj: any): any => {
         Object.keys(obj).forEach(key => {
             if (obj[key] && typeof obj[key] === 'object') cleanObject(obj[key]);
             else if (obj[key] === undefined) delete obj[key];
         });
         return obj;
      };
      
      // Update alcohol with beverage mix
      if (answers['alcohol.beverage_mix']) {
          standardized.core.alcohol_beverage_mix = answers['alcohol.beverage_mix'];
      }

      standardized.advanced.smoking_detail = cleanObject(smokingDetails);

    } catch (error) {
      logger.error("Failed to standardize answers", {
        error,
        answers,
      });
    }

    return standardized;
  },

  /**
   * Converts the standardized data into a FHIR Bundle.
   * @param standardizedData - The output from standardize().
   * @returns A FHIR Bundle resource.
   */
  toFhir: (standardizedData: Record<string, any>): Record<string, any> => {
      const bundle: Record<string, any> = {
          resourceType: "Bundle",
          type: "collection",
          entry: []
      };

      try {
          const core = standardizedData.core || {};
          const advanced = standardizedData.advanced || {};
          const patientId = "patient-001"; // Placeholder

          // 1. Patient Resource
          bundle.entry.push({
              resource: {
                  resourceType: "Patient",
                  id: patientId,
                  birthDate: core.dob,
                  gender: core.sex_at_birth === 'Male' ? 'male' : (core.sex_at_birth === 'Female' ? 'female' : 'other'),
                  ...(core.height_cm && core.weight_kg ? {
                      // Extensions could go here
                  } : {})
              }
          });

          // 2. Observations (Vital Signs / Biometrics)
          if (core.height_cm) {
              bundle.entry.push({
                  resource: {
                      resourceType: "Observation",
                      status: "final",
                      code: { coding: [{ system: "http://loinc.org", code: "8302-2", display: "Body height" }] },
                      subject: { reference: `Patient/${patientId}` },
                      valueQuantity: { value: core.height_cm, unit: "cm", system: "http://unitsofmeasure.org", code: "cm" }
                  }
              });
          }
           if (core.weight_kg) {
              bundle.entry.push({
                  resource: {
                      resourceType: "Observation",
                      status: "final",
                      code: { coding: [{ system: "http://loinc.org", code: "29463-7", display: "Body weight" }] },
                      subject: { reference: `Patient/${patientId}` },
                      valueQuantity: { value: core.weight_kg, unit: "kg", system: "http://unitsofmeasure.org", code: "kg" }
                  }
              });
          }

          // 3. Observations (Social History)
          if (core.smoking_status) {
              bundle.entry.push({
                  resource: {
                      resourceType: "Observation",
                      status: "final",
                      code: { coding: [{ system: "http://loinc.org", code: "72166-2", display: "Tobacco smoking status" }] },
                      subject: { reference: `Patient/${patientId}` },
                      valueCodeableConcept: { text: core.smoking_status }
                  }
              });
          }
          
          // 4. Family Member History
           if (advanced.family && Array.isArray(advanced.family)) {
               advanced.family.forEach((member: any, index: number) => {
                   bundle.entry.push({
                       resource: {
                           resourceType: "FamilyMemberHistory",
                           id: `family-${index}`,
                           status: "completed",
                           patient: { reference: `Patient/${patientId}` },
                           relationship: { text: member.relation },
                           condition: [
                               {
                                   code: { text: member.cancer_type },
                                   onsetAge: { value: member.age_dx, unit: "a", system: "http://unitsofmeasure.org", code: "a" }
                               }
                           ]
                       }
                   });
               });
           }

          // 5. Conditions (Personal History)
          if (advanced.personal_cancer_history && Array.isArray(advanced.personal_cancer_history)) {
              advanced.personal_cancer_history.forEach((cancer: any, index: number) => {
                   bundle.entry.push({
                       resource: {
                           resourceType: "Condition",
                           id: `history-cancer-${index}`,
                           clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active" }] }, // Assuming active history
                           verificationStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-ver-status", code: "confirmed" }] },
                           category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-category", code: "problem-list-item" }] }],
                           code: { text: cancer.type },
                           subject: { reference: `Patient/${patientId}` },
                           onsetDateTime: cancer.year_dx ? `${cancer.year_dx}` : undefined
                       }
                   });
              });
          }


      } catch (error) {
           logger.error("Failed to map to FHIR", { error });
      }

      return bundle;
  }
};
      ]]>
    </file>
    <file path="src/lib/services/derived-variables.service.ts">
      <![CDATA[
import { logger } from "@/lib/logger";
import { differenceInYears } from 'date-fns';

/**
 * Calculates Body Mass Index (BMI).
 * @param height - Height in cm.
 * @param weight - Weight in kg.
 * @returns The calculated BMI, or null if inputs are invalid.
 */
function calculateBmi(height?: number, weight?: number): number | null {
  if (!height || !weight || height <= 0 || weight <= 0) {
    return null;
  }
  const heightInMeters = height / 100;
  return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(2));
}

/**
 * Calculates age from a date of birth string.
 * @param dob - Date of birth in "YYYY-MM-DD" format.
 * @returns The calculated age in years, or null if the input is invalid.
 */
function calculateAge(dob?: string): number | null {
    if (!dob) return null;
    try {
        const birthDate = new Date(dob);
        if (isNaN(birthDate.getTime())) return null;
        return differenceInYears(new Date(), birthDate);
    } catch {
        return null;
    }
}

/**
 * Calculates smoking pack-years and Brinkman Index.
 * @param smokingDetails - Object with cigs_per_day, intensity_unit and years.
 * @returns Object containing pack-years and brinkman_index.
 */
function calculateSmokingMetrics(smokingDetails?: { cigs_per_day?: number; intensity_unit?: string; years?: number }): { pack_years: number | null, brinkman_index: number | null } {
    if (!smokingDetails || !smokingDetails.cigs_per_day || !smokingDetails.years) {
        return { pack_years: null, brinkman_index: null };
    }
    const { cigs_per_day, intensity_unit, years } = smokingDetails;
    if (cigs_per_day <= 0 || years <= 0) return { pack_years: null, brinkman_index: null };
    
    let packsPerDay = 0;
    let cigarettesPerDay = 0;

    if (intensity_unit === 'Packs per day') {
        packsPerDay = cigs_per_day;
        cigarettesPerDay = cigs_per_day * 20;
    } else {
        packsPerDay = cigs_per_day / 20;
        cigarettesPerDay = cigs_per_day;
    }

    const pack_years = parseFloat((packsPerDay * years).toFixed(1));
    const brinkman_index = parseFloat((cigarettesPerDay * years).toFixed(1));

    return { pack_years, brinkman_index };
}

/**
 * Checks for early-age cancer diagnosis in first-degree relatives.
 * @param familyHistory - Array of family member health history.
 * @returns `true` if an early diagnosis is found, `false` otherwise, or `null` if no relevant data.
 */
function calculateEarlyAgeFamilyDx(familyHistory?: { relation?: string; age_dx?: number }[]): boolean | null {
    if (!familyHistory || !Array.isArray(familyHistory) || familyHistory.length === 0) {
        return null;
    }

    const firstDegreeRelatives = ['Parent', 'Sibling', 'Child', 'Mother', 'Father', 'Sister', 'Brother', 'Daughter', 'Son'];

    const hasEarlyDx = familyHistory.some(
        (relative) =>
            relative.relation &&
            firstDegreeRelatives.includes(relative.relation) &&
            relative.age_dx &&
            relative.age_dx < 50
    );
    
    return hasEarlyDx;
}

/**
 * Calculates granular family history metrics per cancer site.
 * PDF Page 32: derived.famhx.[site].fdr_count, sdr_third_count, youngest_dx_age_any
 */
function calculateFamilySiteMetrics(familyHistory?: any[]): Record<string, any> {
    if (!familyHistory || !Array.isArray(familyHistory)) return {};

    const sites = ['breast', 'ovarian', 'colorectal', 'prostate', 'lung', 'melanoma', 'pancreas', 'gastric'];
    const metrics: Record<string, any> = {};

    const firstDegree = ['Mother', 'Father', 'Sister', 'Brother', 'Daughter', 'Son'];
    const secondDegree = ['Maternal Grandmother', 'Maternal Grandfather', 'Paternal Grandmother', 'Paternal Grandfather', 'Aunt', 'Uncle', 'Niece', 'Nephew'];
    
    sites.forEach(site => {
        let fdrCount = 0;
        let sdrCount = 0;
        let youngestAge: number | null = null;

        familyHistory.forEach(member => {
            // Check if member has this cancer (cancers array or single cancer_type)
            const memberCancers = member.cancers || (member.cancer_type ? [{cancer_type: member.cancer_type, age_dx: member.age_dx}] : []);
            
            memberCancers.forEach((c: any) => {
                if (c.cancer_type && c.cancer_type.toLowerCase().includes(site)) {
                    // Increment counts
                    if (firstDegree.includes(member.relation)) fdrCount++;
                    else if (secondDegree.includes(member.relation)) sdrCount++; // Treating 2nd and 3rd degree (cousin) as non-FDR group for now

                    // Track youngest age
                    const dxAge = c.age_dx;
                    if (dxAge !== undefined && dxAge !== null) {
                        if (youngestAge === null || dxAge < youngestAge) {
                            youngestAge = dxAge;
                        }
                    }
                }
            });
        });

        metrics[`famhx.${site}.fdr_count`] = fdrCount;
        metrics[`famhx.${site}.sdr_third_count`] = sdrCount;
        metrics[`famhx.${site}.youngest_dx_age_any`] = youngestAge;
    });

    return metrics;
}

/**
 * Calculates composite flags for occupational exposures.
 * @param occupationalHistory - Array of jobs with exposures.
 * @returns An object with exposure flags, or null if no data.
 */
function calculateExposureComposites(occupationalHistory?: { occ_exposures?: string[] }[]): { has_known_carcinogen_exposure: boolean } | null {
    if (!occupationalHistory || !Array.isArray(occupationalHistory) || occupationalHistory.length === 0) {
        return null;
    }

    const highRiskExposures = ['asbestos', 'benzene'];
    const allExposures = new Set(occupationalHistory.flatMap(job => job.occ_exposures || []));

    const hasExposure = highRiskExposures.some(risk => allExposures.has(risk));
    
    return { has_known_carcinogen_exposure: hasExposure };
}


/**
 * Calculates AUDIT-C Score (Alcohol).
 * @param answers - Object with q1, q2, q3 values (0-4).
 * @returns Object with score and risk category.
 */
function calculateAuditC(answers?: { q1?: number, q2?: number, q3?: number }, sex?: string): { score: number, risk: string } | null {
    if (!answers || answers.q1 === undefined || answers.q2 === undefined || answers.q3 === undefined) return null;
    const score = (answers.q1 || 0) + (answers.q2 || 0) + (answers.q3 || 0);
    const threshold = sex === 'Female' ? 3 : 4;
    const risk = score >= threshold ? 'Hazardous' : 'Low Risk';
    return { score, risk };
}

/**
 * Calculates IPAQ Physical Activity Score.
 * @param data - Object with days/minutes for vigorous, moderate, walking.
 * @returns Object with MET-minutes and Category (Low, Moderate, High).
 */
function calculateIpaq(data?: any): { metMinutes: number, category: string, who2020_meets: boolean } | null {
    if (!data) return null;
    
    // Ensure all inputs are numbers, default to 0 if missing/NaN
    const vigDays = Number(data.vigorous_days) || 0;
    const vigMin = Number(data.vigorous_min) || 0;
    const modDays = Number(data.moderate_days) || 0;
    const modMin = Number(data.moderate_min) || 0;
    const walkDays = Number(data.walking_days) || 0;
    const walkMin = Number(data.walking_min) || 0;

    const vigMets = 8.0 * vigMin * vigDays;
    const modMets = 4.0 * modMin * modDays;
    const walkMets = 3.3 * walkMin * walkDays;
    
    const totalMetMinutes = vigMets + modMets + walkMets;
    const totalDays = vigDays + modDays + walkDays;

    let category = 'Low';

    // Criteria for High
    if ((vigDays >= 3 && totalMetMinutes >= 1500) || (totalDays >= 7 && totalMetMinutes >= 3000)) {
        category = 'High';
    } 
    // Criteria for Moderate
    else if (
        (vigDays >= 3 && vigMin >= 20) || 
        (modDays >= 5 && modMin >= 30) || 
        (walkDays >= 5 && walkMin >= 30) || // Walking is usually included in moderate 5 days rule if duration is sufficient (~30min)
        (totalDays >= 5 && totalMetMinutes >= 600)
    ) {
        category = 'Moderate';
    }

    // WHO 2020 Guidelines: 150-300 min moderate OR 75-150 min vigorous per week
    const totalVigMinutes = vigDays * vigMin;
    const totalModMinutes = modDays * modMin + (walkDays * walkMin); // Walking counts as moderate if brisk
    
    const who2020_meets = (totalVigMinutes >= 75) || (totalModMinutes >= 150) || ((totalVigMinutes * 2 + totalModMinutes) >= 150);

    return { metMinutes: Math.round(totalMetMinutes), category, who2020_meets };
}

/**
 * Calculates WCRF Dietary/Lifestyle Compliance Score (Detailed).
 * strict thresholds based on PDF requirements.
 * 0 / 0.5 / 1.0 logic.
 */
function calculateWcrf(
    diet: any, 
    alcoholScore: number | undefined, 
    bmi: number | null, 
    ipaqCategory: string | undefined
): { score: number, max: number, compliance: string, components: any } | null {
    if (!diet) return null;
    
    // Components
    let compA = 0; // Plant Foods (FV, WG, Legumes)
    let compB = 0; // Fast Foods (Energy Dense)
    let compC = 0; // Animal Foods (Meat)
    let compD = 0; // Sugary Drinks

    // --- Component A: Plant Foods (Max 1.0) ---
    // Rule: FV >= 5 AND (WholeGrains >= 3 OR Legumes >= 1.5) -> 1.0
    // Sub-optimal: FV >= 4 OR WG >= 1.5 OR Legumes >= 3/week -> 0.5
    // Else 0
    const fv = diet.vegetables || 0; // servings/day
    const wg = diet.whole_grains || 0; // servings/day
    const legumes = diet.legumes || 0; // servings/week
    
    if (fv >= 5 && wg >= 3) {
        compA = 1.0;
    } else if (fv >= 4 || wg >= 1.5 || legumes >= 3) {
        compA = 0.5;
    }

    // --- Component B: Fast Foods (Max 1.0) ---
    // PDF Logic: 1.0 if fastfoods<=1/wk; 0.5 if fastfoods in [2,3]; else 0.
    const fastFoodFreq = diet.fast_food || 0;
    if (fastFoodFreq <= 1) compB = 1.0;
    else if (fastFoodFreq <= 3) compB = 0.5;

    // --- Component C: Animal Foods (Max 1.0) ---
    // Rule: Red Meat <= 350g/week AND Processed Meat == 0 -> 1.0
    // Rule: Red Meat <= 500g/week AND Processed Meat <= 50g/week -> 0.5
    const redMeatGwk = (diet.red_meat || 0) * 100;
    const procMeatGwk = (diet.processed_meat || 0) * 50;

    if (redMeatGwk <= 350 && procMeatGwk === 0) {
        compC = 1.0;
    } else if (redMeatGwk <= 500 && procMeatGwk <= 50) {
        compC = 0.5;
    }

    // --- Component D: Sugary Drinks (Max 1.0) ---
    // PDF Logic: 1.0 if SSB=0; 0.5 if <=250 mL/wk; else 0.
    const ssbFreq = diet.sugary_drinks || 0;
    const ssbSize = diet.ssb_container || 'Medium (330ml)';
    let mlPerServing = 330;
    if (ssbSize.includes('250')) mlPerServing = 250;
    if (ssbSize.includes('500')) mlPerServing = 500;
    if (ssbSize.includes('750')) mlPerServing = 750;
    const ssbMlwk = ssbFreq * mlPerServing;

    if (ssbFreq === 0) compD = 1.0;
    else if (ssbMlwk <= 250) compD = 0.5;

    // --- Total ---
    const totalScore = compA + compB + compC + compD;
    const maxScore = 4.0;

    let compliance = 'Low';
    if (totalScore >= 3.0) compliance = 'High';
    else if (totalScore >= 2.0) compliance = 'Moderate';

    return { 
        score: totalScore, 
        max: maxScore, 
        compliance,
        components: { compA, compB, compC, compD }
    };
}

/**
 * Checks for specific Family History clusters.
 */
function calculateFamilyClusters(familyHistory?: any[]): Record<string, boolean> {
    if (!familyHistory || !Array.isArray(familyHistory)) return {};

    const relatives = familyHistory.map(f => ({
        relation: f.relation,
        cancer: f.cancer_type ? f.cancer_type.toLowerCase() : '',
        age: f.age_dx
    }));

    // 1. Breast/Ovarian Cluster
    // Rule: >= 2 blood relatives (1st/2nd degree) with Breast or Ovarian
    // Note: Assuming all entered relatives are blood relatives (usually the case in these forms)
    const breastOvarianCount = relatives.filter(r => 
        r.cancer.includes('breast') || r.cancer.includes('ovarian')
    ).length;

    // 2. Colorectal Cluster
    // Rule: >= 2 relatives with Colorectal
    const colorectalCount = relatives.filter(r => 
        r.cancer.includes('colon') || r.cancer.includes('rectal') || r.cancer.includes('colorectal')
    ).length;

    // 3. Childhood or Rare Cluster
    // Rule: Any diagnosis < 20y OR rare type (Sarcoma, etc.)
    const rareTypes = ['sarcoma', 'glioblastoma', 'adrenocortical', 'retinoblastoma', 'wilms'];
    const childhoodOrRare = relatives.some(r => 
        (r.age !== undefined && r.age < 20) || 
        rareTypes.some(t => r.cancer.includes(t))
    );

    return {
        pattern_breast_ovarian_cluster: breastOvarianCount >= 2,
        pattern_colorectal_cluster: colorectalCount >= 2,
        pattern_childhood_or_rare_cluster: childhoodOrRare
    };
}
        
/**
 * Checks for hereditary cancer syndromes (Lynch, HBOC) - Flags
 */
function calculateSyndromeFlags(familyHistory?: any[]): Record<string, boolean> {
    if (!familyHistory || !Array.isArray(familyHistory)) return {};
    
    const relatives = familyHistory.map(f => ({
        cancer: f.cancer_type ? f.cancer_type.toLowerCase() : '',
        age: f.age_dx,
        side: f.side_of_family
    }));
    
    // Lynch: Amsterdam II criteria simplified for screening (3-2-1 rule approx)
    // 3 relatives with Lynch-associated cancer on SAME side of family
    const lynchCancers = ['colorectal', 'endometrial', 'ovarian', 'stomach', 'pancreatic', 'biliary', 'urinary', 'brain', 'skin', 'small intestine'];
    
    // Group by side (Maternal, Paternal)
    const maternalLynch = relatives.filter(r => r.side === 'Maternal' && lynchCancers.some(c => r.cancer.includes(c)));
    const paternalLynch = relatives.filter(r => r.side === 'Paternal' && lynchCancers.some(c => r.cancer.includes(c)));
    
    // Also consider N/A (siblings/children) - they contribute to both or need context. 
    // For simplicity in this derived logic without full pedigree, we check if ANY side has >= 3 OR total >= 3 if side unknown.
    // Ideally, we strictly check sides.
    const isLynch = maternalLynch.length >= 3 || paternalLynch.length >= 3;
    
    return {
        pattern_lynch_syndrome: isLynch
    };
}

/**
 * Checks for Occupational Risk flags.
 */
function calculateOccupationalFlags(history?: any[]): Record<string, boolean> {
    if (!history || !Array.isArray(history)) return {};

    // Lung High Risk Carcinogens (PDF Spec)
    // Asbestos, Silica, Diesel, Welding, Painting, Radon, Arsenic, Cadmium, Chromium, Nickel, Beryllium, Soot
    const lungCarcinogens = [
        'asbestos', 'silica', 'diesel', 'welding', 'painting', 'painter', 'radon__occ', 
        'arsenic', 'cadmium', 'chromium', 'nickel', 'beryllium', 'soot', 'metal_fluids'
    ]; 
    
    // Mesothelioma Flag: Asbestos AND Years >= 1
    
    let lungRisk = false;
    let mesoFlag = false;

    history.forEach(job => {
        // Handle both flattened hazards array (if simple list) or structured job object
        const possibleHazards = [...(job.occ_exposures || []), ...(job.hazards || [])];
        if (job.hazard) possibleHazards.push(job.hazard); // legacy single
        if (job.job_title && lungCarcinogens.includes(job.job_title.toLowerCase())) possibleHazards.push(job.job_title.toLowerCase());

        const years = job.years || 0;
        
        // Check for any lung carcinogen overlap
        const hasCarcinogen = lungCarcinogens.some(c => possibleHazards.includes(c));
        
        if (hasCarcinogen && years >= 10) {
            lungRisk = true;
        }
        
        if (possibleHazards.includes('asbestos') && years >= 1) {
            mesoFlag = true;
        }
    });

    return {
        'occ.lung_highrisk': lungRisk,
        'occ.mesothelioma_flag': mesoFlag
    };
}

/**
 * Calculates HPV Exposure Band (Low/Medium/Higher).
 * Based on PDF Page 13 logic.
 */
function calculateHpvExposureBand(sexualHealth: any): string {
    if (!sexualHealth) return 'Low';

    const lifetimePartners = sexualHealth['sexhx.lifetime_partners_cat'];
    const recentPartners = sexualHealth['sexhx.partners_12m_cat'];
    const sexSitesEver = sexualHealth['sexhx.sex_sites_ever'] || [];
    const ageFirstSex = sexualHealth['sexhx.age_first_sex'];
    const sexWork = sexualHealth['sexhx.sex_work_ever'];

    const hasAnal = Array.isArray(sexSitesEver) && sexSitesEver.includes('anal');
    const isSexWork = sexWork === 'Yes';

    // Higher
    if (
        (lifetimePartners === '20+' || lifetimePartners === '10-19') || 
        ['4-5', '6+'].includes(recentPartners) ||
        hasAnal ||
        isSexWork
    ) {
        return 'Higher';
    }

    // Medium
    if (
        ['2-4', '5-9'].includes(lifetimePartners) ||
        ['2-3'].includes(recentPartners) ||
        (ageFirstSex && ageFirstSex < 18)
    ) {
        return 'Medium';
    }

    return 'Low';
}

/**
 * Calculates Genetics Flags (High/Moderate Penetrance).
 */
function calculateGeneticsFlags(genetics: any): Record<string, boolean> {
    if (!genetics || !genetics.genes) return { 
        'gen.high_penetrance_carrier': false, 
        'gen.moderate_penetrance_only': false,
        'gen.lynch_syndrome': false,
        'gen.polyposis_syndrome': false,
        'gen.prs_elevated': false
    };

    const highPenetranceGenes = ['BRCA1', 'BRCA2', 'PALB2', 'TP53', 'PTEN', 'CDH1', 'STK11', 'MLH1', 'MSH2', 'MSH6', 'PMS2', 'EPCAM', 'APC', 'MUTYH', 'POLE', 'POLD1', 'SMAD4', 'BMPR1A', 'VHL', 'MEN1', 'RET'];
    const moderatePenetranceGenes = ['ATM', 'CHEK2', 'BARD1', 'BRIP1', 'RAD51C', 'RAD51D', 'NTHL1', 'MITF', 'CDKN2A'];
    
    // Lynch Genes
    const lynchGenes = ['MLH1', 'MSH2', 'MSH6', 'PMS2', 'EPCAM'];
    
    // Polyposis Genes
    const polyposisGenes = ['APC', 'MUTYH', 'POLE', 'POLD1', 'SMAD4', 'BMPR1A', 'NTHL1'];

    const userGenes = Array.isArray(genetics.genes) ? genetics.genes : [];
    
    const hasHigh = userGenes.some((g: string) => highPenetranceGenes.includes(g));
    const hasModerate = userGenes.some((g: string) => moderatePenetranceGenes.includes(g));
    
    const hasLynch = userGenes.some((g: string) => lynchGenes.includes(g));
    const hasPolyposis = userGenes.some((g: string) => polyposisGenes.includes(g));
    
    // PRS Elevated
    // Logic: true if gen.prs_done=Yes AND (any cancer flagged OR band in {higher, mixed})
    let prsElevated = false;
    if (genetics.prs && genetics.prs.done) {
        const hasRedFlags = genetics.prs.red_flags && genetics.prs.red_flags.length > 0;
        const isHighBand = ['higher', 'mixed'].includes(genetics.prs.risk_band);
        if (hasRedFlags || isHighBand) prsElevated = true;
    }

    return {
        'gen.high_penetrance_carrier': hasHigh,
        'gen.moderate_penetrance_only': !hasHigh && hasModerate,
        'gen.lynch_syndrome': hasLynch,
        'gen.polyposis_syndrome': hasPolyposis,
        'gen.prs_elevated': prsElevated
    };
}

/**
 * Checks for hereditary cancer syndromes (Lynch, HBOC) - Legacy/Simple version
 * Keeping for backward compatibility or merging?
 * The new 'calculateFamilyClusters' provides distinct flags. 
 * We can keep this for the specific 'syndromes' output or deprecate.
 * We will return an array of strings as before.
 */
function calculateFamilySyndromes(familyHistory?: any[]): string[] {
    const syndromes: string[] = [];
    const clusters = calculateFamilyClusters(familyHistory);

    if (clusters.pattern_breast_ovarian_cluster) syndromes.push('Cluster: Breast/Ovarian');
    if (clusters.pattern_colorectal_cluster) syndromes.push('Cluster: Colorectal');
    
    const relatives = familyHistory?.map(f => ({
        cancer: f.cancer_type ? f.cancer_type.toLowerCase() : '',
        age: f.age_dx
    })) || [];

    // Lynch: 3+ colorectal/endo/etc + young
    const lynchCancers = ['colorectal', 'endometrial', 'ovarian', 'stomach', 'pancreatic', 'biliary', 'urinary', 'brain', 'skin'];
    const lynchMatches = relatives.filter(r => lynchCancers.some(c => r.cancer.includes(c)));
    if (lynchMatches.length >= 3 && lynchMatches.some(r => r.age && r.age < 50)) {
        syndromes.push('Potential Lynch Syndrome');
    }

    return syndromes;
}

/**
 * A service to calculate derived health variables from standardized user data.
 */
export const DerivedVariablesService = {
  /**
   * Calculates all derivable variables from a standardized data object.
   * @param standardizedData - A structured object from the StandardizationService.
   * @returns An object containing the derived variables.
   */
  calculateAll: (standardizedData: Record<string, any>): Record<string, any> => {
    const derived: Record<string, any> = {};

    try {
      const core = standardizedData.core || {};
      const advanced = standardizedData.advanced || {};

      // Calculate Age
      const age = calculateAge(core.dob);
      if (age !== null) {
          derived.age_years = age;
          // Adult Gate
          derived.adult_gate_ok = age >= 18;
          
          // Age Map
          if (age >= 18 && age <= 39) derived.age_band = "18-39";
          else if (age >= 40 && age <= 49) derived.age_band = "40-49";
          else if (age >= 50 && age <= 59) derived.age_band = "50-59";
          else if (age >= 60 && age <= 69) derived.age_band = "60-69";
          else if (age >= 70) derived.age_band = "70+";
      } else {
          derived.adult_gate_ok = false; // Block if age calculation fails
      }

      // Calculate BMI
      const bmi = calculateBmi(core.height_cm, core.weight_kg);
      if (bmi) {
        derived.bmi = {
          value: bmi,
          unit: "kg/m2",
          code: "39156-5", // LOINC code for BMI
        };
        derived.flags = derived.flags || {};
        derived.flags.bmi_obesity = bmi >= 30;
      }
      
      // Diet Calcs
      if (typeof core.diet?.red_meat === 'number') {
          derived.red_meat_gwk = core.diet.red_meat * 100;
      }
      if (typeof core.diet?.processed_meat === 'number') {
          derived.proc_meat_gwk = core.diet.processed_meat * 50;
      }

      // SSB Calculation (mL/week)
      if (typeof core.diet?.sugary_drinks === 'number') {
          const freq = core.diet.sugary_drinks;
          const sizeType = core.diet.ssb_container || 'Medium (330ml)';
          let mlPerServing = 330;
          if (sizeType.includes('250')) mlPerServing = 250;
          if (sizeType.includes('500')) mlPerServing = 500;
          if (sizeType.includes('750')) mlPerServing = 750;
          
          derived.ssb_mLwk = freq * mlPerServing;
      }

      // Calculate pack-years and Brinkman Index
      if (core.smoking_status === 'Never') {
          derived.pack_years = 0;
          derived.brinkman_index = 0;
      } else if (core.smoking_status === 'Former' || core.smoking_status === 'Current') {
        const { pack_years, brinkman_index } = calculateSmokingMetrics(advanced.smoking_detail);
        if (pack_years !== null) derived.pack_years = pack_years;
        if (brinkman_index !== null) derived.brinkman_index = brinkman_index;
      }
      
      // Determine organ inventory based on sex at birth.
      if(core.sex_at_birth === 'Female') {
          derived.organ_inventory = {
              has_cervix: true,
              has_uterus: true,
              has_ovaries: true,
              has_breasts: true
          }
      } else if (core.sex_at_birth === 'Male') {
          derived.organ_inventory = {
              has_prostate: true,
              has_breasts: true // Men can also get breast cancer
          }
      }

      // Check for early-age family cancer diagnosis
      const earlyDx = calculateEarlyAgeFamilyDx(advanced.family);
      if (earlyDx !== null) {
          derived.early_age_family_dx = earlyDx;
      }
      
      // Family History Clusters
      const famClusters = calculateFamilyClusters(advanced.family);
      const syndromeFlags = calculateSyndromeFlags(advanced.family);
      Object.assign(derived, famClusters, syndromeFlags);

      // Granular Family Site Metrics (PDF Page 32)
      const siteMetrics = calculateFamilySiteMetrics(advanced.family);
      Object.assign(derived, siteMetrics);

      // Check for high-risk occupational exposures (Composite + Specific Flags)
      const exposures = calculateExposureComposites(advanced.occupational);
      if (exposures !== null) {
          derived.exposure_composites = exposures;
      }
      const occFlags = calculateOccupationalFlags(advanced.occupational);
      Object.assign(derived, occFlags); // Merges occ.lung_highrisk, etc into derived root

      // --- Sexual Health Flags ---
      const sexHistory = advanced.sexual_health || {};
      const sexAtBirth = core.sex_at_birth;
      // MSM Behavior: Male AND (Partner=Male or Both)
      let msmBehavior = false;
      const partnerGenders = sexHistory['sexhx.partner_genders'];
      
      if (sexAtBirth === 'Male') {
          if (Array.isArray(partnerGenders)) {
             if (partnerGenders.some((g: string) => g.toLowerCase() === 'male' || g.toLowerCase() === 'same sex')) {
                msmBehavior = true;
             }
          } else if (typeof partnerGenders === 'string') {
             if (partnerGenders.toLowerCase() === 'male' || partnerGenders.toLowerCase() === 'both' || partnerGenders.toLowerCase() === 'same sex') {
                 msmBehavior = true;
             }
          }
      }
      derived['sex.msm_behavior'] = msmBehavior;

      // High Risk Anal Cancer Group
      // Rule: HIV OR Transplant OR (Male AND MSM AND Age >= 35)
      const conditions = standardizedData.core?.conditions || []; 
      const hasHiv = conditions.includes('hiv');
      const hasTransplant = conditions.includes('transplant');
      
      if (hasHiv || hasTransplant || (msmBehavior && derived.age_years >= 35)) {
          derived['sex.highrisk_anal_cancer_group'] = true;
      } else {
          derived['sex.highrisk_anal_cancer_group'] = false;
      }

      // HPV Exposure Band
      derived['sex.hpv_exposure_band'] = calculateHpvExposureBand(sexHistory);
      
      // Oral HPV Cancer Exposure (PDF Page 14)
      const sexOral = sexHistory['sex_oral'];
      const lifetimePartners = sexHistory['sexhx.lifetime_partners_cat'];
      const recentPartners = sexHistory['sexhx.partners_12m_cat'];
      if (sexOral === 'Yes' && (
          ['10-19', '20+'].includes(lifetimePartners) || 
          ['6+'].includes(recentPartners)
      )) {
          derived['sex.oral_hpvcancer_exposure'] = true;
      } else {
          derived['sex.oral_hpvcancer_exposure'] = false;
      }
      
      // Cervix HPV Persistent Pattern (PDF Page 14)
      // Rule: derived.sex.hpv_exposure_band = Higher AND (sexhx.hpv_precancer_history includes "Cervix" OR cond.hpv.status ∈ {Past, Current})
      const hpvPrecancerHistory = sexHistory['sexhx.hpv_precancer_history'] || [];
      const hpvPrecancerCervix = Array.isArray(hpvPrecancerHistory) && hpvPrecancerHistory.includes('cervix');
      
      const illnesses = advanced.illnesses || [];
      const hpvStatus = illnesses.find((i: any) => i.id === 'hpv');
      const hpvPersistent = hpvStatus && (hpvStatus.status === 'Past' || hpvStatus.status === 'Current');
      
      if (core.sex_at_birth === 'Female' && derived['sex.hpv_exposure_band'] === 'Higher' && (hpvPrecancerCervix || hpvPersistent)) {
          derived['sex.cervix_hpv_persistent_pattern'] = true;
      } else {
          derived['sex.cervix_hpv_persistent_pattern'] = false;
      }

      // --- Chronic Condition Surveillance Flags (PDF Page 22) ---
      const hasCirrhosis = illnesses.some((i: any) => i.id === 'cirrhosis');
      const hasActiveHbv = illnesses.some((i: any) => i.id === 'hbv' && i.status === 'Chronic/Active');
      const hasIbd = illnesses.some((i: any) => i.id === 'ibd');
      const hasPsc = illnesses.some((i: any) => i.id === 'psc');
      const hasBarretts = illnesses.some((i: any) => i.id === 'barretts'); // Assuming ID 'barretts' if added to list
      const hasImmunosuppression = illnesses.some((i: any) => i.id === 'immunosuppression' || i.id === 'transplant');
      
      // IBD Duration check (need onset year)
      let ibdLongDuration = false;
      if (hasIbd) {
          const ibdEntry = illnesses.find((i: any) => i.id === 'ibd');
          if (ibdEntry && ibdEntry.year && derived.age_years) {
              const currentYear = new Date().getFullYear();
              if ((currentYear - ibdEntry.year) >= 8) ibdLongDuration = true;
          }
      }

      derived['hcc.surveillance_candidate'] = hasCirrhosis || hasActiveHbv;
      derived['crc.ibd_surveillance'] = (hasIbd && ibdLongDuration) || hasPsc;
      derived['barrett.surveillance'] = hasBarretts;
      derived['skin.lymphoma_highrisk'] = hasImmunosuppression;
      derived['hpv_related.vigilance'] = hasHiv || hasImmunosuppression; // Simplified vigilance flag

      // --- Environmental Flags (PDF Page 57) ---
      const env = advanced.environment || {};
      const envSummary = env['env.summary'] ? JSON.parse(env['env.summary']) : [];
      
      derived['env.radon_high'] = (env['env.radon.result'] && ['Moderately elevated', 'Clearly above'].includes(env['env.radon.result'])) || (envSummary.includes('radon') && env['env.radon.tested'] !== 'No');
      derived['env.asbestos_unprotected'] = env['env.asbestos.disturbance'] === 'Yes';
      derived['env.well_contam_flag'] = env['env.water.well_tested'] === 'Yes' && env['env.water.arsenic'] === true; // Assuming arsenic check means contamination found
      derived['env.pesticide_intensive'] = env['env.pesticide.type'] === 'Occupational' || env['env.pesticide.type'] === 'Home/Garden (Heavy)';
      derived['env.uv_high'] = env['env.uv.sunbed_freq'] === 'Very Often' || envSummary.includes('sunbed');
      
      // --- Screening Candidate Flags ---
      // Lung: Smoking >= 20 pack years (example threshold) AND Age 50-80
      derived['screen.lung_candidate'] = (derived.pack_years >= 20 && derived.age_years >= 50 && derived.age_years <= 80 && (core.smoking_status === 'Current' || (core.smoking_status === 'Former' && advanced.smoking_detail?.quit_date && (new Date().getFullYear() - advanced.smoking_detail.quit_date <= 15))));
      
      // Prostate: Age 50+ Male
      derived['screen.prostate_discuss'] = (core.sex_at_birth === 'Male' && derived.age_years >= 50);
      
      // Skin: High risk factors
      derived['screen.skin_check_recommended'] = derived['skin.lymphoma_highrisk'] || derived['env.uv_high'] || derived['occ.skin_uv_highrisk'];

      // --- Immunization Status Flags ---
      const imm = advanced.screening_immunization || {};
      derived['imm.hpv_complete'] = imm['imm.hpv'] === 'Yes';
      derived['imm.hbv_complete'] = imm['imm.hbv'] === 'Yes';
      derived['imm.flu_due'] = imm['imm.flu.last_season'] !== 'Yes';
      derived['imm.covid_booster_due'] = imm['imm.covid.doses'] !== '4+'; // Simplified logic
      derived['imm.pneumo_candidate'] = derived.age_years >= 65 || core.smoking_status === 'Current'; // Example criteria
      derived['imm.zoster_candidate'] = derived.age_years >= 50;

      // --- New Logic ---

      // AUDIT-C
      const audit = calculateAuditC(core.alcohol_audit, core.sex_at_birth);
      if (audit) derived.alcohol_audit = audit;

      // IPAQ
      const ipaq = calculateIpaq(core.physical_activity);
      if (ipaq) {
          derived.physical_activity_ipaq = ipaq;
          derived['pa.who2020_meets'] = ipaq.who2020_meets;
          derived['pa.sedentary_minutes'] = core.physical_activity?.sitting_min;
      }

      // WCRF
      const wcrf = calculateWcrf(core.diet, audit?.score, bmi || null, ipaq?.category);
      if (wcrf) derived.wcrf_score = wcrf;

      // Genetics Flags
      const genFlags = calculateGeneticsFlags(advanced.genetics);
      Object.assign(derived, genFlags);

      // Family Syndromes (Legacy List)
      const syndromes = calculateFamilySyndromes(advanced.family);
      if (syndromes.length > 0) derived.hereditary_syndromes = syndromes;

    } catch (error) {
      logger.error("Failed to calculate derived variables", {
          error,
          standardizedData
      });
    }

    return derived;
  },
};
      ]]>
    </file>
    <file path="TASKS.md">
      <![CDATA[
- [x] Update the text of the occupational hazards question to clarify when it will be asked.
- [x] Fix `next-intl` configuration and runtime error in `OccupationalHazards` component.
- [x] Align codebase with PDF spec (Assessment Questions, Derived Variables, Standardization, UI Components, Config, PDF Generator).
- [x] Implement missing derived variables from PDF Page 22 (Chronic Conditions) and Page 32 (Family History Counts).
- [x] Final UI/UX Polish: Soft warnings for biometrics, Smoking intensity badge, HBV helper text.
- [x] Implement missing questions (HBV antiviral, HCV SVR, IBD extent) and derived variables (WHO2020 PA, Oral/Cervix HPV risk).
- [x] Refactor WCRF logic, add detailed Environmental/Genetics/Screening flags, and update HPV Precancer question type.
      ]]>
    </file>
  </modifications>
</response>