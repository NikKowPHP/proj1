ONKONO Diagnostic form specification (Mobile‑First, Web-Compatible)
The ONKONO diagnostic form is a mobile-optimized web form that collects personal health data for AI-driven cancer prevention. It is divided into two sections – Core (basic questions for quick entry) and Advanced (optional detailed questions). All questions are available in English and Polish, with support for dynamic conditional logic to only show relevant fields (improving usability on mobile). The form avoids any risk scoring in the UI, focusing instead on generating a personalized screening/diagnostic plan (per project guidelines, no risk scores are displayed).
Localization: Each question label and option is provided in both English and Polish. The UI should allow switching languages seamlessly, and all choices/notes/tooltips should be localized.
Data & Standards: To ensure data consistency for AI processing, fields use standard formats and codes where possible. Dates use ISO 8601 format. Key medical concepts map to standard terminologies: LOINC for measurements, SNOMED CT for categorical findings and HPO for symptoms etc. (examples given per field). This facilitates interoperability and structured output for the AI.
Below are the detailed specifications for Core and Advanced sections, including field properties, logic, values, requirements, implementation notes, and output mappings:
Platforms: Mobile‑first + Web | Languages: EN + PL (i18n) | Submission target: AI processor (backend)
Design Principles (for designers & engineers)
    • Minimal typing, maximal selecting: radios, checkboxes, chips, dropdowns, sliders.
    • Progressive disclosure: Core (fast) → Advanced (optional, collapsible blocks).
    • Sensitivity by design: genetics, sexual and other extra sensitive health blocks are optional and gated by consent/micro‑copy.
    • Accessibility: WCAG 2.1 AA; large hit targets; full keyboard operability; SR labels.
    • Data quality: ISO dates, UCUM units, standardized vocabularies (SNOMED CT, LOINC, HPO, HGNC/HGVS, ISCO‑08).
    • Privacy: granular consents; “Prefer not to answer” + “Unsure” everywhere sensitive.

A) CORE FORM (quick path)
Field Key
Question (EN)
Question (PL)
Type
Options / Allowed Values
Logic (Show When)
Required
Validation (Mobile)
UX Notes
Output Mapping
consent.health
I consent to processing of my health data for recommendations.
Wyrażam zgodę na przetwarzanie danych zdrowotnych w celu zaleceń.
Checkbox
true/false
Always
Yes
Must be checked to submit.
Sticky consent text + link to policy.
consents.health=true
intent
What’s your goal today?
Jaki jest cel dzisiejszego wypełnienia?
Radio
Prevention / I have symptoms / Follow‑up
Always
Yes
One must be selected.
Drives tone of summary.
Enum
source
Who is filling this form?
Kto wypełnia formularz?
Select
Self / Caregiver / Imported
Always
No
—
Provenance
Enum
language
Preferred language
Preferowany język
Select
English / Polski
Always
No
—
i18n locale
Enum
dob
Date of birth
Data urodzenia
Date
ISO‑8601
Always
Yes
No future; adult policy per product.
Numeric date picker
Date (ISO)
sex_at_birth
Sex at birth
Płeć przy urodzeniu
Radio
Female / Male / Intersex / Prefer not
Always
Yes
—
Drives organ‑specific logic.
FHIR AdminGender
gender_identity
Gender identity (optional)
Tożsamość płciowa (opcjonalnie)
Select
Female / Male / Non‑binary / Other
Always
No
—
For respectful care only.
Enum
height_cm
Height (cm)
Wzrost (cm)
Number
50–250
Always
Rec.
Range check
Auto BMI (hidden)
LOINC 8302‑2, cm
weight_kg
Weight (kg)
Waga (kg)
Number
30–300
Always
Rec.
Range check
Auto BMI (hidden)
LOINC 29463‑7, kg
smoking_status
Smoking status
Status palenia
Radio
Never / Former / Current
Always
Yes
—
Triggers Advanced details
SNOMED codes (std.)
alcohol_use
Alcohol consumption
Spożycie alkoholu
Radio
None/rare / Moderate / Heavy
Always
Rec.
—
Tooltip “standard drink”
Enum
diet_pattern
Dietary pattern
Wzorzec żywieniowy
Radio
Balanced / Average / Unhealthy
Always
Opt.
—
One‑tap; quick proxy
Enum
activity_level
Physical activity
Aktywność fizyczna
Radio
Sedentary / Moderate / High
Always
Opt.
—
Brief definitions under labels
Enum
symptoms
Current symptoms (select all) or None
Obecne objawy (wybierz) lub Brak
Checkboxes
Red‑flag list + “None”
Always
Yes*
“None” exclusive; if none then no symptom details.
If any selected → Advanced Symptom Details
HPO codes list
family_cancer_any
First‑degree relative with cancer?
Czy bliscy chorowali na raka?
Radio
Yes / No / Unsure
Always
Opt.
—
If Yes → Advanced Family entries
Flag
* Required in the sense user must choose at least one symptom or “None”.

Legend: Req. = Required (Yes = must answer; Rec. = Recommended but not forced; Opt. = Optional); Default = default value or state if not answered.
Note: Fields marked optional can be left blank in the core form, but missing info may yield a more generic plan. Users are encouraged to fill all core fields for best results


B) ADVANCED FORM (optional blocks)
The Advanced section is optional and collapsible (e.g. behind a “+ Provide more details” button). It gathers extra data for more personalized recommendations. Fields appear based on earlier answers (conditional logic) to keep the UI clean. Users with time and interest can expand and complete these fields. All Advanced questions are optional unless triggered by a Core answer that implies they should be answered.
Note: The form uses conditional display logic extensively to streamline the user experience. For example, female-specific questions are hidden for male users, and follow-ups like menopause age or first-child age appear only when relevant (post-menopause or children present). This keeps the interface uncluttered, especially on mobile screens, and reduces user burden by not asking irrelevant questions.
B1. Symptom Details (only if any symptom selected)
Field Key
EN / PL
Type
Logic
Values
Validation
Output Mapping
symptom[i].code
Symptom / Objaw
Select (search)
For each selected symptom
HPO or SNOMED
—
Code (HPO preferred)
symptom[i].onset
Onset date/period / Początek
Date/Month/Year
—
ISO (partial ok)
Not future
ISO date
symptom[i].severity
Severity 0–10 / Nasilenie
Slider (0–10)
—
0–10
—
Integer
symptom[i].frequency
Frequency / Częstość
Select
—
Daily/Weekly/Intermittent
—
Enum
symptom[i].notes
Associated features / Objawy towarzyszące
Chips
—
HPO chips
—
Codes list

B2. Family Cancer History
Field Key
EN / PL
Type
Logic
Values
Validation
Output Mapping
family[i].relation
Relation / Pokrewieństwo
Select
If family_cancer_any=Yes
Parent / Sibling / Child / GP / Other
—
FHIR rel. code
family[i].cancer
Cancer type / Typ nowotworu
Select (search)
—
Common list + Other
—
SNOMED / ICD‑O
family[i].age_dx
Age at diagnosis / Wiek rozpoznania
Number
—
0–100
Range
Integer
family[i].multi
Multiple primaries? / Wiele nowotworów?
Checkbox
—
true/false
—
Boolean

B3. Genetics (sensitive, optional; separate consent)
Field Name
Question (EN)
Question (PL)
Type
Conditional Logic
Accepted Values / Options
Req.
Implementation Notes (UX/Validation/i18n)
Output / Interop (AI)
genetic_testing_done
Have you ever had genetic testing related to cancer risk?
Czy kiedykolwiek wykonano u Pana/Pani badania genetyczne związane z ryzykiem nowotworów?
Radio
–
Yes / No / Not sure (Tak / Nie / Nie wiem)
Opt.
Short explainer tooltip about “panel test vs single-gene”; keep copy reassuring, sensitive.
Boolean/enum; provenance flag (self_report).
genetic_test_type
What type of genetic test was it?
Jaki to był rodzaj badania genetycznego?
Select
Show if genetic_testing_done=Yes
Multigene panel; Single gene; Exome (WES); Genome (WGS); Other
Opt.
One-tap select; allow “Other” → short text reveal.
Coded as simple enum; optional SNOMED test type if available.
genetic_test_year
In what year was the test performed?
W którym roku wykonano badanie?
Year (YYYY)
If genetic_testing_done=Yes
19xx–20xx
Opt.
Year-only picker on mobile; validate ≤ current year.
Integer year.
genetic_lab
Testing laboratory (if known)
Laboratorium wykonujące test (jeśli znane)
Select + free text
If genetic_testing_done=Yes
Common labs list + “Other”
Opt.
Autocomplete; localize known providers list for PL users.
Text; optional identifier (GLN/CLIA if maintained).
genetic_findings_present
Did the report mention any pathogenic/likely pathogenic variants?
Czy w raporcie wskazano warianty patogenne/prawdopodobnie patogenne?
Radio
If genetic_testing_done=Yes
Yes / No / Don’t know (Tak / Nie / Nie wiem)
Opt.
Brief tooltip explaining P/LP vs VUS.
Enum; true/false/unknown.
genetic_genes
If yes: which genes?
Jeśli tak: które geny?
Multiselect (with search)
If genetic_findings_present=Yes
Common list (BRCA1, BRCA2, MLH1, MSH2, MSH6, PMS2, APC, TP53, PTEN, STK11, PALB2, CDH1, etc.) + search
Opt.
Type-ahead with chip tokens; show gene symbol + full name; allow multiple.
HGNC gene symbols; array of strings.
genetic_variants_hgvs
Variant(s) (HGVS, optional)
Wariant(y) (HGVS, opcjonalnie)
Text (chips)
If genetic_findings_present=Yes
Free text per variant
Opt.
Optional expert field; validate minimal HGVS pattern if provided.
Text; pass-through to backend; can be placed into Phenopackets.
genetic_vus_present
Any VUS (Variants of Uncertain Significance)?
Czy występują warianty o niepewnym znaczeniu (VUS)?
Radio
If genetic_testing_done=Yes
Yes / No / Don’t know
Opt.
Tooltip clarifies “no clinical action on VUS.”
Enum.
genetic_report_upload
Upload genetic report (optional)
Prześlij raport genetyczny (opcjonalnie)
File upload (PDF/JPG)
If genetic_testing_done=Yes
Max size (e.g., 10 MB)
Opt.
Localize file picker; show privacy notice; on mobile allow camera scan.
File pointer + MIME; stored separately from structured fields.
genetic_processing_consent
I consent to processing of genetic data for personalized recommendations
Wyrażam zgodę na przetwarzanie danych genetycznych w celu personalizacji zaleceń
Checkbox
If any genetic field touched
–
Yes for submit of genetics
Separate, explicit consent; required only to submit genetics (not whole form).
Consent flag with timestamp.
Coding guidance (Genetics):
    • Use HGNC symbols for genes; where applicable, map syndromes (e.g., Lynch) to SNOMED/OMIM on backend.
    • If you already use GA4GH Phenopackets, populate interpretations.variants with HGVS; attach report as files.
    • Store “unknown” explicitly (not null) to help AI reason about uncertainty.
Interoperability: Genes → HGNC; variants → HGVS; package via Phenopackets if available.
women_section – Female-specific fields below are only shown if gender = Female (Kobieta).

menopause_status
Have you undergone menopause?
Czy jest Pani po menopauzie?
Single-select (Radio)
Visible if gender = Female
Options: Yes (Tak); No (Nie); N/A (Nie dotyczy – e.g. too young)
Opt.
–
Female users indicate if they are post-menopausal. If unsure (e.g. due to hysterectomy), they can choose based on whether ovaries are functional; “N/A” can cover cases like pre-teen users (unlikely here) or those on hormonal meds that complicate status. If “Yes,” the next question menopause_age appears. If “No,” that question is skipped.
Store as a boolean value or categorical (Yes/No). No direct coding needed, but could map “Postmenopausal status” to a code (e.g. SNOMED CT 449934004) if needed for AI.
menopause_age
If yes: at what age did menopause occur?
Jeśli tak: w jakim wieku wystąpiła menopauza?
Number (years)
Visible if menopause_status = Yes
30–60 (approx range)
Opt.
–
Ask age at last menstrual period (or menopause). This helps refine breast cancer risk. Use a number input (two digits). If user doesn’t recall exactly, an estimate is fine. Only appears for post-menopausal women.Validate range (e.g. if <30 or >60, maybe warn for possible error).
Store as integer (years). The AI might use this (early menopause <45 vs late >55 has different implications). No specific code; incorporate as a numeric attribute.
had_children
Have you given birth to any children?
Czy urodziła Pani dziecko/dzieci?
Single-select (Radio)
Visible if gender = Female
Options: Yes (Tak); No (Nie)
Opt.
–
Asks female users if they have ever given birth (parity). If “Yes,” then first_child_age will be shown. If “No,” that field is skipped.com. This information influences risk (e.g. having no children (nulliparity) can slightly raise certain cancer risks).
Internally store as boolean. Could be coded as “Nulliparous” vs “Multiparous” status if needed (e.g. SNOMED has obstetric history codes), but not critical to code beyond using in risk logic.
first_child_age
If yes: age at birth of first child
Jeśli tak: wiek przy urodzeniu pierwszego dziecka
Number (years)
Visible if had_children = Yes
Teenage to 50s (numeric range)
Opt.
–
If the user has children, ask how old they were at the time of their first delivery. Use a number input (years of the mother’s age). If multiple children, only the first birth age matters most for risk. Validate it’s > roughly 12 and < current age. This detail refines breast/ovarian risk estimation (e.g. first child after 30 vs before 20).
Store as integer (years). No specific standard code; use in risk algorithms.
hrt_use
Have you ever used hormone replacement therapy (HRT)?
Czy stosowała Pani hormonalną terapię zastępczą (HTZ)?
Single-select (Radio)
Visible if gender = Female AND likely age >40 (or if menopausal = Yes)
Options: Never (Nigdy); Previously (W przeszłości); Currently (Obecnie)
Opt.
–
Applicable to women (especially post-menopausal). This asks if the user has used HRT for menopause symptoms. Options allow distinguishing current vs past use (duration is not separately asked, but could be noted in tooltip: “long-term HRT >5 years has higher impact”). This question may be shown only if the user’s age or menopause status suggests relevance (e.g. a 30-year-old female likely hasn’t, so it could remain hidden until she indicates menopause or is over a certain age). Not required, but useful for risk adjustment (HRT can slightly increase breast cancer risk).
Map to codes if needed: e.g. SNOMED CT has “History of HRT” or use a medication/therapy code. For AI, treat as categorical: never/ever use. If “Currently” or “Previously” is selected, that’s a positive history of HRT use.


B4. Personal Medical History (non‑cancer illnesses)
Field Key
EN / PL
Type
Logic
Values (grouped chips)
Output Mapping
illness_any
Any chronic illnesses?
Radio
—
Yes/No
Boolean
illness_list[]
Select known conditions
Multiselect
if any=Yes
Metabolic (DM, obesity); Cardio (HTN, CAD); GI/Liver (IBD, pancreatitis, cirrhosis); Respiratory (COPD); Immune (autoimmune, transplant/immunosuppression); Infections (HBV, HCV, HIV, HPV, H. pylori, EBV, HHV‑8); Other
SNOMED CT codes
illness[i].year
Diagnosis year
Year
per selected
YYYY
Year
illness[i].status
Status
Radio
per selected
Active/Resolved
Enum
illness[i].confirmed
Clinician‑confirmed?
Radio
per selected
Yes/No
Enum
illness[i].meds_note
Relevant meds
Short text
optional
Free text
Text

B5. Personal Cancer History & Treatments
Field Key
EN / PL
Type
Logic
Values
Output Mapping
cancer_any
Ever diagnosed with cancer?
Radio
—
Yes/No
Flag
cancer[i].type
Cancer type
Select (search)
if any=Yes
Common list + Other
SNOMED / ICD‑O
cancer[i].year_dx
Year diagnosed
Year
—
YYYY
Year
cancer[i].treatments[]
Treatments received
Checkboxes
—
Surgery / Chemo / Radio / Immuno / Targeted / Hormonal
SNOMED procedures
cancer[i].last_followup
Last follow‑up year
Year (opt.)
—
YYYY
Year

B6. Screening & Immunization History
Field Key
EN / PL
Type
Logic (age/sex aware)
Values
Output
screen.colonoscopy.done
Colonoscopy ever?
Radio
≥45y or risk
Yes/No
Flag
screen.colonoscopy.date
Last colonoscopy date
Date/Year
if done=Yes
ISO
Date
screen.mammo.done/date
Mammogram ever/last date
Radio + Date
Female; age rules
Yes/No + Date
Flags + Date
screen.pap.done/date
Pap/HPV ever/last date
Radio + Date
Female; age rules
Yes/No + Date
Flags + Date
screen.psa.done/date
PSA ever/last date
Radio + Date
Male; age rules
Yes/No + Date
Flags + Date
imm.hpv
HPV vaccination
Radio
Always
Yes/No/Unsure
Flag
imm.hbv
HBV vaccination
Radio
Always
Yes/No/Unsure
Flag

B7. Medications / Iatrogenic
Field Key
EN / PL
Type
Logic
Values
Output
immunosuppression.now
Currently immunosuppressed?
Radio
—
Yes/No/Unsure
Enum
immunosuppression.cause
If yes: cause/med
Short text
if now=Yes
Free text
Text
female.hrt_use
HRT use
Radio
sex_at_birth=Female
Never/Past/Current
Enum

B8. Sexual Health (Sensitive; Optional; Collapsed)
History
Field Key
EN / PL
Type
Logic
Values
Output
sex.active
Currently sexually active?
Radio
—
Yes/No/Prefer not
Enum
sex.partner_gender[]
Gender of partners
Chips
if active=Yes
Male/Female/Other/Prefer not
Enums
sex.lifetime_partners
Lifetime partners (range)
Select
if active=Yes
1 / 2–4 / 5–9 / 10+ / Prefer not
Ordinal
sex.last12m_partners
Partners in last 12 months
Select
if active=Yes
0 / 1 / 2–4 / 5+ / Prefer not
Ordinal
sex.barrier_freq
Condom/barrier use
Radio
if active=Yes
Always/Sometimes/Never/Prefer not
Ordinal
sex.sti_history[]
STI ever diagnosed
Chips
if active=Yes
HPV, Genital warts, Chlamydia, Gonorrhea, Syphilis, HIV, HBV, HCV, Other, None, Prefer not
SNOMED where possible
Practices (Optional sub‑block)
Field Key
EN / PL
Type
Values
Notes
Output
sex.anal
Anal intercourse?
Radio
Yes/No/Prefer not
Screening proxy (anal HPV)
Enum
sex.oral
Oral sex?
Radio
Yes/No/Prefer not
Oropharyngeal HPV risk proxy
Enum
sex.barriers_practices
Barrier use in practices
Radio
Always/Sometimes/Never/Prefer not
Generalized to keep it light
Ordinal


Coding guidance (Medical History):
    • Conditions: store each with a SNOMED CT code + minimal attributes (year, status).
    • Cancers: prefer SNOMED CT or ICD-O-3 site/histology; keep treatments as categorical arrays.
    • Procedures/organ removal: SNOMED procedures where feasible; also set boolean capabilities (e.g., has_cervix=false) to gate screening UI.
    • Infections: record as condition flags with confirmation status (self-reported vs clinician-confirmed).
    • Keep explicit “unknown/unsure” enums rather than nulls to help AI reason about uncertainty.

Micro-copy (EN/PL) & UX notes
    • Progressive disclosure: Genetics and Illnesses each live in their own collapsible card.
    • Tiny keyboards: prefer year pickers, radio, and chips over free text.
    • Consent gating: genetics fields require separate checkbox before submission of that subset.

Output & Interoperability (recap for these modules)
    • Dates: ISO-8601; year-only accepted where applicable (store as YYYY or YYYY-01-01 with precision flag).
    • Terminologies:
        ◦ Genes: HGNC symbols; optional HGVS for variants.
        ◦ Conditions/Cancers/Procedures/Infections: SNOMED CT (primary), with optional ICD-O-3 for cancers.
    • FHIR alignment (optional backend mapping):
        ◦ Condition (chronic illnesses, cancers, infections),
        ◦ Procedure (surgeries, organ removal),
        ◦ Observation (genetic findings as coded observations if not using Genomics IG),
        ◦ mCODE profiles where applicable; GA4GH Phenopackets for genetics payloads.

B9. Occupational Hazards (Optional; Collapsed)
Field Name
Question (EN)
Question (PL)
Type
Conditional Logic
Accepted Values / Options
Req.
Default
Implementation Notes (UX/Validation/i18n)
Output / Interop (AI)
employment_status
What is your current employment status?
Jaki jest Pana/Pani obecny status zatrudnienia?
Radio
–
Employed / Self‑employed / Unemployed / Student / Retired
Opt.
–
One‑tap radios; used only to tailor what follows.
Enum.
job_history_enable
Add work/occupation details (optional)
Dodać szczegóły dotyczące pracy/zawodu (opcjonalnie)
Toggle
–
On/Off
Opt.
Off
Collapsible card; keep clearly optional.
Boolean.
job_entries
Jobs & exposures (repeatable)
Stanowiska i ekspozycje (powtarzalne)
Repeating group
Show when job_history_enable=On
One entry per job (last 10–15 yrs or longest‑held): fields below
Opt.
–
Mobile “Add another job” pattern; per‑entry mini‑card.
Array of objects.
job_title
Job title (pick closest)
Nazwa stanowiska (wybierz najbliższą)
Searchable select
In job_entries
ISCO‑08 major groups + common roles (e.g., Welder, Miner, Nurse, Driver, Mechanic, Hairdresser, Painter, Farmer, Firefighter, Radiology tech, Construction worker, Shipyard worker, Dry‑cleaner, Rubber industry, Night‑shift worker)
Opt.
–
Type‑ahead with grouped suggestions; choosing a job can pre‑suggest exposures (see JEM note below).
Store ISCO‑08 code if available; text label otherwise.
job_years
Years in this job (approx.)
Lata w tym zawodzie (w przybliżeniu)
Number (integer)
In job_entries
0–50
Opt.
–
Accept rough estimates; numeric keypad on mobile.
Integer (years).
job_shift_pattern
Regular night shifts?
Regularne zmiany nocne?
Radio
In job_entries
Never / Occasionally / Frequently (e.g., ≥3 nights/month) / Prefer not to say
Opt.
–
Neutral language; optional because sensitive.
Ordinal bucket.
ppe_usage
Protective equipment used at work
Stosowane środki ochrony indywidualnej
Multi‑select (chips)
In job_entries
Respirator; Local exhaust; Gloves; Eye/face protection; Protective clothing; None; Not applicable
Opt.
–
Chips; if “None” selected, clear others.
Booleans per item (PPE).
occ_exposures
Known exposures in this job (select all)
Znane ekspozycje w tej pracy (zaznacz wszystkie)
Multi‑select (chips)
In job_entries
Dusts/Fibers: Asbestos; Silica; Wood dust. Fumes/Particulates: Diesel exhaust; Welding fumes/UV; Soot/PAHs. Chemicals/Solvents: Benzene; Formaldehyde; Perchloroethylene (dry cleaning); Pesticides; Aromatic amines; 1,3‑Butadiene; Others. Radiation/UV: Ionizing radiation; High UV (outdoor).
Opt.
–
Keep concise, grouped; short info‑icons; allow “Other” → short text.
Map each to SNOMED CT “Exposure to [agent]” where possible; keep an internal IARC‑style hazard tag for AI rules.
occ_exposure_duration
Approx. years exposed (sum)
Przybliżona liczba lat ekspozycji (suma)
Number
Show if any occ_exposures picked
0–50
Opt.
–
If multiple hazards, one overall duration is fine for mobile.
Integer (years).
occ_exposure_intensity
Intensity of exposure
Nasilenie ekspozycji
Radio
Show if any occ_exposures picked
Low / Moderate / High / Unsure
Opt.
Unsure
Simple ordinal scale; keep user burden low.
Ordinal.
occ_radiation_badge
Worked with radiation badge monitoring?
Praca z dozymetrem (promieniowanie)?
Radio
In job_entries OR shown if occ_exposures includes ionizing radiation
Yes / No / Unsure
Opt.
–
If Yes, optionally ask approximate annual doses in notes (free text).
Boolean; optional text note.
Developer notes (Occupational):
    • JEM assist (backend): When a user selects a job title, auto‑suggest likely exposures (Job‑Exposure Matrix). Keep editable.
    • Minimal viable input: job title + “any exposures?” → yes/no + duration bucket.
    • No free text unless “Other” is chosen, to keep data structured.
    • Interoperability: prefer ISCO‑08 for job codes; exposures as SNOMED CT where available; keep an internal hazard enum for AI.
    • FHIR mapping (optional): Observation (exposure), Occupation as Patient.occupation extension; or store in a custom exposure resource for the AI pre‑processor.
    • Backend note: Use a Job‑Exposure Matrix to auto‑suggest exposures after title selection; keep editable.

B10. Environmental & Residential Exposures (Optional; Collapsed)
Field Key
EN / PL
Type
Logic
Values
Output
home.years_here
Years at current residence
Number
—
0–50
Int
home.postal_coarse
Postal code (first part only)
Masked text
—
e.g., “01‑1xx”
Coarse token
home.year_built
Year building constructed
Year
—
1900–current
Year/Unknown
home.basement
Basement present?
Radio
—
Yes/No/Unsure
Enum
home.radon_tested
Home tested for radon?
Radio
—
Yes/No/Unsure
Enum
home.radon_value
Radon result + unit
Number + Unit
if tested=Yes
value + (Bq/m³ or pCi/L)
Numeric + UCUM unit
home.radon_date
When tested
Date/Year
if tested=Yes
ISO (YYYY or YYYY‑MM)
Date
home.shs_home
Secondhand smoke at home
Radio
—
Never/Occasionally/Frequently/Unsure
Ordinal
home.fuels[]
Cooking/heating fuels
Chips
—
Electricity, Natural gas, Coal, Wood/biomass, Oil, District heat, Other
Enums
home.kitchen_vent
Ventilation when cooking
Radio
if fuels include gas/biomass
Always/Sometimes/Never/Not available
Ordinal
env.major_road
Distance to major road
Select
—
<50 / 50–100 / 100–300 / >300 m / Unsure
Ordinal
env.industry[]
Heavy industry within ~5 km
Chips
—
None, Refinery, Chemical plant, Smelter/Foundry, Power plant, Incinerator, Other, Unsure
Enums
env.agriculture
Adjacent to large farmland
Radio
—
Yes/No/Unsure
Boolean/Unknown
env.outdoor_uv
Prolonged outdoor activity
Radio
—
Rarely / Some days / Most days
Ordinal
water.source
Drinking water source
Radio
—
Municipal / Private well / Bottled only / Other / Unsure
Enum
water.well_tested
Private well tested (12m)?
Radio
if source=Private well
Yes/No/Unsure
Enum
water.well_findings[]
Findings (if known)
Chips
if well_tested=Yes
Arsenic, Nitrates, Other
Enums
env.wildfire_smoke
Wildfire smoke exposure
Radio
region‑dependent
Never/Occasional/Frequent/Unsure
Ordinal

Developer notes (Environmental):
    • Privacy first: use coarse postal code only; clearly state it’s optional and for environmental context.
    • Units: radon accept Bq/m³ or pCi/L; store both value and unit, and normalize server‑side to a canonical unit.
    • Buckets > precision: distance and frequency buckets keep the UI simple and reduce error on mobile.
    • Interoperability: map hazards to internal environmental risk flags; exposures may be represented as SNOMED “exposure to [factor]” where specific.
    • FHIR (optional): store as Observation (environmental exposure) and Observation.component for value + unit (e.g., radon).

How to ask?
    • Optional, collapsed cards titled “Work & Environmental Exposures (optional)” / „Ekspozycje zawodowe i środowiskowe (opcjonalne)”.
    • Neutral micro‑copy: “These questions are optional and help tailor prevention advice (e.g., when screening might be more relevant).” / „Pytania są opcjonalne i pomagają dopasować zalecenia profilaktyczne (np. kiedy badania przesiewowe są szczególnie zasadne).”
    • “Prefer not to answer” wherever sensitive; explicitly allow Unsure/Not sure.
    • Pre‑filled suggestions (JEM) based on job title to reduce cognitive load; always editable.
    • Minimal typing: chips, radios, range buckets, year‑only inputs; numeric keypad on mobile.
    • Clear privacy note near postal code and radon fields; reinforce that no exact addresses are stored.

Interop & AI processing (recap)
    • Jobs: store ISCO‑08 code + years + shift pattern (ordinal).
    • Exposures: boolean flags + duration (years) + intensity (Low/Mod/High/Unsure). Map where possible to SNOMED CT exposure concepts; also keep internal hazard categories (asbestos, silica, diesel, welding fumes/UV, benzene, formaldehyde, pesticides, PAHs, ionizing radiation, etc.).
    • Environmental: radon numeric + unit (+ test date precision), coarse postal token, distance buckets, industry types, water source, cooking fuel + ventilation, secondhand smoke, outdoor UV.
    • Storage: keep explicit unknown/unsure enums (not null) to let AI reason about uncertainty.
    • No risk scores in UI; the AI uses these flags to adjust screening recommendations (e.g., consider low‑dose CT for certain profiles, prioritize HPV testing, amplify skin protection advice), not to display percentages.


B11. Labs & Imaging (Optional)
Field Key
EN / PL
Type
Values
Output
labs.*
Key labs (CBC, ferritin, ALT/AST/bilirubin, creatinine, TSH, PSA, CA‑125, CEA…)
Number + unit
Units fixed; range checks
LOINC codes + UCUM units
imaging.last[]
Imaging studies
Chips + date + result bucket
X‑ray / US / CT / MRI / PET; Date; Result: No findings / Indeterminate / Significant
Procedure/Imaging summary

B12. Functional Status & QoL (Optional)
    • ecog: ECOG 0–4 (radio)
    • qlq_c30: EORTC QLQ‑C30 items (Likert; optional)

B14. Cross‑cutting Metadata (auto/back‑office)
    • Confidence of answer (sure/unsure/told by clinician) per block (optional toggle).
    • Missing vs refusal (unknown vs prefer‑not) captured explicitly.
    • Timestamps, form version, device info (tech metadata).

C) Validation & Data Quality Rules (high‑level)
    • Dates: ISO‑8601; not in future; allow year‑only for historical medical events.
    • Units: UCUM (cm, kg, Bq/m³, pCi/L). Normalize radon to canonical (e.g., Bq/m³) server‑side and keep raw + unit.
    • Ranges: Height 50–250 cm; Weight 30–300 kg; Symptom severity 0–10; Exposure years 0–50; Age at Dx 0–100.
    • Consistency:
        ◦ If smoking_status=Never ⇒ derived pack_years=0.
        ◦ Organ inventory gates screening (e.g., no cervix ⇒ Pap N/A).
        ◦ “None” options are exclusive in a multi‑select set.
    • Sensitivity: Genetics requires consent.genetics=true to persist any genetics fields; Sexual Health is optional with “Prefer not”.

D) Interoperability & Output (AI submission)
Coding systems
    • SNOMED CT: conditions, procedures, exposures (where available).
    • LOINC: labs/measurements (height, weight, analytes), survey items where used.
    • HPO: symptoms (preferred).
    • HGNC/HGVS: genes/variants (genetics).
    • ISCO‑08: occupations.
    • UCUM: all measurement units.
    • ISO‑8601: dates/times.
FHIR alignment (optional, backend)
    • Patient (admin gender, identifiers); Observation (vitals, labs, radon),
    • Condition (chronic illnesses, cancers, infections),
    • Procedure (surgeries, imaging), FamilyMemberHistory,
    • Immunization (HPV/HBV), MedicationStatement (if tracked).
    • Oncologic core → mCODE where applicable.
    • Genomics payload → GA4GH Phenopackets (phenotypes + variants + files).
Nulls vs Unknowns
    • Use explicit enums: unknown and prefer_not (do not collapse to null).
Derived variables (server‑side)
    • age_years (from DOB), bmi, pack_years (= cigs/day ÷ 20 × years),
    • organ‑inventory flags (e.g., has_cervix), early‑age family Dx flags, exposure composites, “screening‑due” flags.

E) Field Naming & i18n
    • Field keys: snake_case, stable, no spaces (e.g., family[i].age_dx).
    • Options: Store code + localized label; use i18n dictionaries:
        ◦ label.en, label.pl, help.en, help.pl, options[].label.en/pl.
    • Examples of i18n entry:
    • {
    •   "key": "smoking_status",
    •   "label": { "en": "Smoking status", "pl": "Status palenia" },
    •   "options": [
    •     {"value":"never","label":{"en":"Never","pl":"Nigdy"}},
    •     {"value":"former","label":{"en":"Former","pl":"W przeszłości"}},
    •     {"value":"current","label":{"en":"Current","pl":"Obecnie"}}
    •   ]
    • }

F) Submission Payload (to AI processor)
Envelope
{
  "version": "1.0",
  "locale": "en-PL",
  "provenance": { "source": "self", "timestamp": "2025-09-13T10:20:00Z" },
  "consents": { "health": true, "genetics": false, "share_with_clinician": true },
  "core": { /* minimal fields */ },
  "advanced": { /* optional modules present */ },
  "derived": { /* server-side derived variables */ },
  "coding_systems": ["SNOMED_CT","LOINC","HPO","HGNC","UCUM","ISO8601","ISCO08"]
}
Example (truncated)
{
  "core": {
    "dob": "1982-05-14",
    "sex_at_birth": "female",
    "height_cm": 168,
    "weight_kg": 65,
    "smoking_status": "former",
    "alcohol_use": "moderate",
    "symptoms": ["HP:0001824"],  // weight loss (HPO)
    "family_cancer_any": "yes"
  },
  "advanced": {
    "smoking_detail": {"years": 12, "cigs_per_day": 20, "quit_year": 2018},
    "family": [
      {"relation":"mother","cancer_code":"SNOMED:254837009","age_dx":44}
    ],
    "genetics": {
      "tested": true,
      "type": "panel",
      "year": 2022,
      "findings": {"genes":["BRCA1"], "vus": false}
    },
    "illnesses": [
      {"code":"SNOMED:235595009", "year": 2015, "status":"active", "confirmed":true}
    ],
    "occupational": [
      {"isco":"7223", "title":"Welder", "years":10, "exposures":["welding_fumes","uv"], "intensity":"high"}
    ],
    "environment": {
      "radon_tested": "yes",
      "radon_value": {"value": 180, "unit": "Bq/m3"},
      "radon_date": "2023-04",
      "near_major_road": "<50m"
    },
    "sexual_health": {
      "active":"yes",
      "partner_gender":["male"],
      "barrier_freq":"sometimes",
      "sti_history":["HPV","chlamydia"]
    }
  },
  "derived": {
    "age_years": 43,
    "bmi": 23.0,
    "pack_years": 12.0,
    "has_cervix": true
  }
}

G) UI & Flow Notes (mobile‑first)
    • Core page (≤ 2–3 minutes): consents → intent → demographics → lifestyle → symptoms (with “None”) → family history yes/no.
    • Advanced hub (collapsible cards): Symptoms • Family • Genetics • Illnesses • Cancer history • Screening & immunization • Meds/Iatrogenic • Sexual health (sensitive) • Occupational • Environmental • Labs/Imaging • Function/QoL • Preferences.
    • Safety banner triggers (informational, not diagnostic): e.g., hemoptysis, melena, acute neuro deficit, dramatic weight loss → show “Please consider prompt medical attention.”
    • “Prefer not to answer” and “Unsure” everywhere sensitive; never block submission because of sensitive items.


H) Design and Implementation Notes
    • Mobile-First UI: The form is designed to be easily usable on smartphones and tablets. Use single-column layouts, large touch-friendly inputs, and minimize typing where possible (prefer selectable options).a mobile-friendly survey ensures users can complete the form on any device, improving completion rates. The mobile layout should be just as smooth as desktop, with no horizontal scrolling and clear visibility of each question. Consider progressive disclosure (showing one question at a time or section by section) on mobile to avoid overwhelming the user.
    • Internationalization: Implement all text via i18n resource files so that English/Polish labels and options can be switched. Polish translations should respect formal vs informal tone appropriately (the form above uses a mix of Pan/Pani for formality). Ensure date pickers and number formats adapt to locale as needed, but data is stored in standardized formats (e.g., always ISO dates).
    • Conditional Logic & Navigation: Leverage conditional display logic to simplify the form. Fields that depend on others should remain hidden until needed. For example, asking menopause age only if the user is post-menopausal, or first child age only if the user has children. Use show/hide animations or accordions to make this clear. On a multi-step workflow, you could have the Core questions on one page and then Advanced on subsequent pages or an expandable section. If the user skips Advanced, the form can still be submitted with Core data alone.
    • Validation & Accessibility: Provide client-side validation with user-friendly messages (e.g. “Please enter a valid date”). Use accessible labels and instructions (each field should have a programmatically associated label for screen readers). Tooltips or info icons should be keyboard accessible and not rely solely on hover. Color contrast for text and controls must meet WCAG guidelines. For users with limited literacy, consider adding short explanations under complex questions in simpler language.
    • Defaults and Skipping: By default, optional fields are considered “no” or “none” if left blank (as noted in the table). The system should treat unanswered optional fields conservatively (i.e. assume no risk factor present unless indicated). Required fields are minimal (DOB, sex, maybe symptom selection) to allow quick completion. Core section could have a progress indicator for user confidence.
    • Data Handling: All collected data should be stored in a structured format. Use standard codes as outlined (LOINC, SNOMED CT, HPO, etc.) in the backend representation so that the AI module can easily interpret inputs. For example, store smoking status as a code rather than free text. and store measurements with units. Dates should be stored in ISO format and, if possible, converted to age where relevant for the AI.
    • No Risk Scoring in UI: In line with project guidelines, do not display any risk score or percentage to the user. The form’s purpose is to gather information for generating a personalized plan, not to alarm the user with risk metrics. Any risk calculations happen behind the scenes for AI use only. The UI will present actionable recommendations (e.g. “It’s time for a screening test X”) rather than numeric risk estimates.
    • Streamlined Experience: The separation into Core and Advanced supports users with different time availability. Make it clear that the Advanced section is optional (“Provide more information to further personalize your plan (optional)”). Possibly allow saving progress or marking certain sections to return later, since the form is comprehensive. On mobile, a user might complete core now and advanced later.
    • Consistency: Ensure consistent units (height in cm, weight in kg, volumes in standard drinks, etc.) and clarify them on the form. Use placeholder text to show examples (e.g. “e.g. 170 cm” in height field). Also maintain consistent formatting of options (e.g. use of capital letters, punctuation in all options similarly).
    • Privacy and Encouragement: Some questions are sensitive (e.g. smoking, family history). Remind users their data is private and used only to help them (possibly via a short note at start). Encourage honesty for best results. Also, because the form is long, consider motivators: show a completion percentage or section count (“Step 1 of 2”) to encourage finishing. The mobile-friendly design and logical flow will help reduce drop-off. 
    • Testing: Thoroughly test the conditional logic paths (e.g. a female user who is premenopausal shouldn’t see menopause age, a male user should not see female questions at all, etc.). Also test on various screen sizes to ensure readability (paragraphs 3-5 sentences max as in this spec, bullet points for options, etc., contribute to clarity).
    • Output for AI: The final output from the form should be a well-structured profile of the user. For each field, the back-end should generate an entry, often with standardized codes (for example, an output JSON might include "smoking_status": "449868002" meaning current smoker.  or "symptoms": ["HP:0001824"] for weight loss). Date of birth should be converted to age in years when evaluating guidelines. All timestamps should use ISO formats. By using internationally recognized vocabularies (LOINC for observations). SNOMED CT for clinical concepts, HPO for symptoms, the AI engine can more easily match user data to medical knowledge.
This comprehensive specification ensures the ONKONO form collects a rich set of personal health data in a user-friendly way. By splitting into Core and Advanced, it respects the user’s time while allowing depth when available. The conditional logic and mobile-first design will make the form less intimidating and more accessible, encouraging completion and thereby enabling the AI to craft an effective personalized cancer prevention plan
Implementation Checklist
    • i18n resources for all labels/options/tooltips (EN/PL).
    • Conditional show/hide logic wired for sex/age/symptom‑driven blocks.
    • Validation: ranges, date logic, exclusive “None”, unit handling.
    • Genetics consent gate enforced.
    • Radon unit normalization (Bq/m³ canonical) and unit retention.
    • Occupation → exposure suggestions (JEM) editable by user.
    • Accessibility audit (WCAG 2.1 AA); keyboard + SR testing.
    • Payload conforms to schema; unknown vs prefer_not preserved.
    • No risk scores shown to user; AI returns recommendations, not percentages.


