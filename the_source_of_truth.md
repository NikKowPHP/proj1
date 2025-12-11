ONKONO Diagnostic form specification (Mobile-First, Web-Compatible)
The ONKONO diagnostic form is a mobile-optimized web form that collects personal health data for AI-driven cancer
prevention. All questions and descriptions are available in English and Polish, with support for dynamic conditional logic to only
show relevant fields (improving usability on mobile). The form avoids any risk scoring in the UI, focusing instead on generating a
personalized screening/diagnostic plan (per project guidelines, no risk scores are displayed).
Localization: Each question label and option as well as all descriptions and micro texts are provided in both English and Polish.
The UI should allow switching languages seamlessly, and all choices/notes/tooltips should be localized.
Data & Standards: To ensure data consistency for AI processing, fields use standard formats and codes where possible. Dates
use ISO 8601 format. Key medical concepts map to standard terminologies: LOINC for measurements, SNOMED CT for
categorical findings and HPO for symptoms etc. (examples given per field). This facilitates interoperability and structured output
for the AI.
Platforms: Mobile-first + Web
(backend)
|
Languages: EN + PL (i18n)
|
Submission target: advanced thinking pro AI processor
Design Principles (for designers & engineers)
•
•
•
•
•
•
No free text typing by the user – only selections: radios, checkboxes, chips, dropdowns, sliders.
Progressive disclosure: core → advanced (optional, collapsible blocks).
Sensitivity by design: genetics, sexual and other extra sensitive health blocks are optional and gated by
consent/micro-copy.
Accessibility: WCAG 2.1 AA; large hit targets; full keyboard operability; SR labels.
Data quality: ISO dates, UCUM units, standardized vocabularies (SNOMED CT, LOINC, HPO, HGNC/HGVS,
ISCO-08).
Privacy: granular consents; “Prefer not to answer” + “Not sure” everywhere sensitive.
Basic Information
Field Key
Question (EN)
Question (PL) Type
Options / Logic
Allowed (Show Required
Values
When)
Validation
(Mobile)
UX Notes
Output Mapping
I consent to
processing of my
consent.health
health data for
recommendations.Wyrażam
zgodę na
przetwarzanie
Always
danych
Checkbox true / false (first
Yes
zdrowotnych w
step)
celu
przygotowania
zaleceń.Sticky, short
Must be
consent text
checked to
with link to full
proceed to the privacy notice;
questionnaire. keep copy
If false, block aligned with
navigation and “inform, don’t
show neutral
diagnose”
info (“You can messaging and
close the app anonymous,
at any time”). session-only
processing.
dobISO-8601
year
(YYYY-).
Date
Allowed
(YYYY) – from 1900
Data urodzenia
Always Yes
„year-only to ...
accepted” today,
subject to
min-age
gate.Show a small
No future
age chip once
years; min age
valid (e.g. “Age:
per product
43 years”), no JSON: dob as ISO date. If
config (default
separate “age” year-only, store YYYY-01-01
adult ≥18y).
question. If
and keep a “precision: year”
Optional soft
under min age, flag in metadata.
check age
show gentle
FHIR: Patient.birthDate.
≤120y. Native
message and
Derived: derived.age_years,
date picker
stop plan
derived.age_band,
where
generation
derived.adult_gate_ok.
available;
(“This tool is
numeric
currently for
fallback.
adults”).
sex_at_birth
Date of birth
Sex at birth
Płeć przy
urodzeniu
Radio
(chips)
Female /
Male /
Intersex / Always Yes
Prefer not
to say
Short helper:
“Potrzebujemy
One option
tej informacji,
must be
aby dobrać
selected. Treat właściwe
“Prefer not to badania (np.
say” as
piersi, jajników,
unknown for
prostaty). Jeśli
downstream
wolisz nie
rules.
podawać,
wybierz ‘Wolę
nie podawać’.”
consents.health = true/false
and ephemeral FHIR Consent
resource (category:
healthcare, purpose-of-use:
care); not persisted in DB.
JSON: sex_at_birth enum.
FHIR: Patient.gender
(female/male/other/unknown)
with extension noting “sex
assigned at birth” where
supported. Drives
organ-specific rules
(breast/cervix/prostate).Field Key
Question (EN)
height_cm
Height (cm)
weight_kg
Weight (kg)
Question (PL) TypeOptions / Logic
Allowed (Show Required
Values
When)
Wzrost (cm)NumberSingle compact
field with “cm”
suffix; no
Numeric
50–250
separate unit
keypad; reject
cm
selector in
non-numeric;
(integer;
MVP. If
JSON: height_cm (number).
hard range
soft range
missing, allow FHIR Observation: code
50–250; show
120–220 Always Recommended
flow but show LOINC 8302-2 (Body height)
soft warning if
with
that some
with unit cm. Used for
<120 or >220
warning
lifestyle
derived.bmi.
(“Please check
for
guidance may
if this is
extremes)
be less precise.
correct”).
Auto-feeds BMI
calc together
with weight.
NumberField label:
“Waga (kg,
orientacyjnie)”.
Clarify it
Numeric
doesn’t need to
keypad; hard
JSON: weight_kg (number).
be exact
range 30–300;
FHIR Observation: code
(“Może być
30–300 kg Always Recommended soft warning if
LOINC 29463-7 (Body weight)
przybliżona
<40 or >220.
with unit kg. Used for
wartość”).
Optional
derived.bmi.
Missing value
decimal input.
allowed but
degrades
BMI-based
hints.
Waga (kg)
Validation
(Mobile)
UX Notes
Output Mapping
Derived (hidden; auto-computed)
These are not separate questions; they’re computed after the user fills the basic info and used by the rules engine only (and
optionally exported as Observations).
Field KeyLabel (EN)Label (PL)TypeValues / RulesLogic (Inputs → Rule)
Output Mapping
derived.age_yearsAge (years,
auto)Wiek (lata,
auto)Derived
numberAge in years (e.g. 43)now_date – dob
Local: derived.age_years (unit: UCUM a).
May be represented as FHIR Observation
(category: social-history).
derived.age_bandAge band
(screening)Przedział
wiekowy
(badania)Derived
enum18–39 / 40–49 / 50–69 / 70+
(configurable table)Map from
derived.age_years into
band thresholds.
onkn.core.age_band (enum); used by
guideline engine for age-specific
recommendations.
derived.adult_gate_okFlaga:
Adult
Derived
narzędzie
eligibility flag
boolean
dla dorosłychtrue / falsetrue if derived.age_years onkn.flag.adult_gate_ok (boolean). If false,
≥ MIN_ADULT_AGE
stop plan generation and show age
(default 18).
message; no ActionPlan produced.
derived.bmiBMI (auto;
hidden)Derived
numberBMI = weight_kg /
(height_cm/100)2. Acceptable
range 10–80. If outside → mark
as “out_of_range” in metadata.FHIR Observation (optional): LOINC 39156-
Compute only if both
5 (BMI) with unit kg/m2. In UI kept hidden;
height_cm and weight_kg
used only for lifestyle wording / screening
present.
thresholds.
flag.bmi_obesityBMI ≥30 flag Flaga BMI
(hidden)
≥30 (ukryta)Derived
booleantrue/falsetrue if derived.bmi ≥ 30
and BMI within plausible
range.
BMI (auto;
ukryte)
onkn.flag.bmi_ge_30 (boolean); internal for
engine to adjust screening / lifestyle
emphasis, no “risk %” shown.
Implementation notes:
1. Flow & gating
•
•
Order: consent.health → dob → sex_at_birth → height_cm → weight_kg.
Consent gate: If consent.health !== true:
o Do not call the guideline engine or AI layer.
o Show a neutral info screen (“This tool can only generate recommendations if you consent to processing
your health information in this session.”).
o Keep behaviour consistent with the “inform, not diagnose” and minimal-data principles from the ONKONO
contract/spec.
•
Adult gate:
o MIN_ADULT_AGE is a config (default 18).
o If derived.adult_gate_ok === false, short message + exit:
§ EN: “This version of the tool is designed for adults. Please discuss any concerns with a
paediatrician / family doctor.”
§ PL: “Ta wersja narzędzia jest przeznaczona dla osób dorosłych. W razie wątpliwości skonsultuj
się z lekarzem rodzinnym lub pediatrą.”
o Do not generate an ActionPlan for under-age users (consistent with the agreed scope).
2. Validation patterns (mobile-first)
•
•
•
Use native date input where possible; otherwise a simple field date (YYYY) with numeric keypad.
Basic validation steps:
1. Check format → 2. Check “not in future” → 3. Check age range (0–120) → 4. Apply MIN_ADULT_AGE.
For number fields, always:
o Use inputmode="decimal" (or numeric) and strip spaces/commas.
o Validate within hard min/max; if outside, show inline error and keep user on the field.o
Use soft warnings for extreme but still plausible values (e.g. 210 kg) rather than hard blocks, matching the
gentle, non-alarmist tone of ONKONO.
3. Sex-specific logic
• The rules engine should never infer sex from name or anything else – only from sex_at_birth.
•
Mapping to engine categories:
o sex_at_birth = Female → onkn.core.sex_category = "female_at_birth".
o Male → "male_at_birth".
o Intersex → "intersex".
o Prefer not to say → "unknown".
• Screening gates (e.g. breast, cervical, prostate) should use these categories with explicit rules rather than raw text
strings. That keeps the JSON config stable and auditable, as in your other sections (diet, physical activity, chronic
conditions).
4. BMI usage (no “risk score”)
• BMI is computed purely for rule logic and wording, not shown as a numeric “risk score” or colour-coded gauge.
•
Safe usage examples:
o If flag.bmi_obesity = true, the plan might prioritize lifestyle recommendations or highlight that some
screening thresholds differ, but without saying “your cancer risk is X% higher”.
o Keep the tone aligned with the “proactive, constructive, non-alarmist” positioning from the deck and
agreement.
• Optionally you can surface approximate BMI in the PDF / doctor guide as plain clinical context (“Approximate BMI: 31
(based on your reported height and weight)”) but avoid icons, colours, or scoring metaphors.
5. FHIR / data model alignment
•
As with the other questionnaire blocks, responses are:
o Stored in-memory as a JSON answers object keyed by Field Key (dob, sex_at_birth, etc.).
o Transformed server-side to:
§ A minimal FHIR Patient stub (birthDate, gender) and
§ FHIR Observation resources for height, weight, and any derived items you choose to export.
• No health data is persisted in the operational database; only anonymous technical events (e.g.
ASSESSMENT_SUCCESS, ASSESSMENT_ERROR) per the MVP scope.
6. i18n & content maintenance
•
All EN/PL labels and helper texts should live in the same localisation JSON strategy as the other sections
(assessment-questions.*.json), so that:
o Changing a label (e.g. clarifying consent text) is a content change, not a code change.
o The guideline engine still keys exclusively on the Field Key/value pairs, making vibe coding straightforward
and low-risk on the dev side.
Smoking & Secondhand Exposure
Field Key
Questio
n (EN)
Question
(PL)
Type
Logic (Show When)RequiredValidat
ion
(Mobile
)Never /
Former /
CurrentAlwaysYes—Triggers
Advanced
detailsSNOMED codes (std.)
Every day /
Some dayssmoking_status=Curren
Yes
tOne
must
be
selecte
dShort help:
this guides
follow-up
intensity
promptsFHIR
Observation.category=
social-history; local
enum
YesRange
check
per
unit;
numeri
c
keypadUnit toggle:
cig/day ↔
packs/day.
Show hint:
“20 cigarettes
= 1 pack.”Store normalized as
packs/day (backend);
LOINC 8663-7 if you
expose “packs/day”
FHIR
Observation.compone
nt “Years used”
(UCUM a for years).
Example pattern used
in HL7 IPA.
(build.fhir.org)
LOINC PhenX
initiation Qs exist; map
as Observation if
stored. (LOINC)
Options /
Allowed
Values
UX Notes
smoking_statusSmoking Status
status
paleniasmoking.patternOn days
you
smoke,
do you
smoke
every
day or
some
days?smoking.intensityOn
average,
how
Średnio, ile
many do palisz
you
dziennie?
smoke
per day?smoking.years_smokedTotal
years
you
have
smoked
(sum
across
periods)Number0.1–80
(decimal)smoking_status in
{Former, Current}YesIf not sure,
Decima show small
l; range “decade
check helper” to
sum years
smoking.start_ageAt what
W jakim
age did
wieku
you start
zacząłeś/zac Number
smoking
zęłaś palić
regularly
regularnie?
?5–99
(integer)smoking_status in
{Former, Current}OptionalTool-tip:
Integer;
regular = ≥1
range
cig/day for ≥6
check
months
Radio
W dni, w
które palisz,
czy palisz
Radio
codziennie
czy tylko w
niektóre dni?
Łączna
liczba lat
palenia
(suma
wszystkich
okresów)
Number 0.1–
Number
10 packs/day smoking_status =
with unit
or 1–200
Current
toggle
cig/day
Output MappingField Key
Questio
n (EN)
Question
(PL)
Type
smoking.quit_dateWhen
did you
complet
ely quit?Kiedy
całkowicie
Year
rzuciłeś/rzuci
łaś palenie?
smoking.years_since_quitYears
since
quitting
(auto)Lata od
rzucenia
(auto)
Options /
Allowed
Values
ISO-8601
Derived
float
(hidden)
Logic (Show When)
Required
Validat
ion
(Mobile
)
UX Notes
FHIR
Observation.effectiveD
ateTime (used to
derive years-since-
quit)
Not in
smoking_status=Forme Recomme
the
r
nded
future
smoking_status=Forme
—
r
—
Output Mapping
Calculated
from
quit_dateDerived value only;
FHIR
Observation.valueQua
ntity (UCUM a)
——Display as
badge;
explain “20
cig = 1 pack”FHIR
Observation.code =
SNOMED CT
401201003 “Cigarette
pack-years
(observable entity)”,
valueQuantity unit
{pack-years} (UCUM).
Alt: SNOMED
782516008 “Number
of calculated pack
years...”. (HL7)
——Only show in
analytics;
hide in user
UILocal derived; no
export unless needed
—Helps
separate
cigarette vs.
other smoke
exposureMap as multiple
Observations
(SNOMED product
types) if needed
smoking.pack_yearsPack-
years
(auto)
Paczko-lata
(auto)
((cigs_per_da
y/20) OR
packs_per_d
Derived
smoking_status in
ay) ×
(hidden)
{Former, Current}
years_smoke
d (round 1
decimal)
smoking.brinkman_indexBrinkma Wskaźnik
n Index Brinkmana
(auto)
(auto)
cigs_per_day
Derived ×
smoking_status in
(hidden) years_smoke {Former, Current}
d
smoking.other_tobacco_smoke
dDo you
also use Czy używasz
None / Cigar /
other
też innych
Cigarillos /
Checkbo
smoking_status=Curren
smoked wyrobów
Pipe / Roll-
Optional
xes
t
tobacco tytoniowych
your-own /
products do palenia?
Waterpipe
?
On
average,
how
Średnio, ile
smoking.other_cigar_per_week many
cygar
Number
cigars
tygodniowo?
per
week?0–200
(integer)smoking_status=Curren
t AND
smoking.other_tobacco Optional
_smoked includes
“Cigar”Count whole
Integer cigars per
0–200 week
(average).Local numeric (unit:
per_Week); SNOMED
product “cigar”
(mapping)
...cigarill
smoking.other_cigarillos_per_w
...cygaretek
os per
Number
eek
tygodniowo?
week?0–200
(integer)smoking_status=Curren
t AND
smoking.other_tobacco Optional
_smoked includes
“Cigarillos”Count whole
Integer
cigarillos per
0–200
week.Local numeric
(per_Week);
SNOMED “cigarillo”
...nabitek
fajki
Number
tygodniowo?0–200
(integer)smoking_status=Curren
t AND
smoking.other_tobacco Optional
_smoked includes
“Pipe”Count bowls
Integer
(full packs)
0–200
per week.Local numeric
(per_Week);
SNOMED “tobacco
pipe”
...waterp
ipe
...sesji fajki
smoking.other_hookah_session (hookah) wodnej
Number
s_per_week
sessions (shishy)
per
tygodniowo?
week?0–200
(integer)smoking_status=Curren
t AND
smoking.other_tobacco Optional
_smoked includes
“Waterpipe”Count
Integer sessions
0–200 (heads) per
week.Local numeric
(per_Week);
SNOMED “waterpipe
tobacco”
...how
many
smoking.other_other_per_week
per
week?0–200
(integer)smoking_status=Curren
t AND
smoking.other_tobacco Optional
_smoked includes
“Other”Use the same
unit as
Integer
Local numeric
appropriate
0–200
(per_Week)
(items or
sessions).
smoking.other_pipe_bowls_per
_week
...pipe
bowls
per
week?
...ile
Number
tygodniowo?
vape.statusDo you
use e-
Czy używasz
cigarette e-
s
papierosów
(vapes) (vape) lub
or other innych
Radio
electroni elektroniczny
c
ch wyrobów
nicotine nikotynowyc
products h?
?Lifetime
never /
Former (none
in past 12
Always
months) /
Current (any
in past 12
months)No—vape.days_30dIn the
past 30
days, on
W ostatnich
how
30 dniach, w
many
ile dni
Number
days did
używałeś/aś
you use
e-papierosa?
an e-
cigarette
?0–30
(integer)YesPast-30-day
Integer
frequency
0–30
signal.Local integer
(days/30d)
vape.device_typeWhich
device
type do
you
usually
use?Disposable /
Prefilled pod
or cartridge /
vape.status = Current
Refillable
tank or mod /
OtherOptionalOne
must
Usual device
be
only (single
selecte
choice).
d if
shownLocal enum
Jakiego typu
urządzenia
Select
zwykle
używasz?
vape.status = Current
Mirrors
smoking/alco Local enum (optionally
hol status
map within Tobacco
(12-month
Use panel)
window).Field Key
Questio
n (EN)
Question
(PL)
Type
Options /
Allowed
Values
vape.nicotineDoes
your
Czy zwykle
usual e- używany
Radio
liquid
płyn zawiera
contain nikotynę?
nicotine?Yes / No /
Not sure
htp.statusDo you
Czy używasz
use
wyrobów
heated-
tytoniu
tobacco
podgrzewan Radio
products
ego (np.
(e.g.,
IQOS®,
IQOS®,
glo®)?
glo®)?
Logic (Show When)
Required
Validat
ion
(Mobile
)
UX Notes
Output Mapping
Optional—
Helps
interpret
dependence;
Local enum
not used for
screening
gates.
Lifetime
never /
Former (none
in past 12
Always
months) /
Current (any
in past 12
months)No—
Tracked
separately
from vaping.
htp.days_30dIn the
past 30
days, on
how
many
days did
you use
heated-
tobacco
?W ostatnich
30 dniach, w
ile dni
używałeś/aś Number
tytoniu
podgrzewan
ego?0–30
(integer)htp.status = CurrentOptionalSimple
Integer
Local integer
recency/frequ
0–30
(days/30d)
ency.
htp.sticks_per_dayOn days
you use
heated- W dni
tobacco, używania, ile
how
porcji
Number
many
zużywasz
tobacco dziennie?
sticks
per day?0–40
(integer)htp.status = CurrentOptionalKeep
Integer separate from Local numeric
0–40
cigarette
(sticks/day)
CPD.
shs.home_freqHow
often
does
anyone
smoke
inside
your
home?Jak często
ktoś pali
wewnątrz
Twojego
domu?SelectNever / Daily
/ Weekly /
Monthly /
Always
Less than
monthlyOptionalshs.work_freqHow
often
does
smoking
occur
indoors
at work?Jak często
pali się w
pomieszczen Select
iach w
pracy?Never / Daily
/ Weekly /
Monthly /
Always
Less than
monthlyshs.public_30d_barsIn the
past 30 W ostatnich
days,
30 dniach,
were
czy
you in a byłeś/byłaś w
Radio
café/bar kawiarni/barz
where
e, gdzie
people
palono w
smoked środku?
indoors?Yes / Noshs.hours_7dIn the
past 7
days,
about
how
many
hours
were
you
around
others
who
were
smoking
?W ostatnich
7 dniach,
przez ile
godzin
Number
byłeś/byłaś w
otoczeniu
osób
palących?0–168
(integer
hours)shs.life_courseWhere
have
you
been
exposed
to
smoke
(check
all that
apply)?Gdzie
byłeś/byłaś
narażony/a
na dym
(zaznacz
wszystkie)?shs.none_flagNo
secondh Brak
Derived
and
ekspozycji
true/false
(hidden)
exposur biernej (auto)
e (auto)
Childhood
home / Adult
Checkbo
home / Work
xes
/ Social
venues
vape.status = Current
Local enum
—
Grey out
when “Never
allowed”
LOINC 39243-1
(Second-hand smoke
exposure; CPHS); or
use 63955-9 with
location “home”.
(findacode.com)
Optional
—
—
LOINC 63955-9 +
“work” context.
(LOINC)
AlwaysOptional
—
If Yes, allow
optional
venue text
Use as binary
Observation; aligns
with GATS items
AlwaysSmall
PhenX “hours around
Integer; example:
smokers (past 7
Recomme
range “e.g., 3 h at
days)”; Observation
nded
0–168 home + 2 h at with unit h.
work”
(phenxtoolkit.org)
AlwaysOptional—Show as
compact 2-
column
checklist
Always——True if all
SHS fields
negative
LOINC 63955-9 with
Answer List LL1468-9
(“childhood home /
adult home / work /
social”). (LOINC)
Local derived flag for
rules engineImplementation notes (quick)
•
•
Keep pack-years as derived to minimize user burden; the UI only asks for simple numbers/taps.
Use badges or a tiny “info” tooltip to explain pack-years and TTFC in plain language.
Alcohol Use
Field Key
alcohol.status
Question
(EN)
Question (PL)
Which
Które stwierdzenie
statement best najlepiej opisuje
describes your Twoje spożycie
alcohol use?
alkoholu?
If former:
when did you
alcohol.former_since last drink
alcohol
(year)?
Jeśli „Wcześniej”:
kiedy ostatnio
piłeś/aś alkohol
(rok)?
TypeOptions / Allowed
Values
Logic (Show
Validation
Required
When)
(Mobile)
UX NotesOutput
Mapping
RadioLifetime abstainer
(never in lifetime) /
Former (none in past
12 months; drank
before) / Current (any
in past 12 months)Always
Yes“i” tooltip
One must
clarifies 12-
be selected
month windowSNOMED CT
status enums
(current / ex-
drinker / non-
drinker)
Month-
YearISO-8601 (YYYY-MM)alcohol.status
= FormerNoNot in the
futureHelps trend
analysisISO date
Info10 g pure ethanolAlways——Tiny info card
with common
examplesLocale setting
(10 g default for
PL/EU)
alcohol.std_unit_infoStandard drink Używana „porcja
used here
standardowa”
(info)
(informacja)auditc.q1_freqHow often do
you have a
drink
containing
alcohol?Jak często pijesz
Select
napoje alkoholowe?1=Monthly or less;
2=2–4×/month; 3=2–
3×/week; 4=≥4×/weekalcohol.status
= CurrentYesMust pick
oneHide “Never”
option for
LOINC 68518-0
Current to avoid
contradiction
auditc.q2_typicalOn a typical
drinking day,
how many
standard
drinks do you
have?W typowy dzień
picia, ile masz
porcji
standardowych?Select0=1–2; 1=3–4; 2=5–6;
3=7–9; 4=≥10auditc.q1_freq
Yes
>0Must pick
one“What’s a
standard
drink?” link
LOINC 68519-8
auditc.q3_6plusHow often do
you have six
Jak często zdarza
or more drinks Ci się wypić ≥6
Select
on one
porcji jednorazowo?
occasion?0=Never; 1= less than
monthly; 2=Monthly;
3=Weekly;
4=Daily/almost dailyauditc.q1_freq
Yes
>0Must pick
oneThis is the
binge/HED
screening item
LOINC 68520-6
auditc.scoreAUDIT-C total AUDIT-C suma
(auto)
(auto)Derived0–12 (sum of q1–q3)Auto——Show risk chip;
keep numeric
LOINC 75626-2
hidden in UI
(total)
summary
auditc.risk_bandAUDIT-C risk
band (auto)Derived
enum0–4 Low; 5–7
Increasing; 8–10
Auto
Higher; 11–12 Possible
dependence——Thresholds
configurable
per locale
OptionalDefaults ABV:
If %, must beer 5%, wine
sum to 100 12%, spirits
40%
Przedział ryzyka
AUDIT-C (auto)
Typical weekly Typowy tygodniowy
3
Either % (must total
alcohol.beverage_mix split (beer /
podział (piwo / wino
Numbers 100) or #drinks
wine / spirits) / mocne)
alcohol.status
= Current
Local enum
LOINC 106648-
9 (type
breakdown)
If you want this exported as a JSON schema (with the LOINC bindings above) or merged into your ONKONO_form specs.docx,
say the word and I’ll drop it in.
Mobile validations & UX (condensed)
•
•
•
•
Skip logic: If auditc.q1_freq = 0 (Never), auto-set auditc.q2_typical = 0, auditc.q3_6plus = 0, skip full AUDIT items.
(Instrument rule.) (
Scoring helpers: Show an inline score chip after each AUDIT(/-C) section; keep numeric hidden but available to the
summary card.
Standard drink helper: Tap-open card with a 10 g definition and quick examples (e.g., 500 ml 5% beer ≈ 2 drinks;
150 ml 12% wine ≈ 1.5; 40 ml 40% spirits ≈ 1). (Computed from 10 g standard; country-specific overrides allowed.)
Unit converter (background): grams = volume_ml × ABV × 0.789; keep conversion silent unless user opens
“details”.Dietary habits
Optio
ns /
Allow
ed
Value
s
Field KeyQuestion
(EN)Question (PL) Type
diet.fv_portions_dayOn a usual
day, how
many
portions of
vegetables
and fruit do
you eat? (1
portion = 80
g)W typowy
dzień, ile porcji
0–20
warzyw i
Numb
(step
owoców jesz? er
0.5)
(1 porcja = 80
g)
Usual
Typowa liczba
servings of
porcji pełnych
whole
zbóż na dzień
0–10
diet.whole_grains_servings_d grains per
Numb
(pełnoziarniste
(step
ay
day (brown
er
pieczywo/maka
0.5)
bread/pasta,
ron, owsianka,
oatmeal,
kasze)
groats)
Logic (Show When)
Always
Always
Validati
Requir
UX
on
ed
Notes
(Mobile)
Output Mapping
Range
0–20;
allow
0.5
stepsTiny
helper:
example
FHIR Observation.category=social-
s (1
history;
medium
code=onkn.diet.fv.servings_per_da
fruit; 1⁄2
y, UCUM 1/d
cup
cooked
veg)
Range
0–10“1
serving
≈ 1 slice
whole-
grain
bread,
1⁄2 cup
code=onkn.diet.wg.servings_per_d
cooked ay, UCUM 1/d
brown
rice/past
a, 1⁄2
cup
oatmeal
”
YesRange
0–30Include
home
pastries code=onkn.diet.fastfoods.times_pe
if
r_week, UCUM 1/wk
sweet/fa
t-rich
Size
guide:
code=onkn.diet.red.servings_per_
100 g ≈
week, UCUM 1/wk
deck of
cards
Yes
Yes
Times per
week you
eat “fast
foods” or
other
energy-
dense
processed
foods
(burgers,
pizza, fries,
pastries,
packaged
snacks)Ile razy w
tygodniu jesz
„fast foody” lub
inne
wysokokalorycz
ne produkty
Numb
0–30
przetworzone
er
(burgery, pizza,
frytki, wyroby
cukiernicze,
pakowane
przekąski)Servings of
red meat
per week
(beef, pork,
diet.red_meat_servings_week
lamb; 1
serving =
100 g
cooked)Porcje
czerwonego
mięsa na
tydzień
Numb
(wołowina,
0–20
er
wieprzowina,
baranina; 1
porcja = 100 g
po ugotowaniu)AlwaysYesRange
0–20Servings of
processed
meat per
week (ham,
diet.processed_meat_serving
bacon,
s_week
sausage,
deli meats;
1 serving =
50 g)Porcje mięsa
przetworzoneg
o na tydzień
Numb
(szynka, bekon,
0–20
er
kiełbasa,
wędliny; 1
porcja = 50 g)AlwaysYesRange
0–20Exampl code=onkn.diet.proc.servings_per_
es list
week, UCUM 1/wk
diet.ssb_servings_weekSugar-
sweetened
drinks per
week
(regular
soda,
energy
drinks,
sweet iced
tea; 1
serving =
250 mL)Słodzone
napoje na
tydzień (zwykłe
napoje
gazowane,
Numb
0–70
energetyki,
er
słodzona
herbata; 1
porcja = 250
mL)YesRange
0–70Exclud
es
diet/zer
o and
100%
fruit
juice
diet.legumes_freq_weekHow many
Ile razy w
times per
tygodniu jesz
week do
rośliny
you eat
strączkowe
beans/legu
(fasola,
mes (beans,
soczewica,
lentils,
ciecierzyca,
chickpeas,
soja)?
soy)?Numb
0–21
erShow When:
fv_portions_day < 4
OR
No
whole_grains_serving
s_day < 1.5Range
0–21Quick
picks: 0, code=onkn.diet.legumes.times_per
1–2, 3– _week, UCUM 1/wk
4, 5+
diet.upf_share_pctRoughly
Jaką mniej
what share więcej część
of your total Twojej dietySlider 0–
%
100%Show When:
fastfoods_freq_week ≥ No
20–100
onlyNOVA
info “i”
tooltip
diet.fastfoods_freq_week
Always
Always
code=onkn.diet.ssb.servings_per_
week, UCUM 1/wk
code=onkn.diet.upf.share_percent,
UCUM %Question
(EN)
Field Key
Question (PL) Type
food intake
is ultra-
processed
(packaged
snacks,
sweetened
drinks,
instant
meals,
reconstitute
d meats,
breakfast
cereals)?
Typical
container
size when
you drink
SSB?
diet.ssb_container
stanowią
produkty
ultraprzetworzo
ne (pakowane
przekąski,
słodzone
napoje, dania
instant, wyroby
mięsne
odtworzone,
płatki
śniadaniowe)?
Typowa
wielkość porcji
słodzonego
napoju?
Optio
ns /
Allow
ed
Value
s
Logic (Show When)Validati
Requir
UX
on
ed
Notes
(Mobile)
Show When:
ssb_servings_week ≥
1Tighten
Yes
Must
s
code=onkn.diet.ssb.container_size
(when pick one mL/wee
_mL, UCUM mL
shown) if shown k
estimate
Output Mapping
(step
5%)
250 /
330 /
Select 500 /
750
mL
Derived (hidden; auto-computed)
Values /
Rules
Logic (Inputs → Rule)Output Mapping
diet.red_meat_servings_week × 100code=onkn.diet.red.g_per_week,
UCUM g/wk
Processed meat Mięso przetworzone Derived
g/wk
grams/week
g/tydz.
numberdiet.processed_meat_servings_week ×
50code=onkn.diet.proc.g_per_week,
UCUM g/wk
derived.ssb_mLwkSSB intake
mL/weekDerived
mL/wk
numberdiet.ssb_servings_week × 250 (adjust by code=onkn.diet.ssb.mL_per_week,
diet.ssb_container if provided)
UCUM mL/wk
wcrf.compADieta bogata w
Rich in
pełne ziarna,
wholegrains,
warzywa, owoce i
veg, fruit & fiber
błonnikDerived
0 / 0.5 / 1.0
enum1.0 if FV≥5 & WG≥3; 0.5 if FV≥4 OR
WG≥1.5 OR legumes≥3/wk (only if
answered); else 0.wcrf.compBLimit “fast
Ogranicz „fast
foods” / energy-
foody” / produkty
dense
wysokokaloryczne
processedDerived
0 / 0.5 / 1.0
enum1.0 if fastfoods≤1/wk; 0.5 if
code=onkn.wcrf.compB, unit
fastfoods∈[2,3] OR (fastfoods∈[2,3] AND
dimensionless
UPF%<10%); else 0.
wcrf.compCLimit red &
Ogranicz czerwone i Derived
0 / 0.5 / 1.0
processed meat przetworzone mięso enum1.0 if red≤350 g/wk AND proc=0; 0.5 if
code=onkn.wcrf.compC, unit
red≤500 g/wk AND proc≤50 g/wk; else 0. dimensionless
wcrf.compDLimit sugar-
sweetened
drinksDerived
0 / 0.5 / 1.0
enum1.0 if SSB=0; 0.5 if ≤250 mL/wk (default
assumes 250 mL servings unless
container provided); else 0.code=onkn.wcrf.compD, unit
dimensionless
wcrf.diet_totalWCRF diet-only WCRF suma (tylko
total
dieta)Derived
0–4
numbercompA + compB + compC + compDcode=onkn.wcrf.diet_total, unit
dimensionless
wcrf.diet_bandWCRF diet-only WCRF przedział
band
(tylko dieta)Low (0–1.0)
Derived / Mid (1.5–
From wcrf.diet_total
enum
2.5) / High
(3.0–4.0).flag.redmeat.highRed meat
above
recommended
limitCzerwone mięso
Derived
powyżej zalecanego
True/False
boolean
limituderived.red_meat_gwk > 500code=onkn.flag.redmeat.high, unit
boolean
flag.procmeat.anyAny processed
meat intakeSpożycie mięsa
przetworzonegoDerived
True/False
booleanderived.proc_meat_gwk > 0code=onkn.flag.procmeat.any, unit
boolean
flag.ssb.anyAny SSB intakeWystępują słodzone Derived
True/False
napoje
booleandiet.ssb_servings_week ≥ 1code=onkn.flag.ssb.any, unit
boolean
flag.fastfoods.highFrequent
fast/energy-
dense foodsCzęste fast
foody/produkty
wysokokalorycznediet.fastfoods_freq_week ≥ 2code=onkn.flag.fastfoods.high, unit
boolean
Field KeyLabel (EN)Label (PL)Type
derived.red_meat_gwkRed meat
grams/weekCzerwone mięso
g/tydz.Derived
g/wk
number
derived.proc_meat_gwk
SSB mL/tydz.
Ogranicz słodzone
napoje
Derived
True/False
boolean
code=onkn.wcrf.compA, unit
dimensionless
code=onkn.wcrf.diet_band, unit text
Implementation notes:
•
•
•
•
•
•
•
FHIR: save raw answers in QuestionnaireResponse. Emit derived values as Observation resources with
Observation.category=social-history. Put wcrf.comp* as an Observation with component[] if you prefer a single
composite, or separate Observations per component — pick and stick.
Code system: use one local namespace onkn (dot-style codes as above; no slashes).
Units: UCUM only (/d, /wk, g/wk, mL/wk, %). Keep serving definitions in UX Notes, not in units.
Progressive disclosure: 6 required Core → show diet.legumes_freq_week only if A might fail; show
diet.upf_share_pct only if fastfoods ≥ 2; show diet.ssb_container only if ssb ≥ 1.
UI: numeric steppers for counts; concise “i” tooltips; EN/PL strings provided; soft warnings for extreme values (e.g.,
SSB > 70/wk).
Versioning: tag the scoring profile as onkn.wcrf.v2025.1 in Observation.note/extension for auditability.
UI patterns: short “i” tooltips for serving sizes; * examples localized (EN/PL). Keep numbers tappable with steppers
on mobile;Physical Activity
Field KeyQuestion (EN)Question (PL)TypeOptions /
Allowed
ValuesLogic
(Show
When)RequiredValidation
(Mobile)UX NotesOutput Mapping
pa.activity_levelHow would you
describe your
usual physical
activity?Jak opisał(a)byś
swoją typową
aktywność
fizyczną?Radio
(chips)Sedentary /
Moderate /
HighAlwaysOpt.—Short helper
under labels
(examples)Enum onkn.pa.activity_level
(values:
sedentary/moderate/high)
Helper text suggestions:
• Sedentary: mostly sitting, little walking/exercise
• Moderate: brisk walking/cycling/light chores ≥30 min on some days
• High: regular sport/fitness, heavy chores, running, fast cycling
Advanced (IPAQ-S compatible; “Last 7 days”)
Option
s/
Logic
Questio Question
Field Key
Type Allowe (Show
n (EN)
(PL)
d
When)
Values
pa.walk.days7
In the
last 7
days, on
how
many
days did
you walk
for ≥10
minutes
at a
time?
W ciągu
ostatnich 7
dni, ile dni
chodził(a)
Pan/Pani
przez ≥10
minut za
jednym
razem?
Numbe 0–7
Advanced
r
(step 1) expanded
Validatio
Require
UX
n
d
Notes
(Mobile)
Yes
On those
days,
how
W te dni, ile
many
minut zwykle
pa.walk.minperd
Numbe 0–600 pa.walk.days
minutes Pan/Pani
Yes
ay
r
(step 5) 7 > 0
per day chodził(a)
did you dziennie?
usually
walk?
pa.mod.days7
Days of
moderat
e activity
(makes
you
breathe
somewh
at
harder,
e.g.,
brisk
walk,
easy
cycling)
≥10 min
Dni z
umiarkowan
ą
aktywnością
(nieco
szybszy
Numbe
0–7
oddech, np. r
szybki
marsz, lekka
jazda na
rowerze) ≥10
min
Minutes
per day Minut
of
dziennie
pa.mod.minperd
Numbe
moderate umiarkowane
0–600
ay
r
activity
j aktywności
on those w te dni
days
pa.vig.days7
Dni z
Days of
intensywną
vigorous
aktywnością
activity
(znacznie
(much
szybszy
Numbe
harder
0–7
oddech, np. r
breathing
bieg, szybka
, e.g.,
jazda na
running,
rowerze) ≥10
fast
min
Integer
0–7
Output Mapping
Tiny
note:
include onkn.pa.walk.days7
walking (d)
for
transport
Keypad;
Range 0–
onkn.pa.walk.min_d
allow
600
ay (min/d)
“approx.”
0–7Example
onkn.pa.mod.days7
s in
(d)
helper
pa.mod.days
Yes
7>00–600—
Advanced
expanded0–7Example
onkn.pa.vig.days7
s in
(d)
helper
Advanced
expanded
Yes
Yes
onkn.pa.mod.min_d
ay (min/d)Field Key
Questio Question
n (EN)
(PL)
Type
Option
s/
Logic
Allowe (Show
d
When)
Values
Validatio
Require
UX
n
d
Notes
(Mobile)
Output Mapping
cycling)
≥10 min
Minutes
per day
of
pa.vig.minperday vigorous
activity
on those
days
pa.sit.min_day
Minut
dziennie
Numbe
intensywnej
0–600
r
aktywności w
te dni
pa.vig.days7
Yes
>0
On a
usual
W typowy
day, how dzień, ile
many
minut spędza Numbe
Advanced
0–1440
minutes Pan/Pani w r
expanded
do you
pozycji
spend
siedzącej?
sitting?
Opt.
onkn.pa.vig.min_day
(min/d)
0–600—
0–1440“Include
work,
onkn.pa.sit.min_day
driving, (min/d)
TV”
Backend derivations (store, don’t show)
Compute after submit; attach to the same encounter/payload.
•
•
•
•
•
•
pa.met.walk = 3.3 × pa.walk.days7 × pa.walk.minperday
pa.met.mod = 4.0 × pa.mod.days7 × pa.mod.minperday
pa.met.vig = 8.0 × pa.vig.days7 × pa.vig.minperday
pa.met.total = pa.met.walk + pa.met.mod + pa.met.vig (MET-min/week)
pa.ipaq_category (Low / Moderate / High) using standard IPAQ-Short rules (10-min bouts, domain-agnostic).
pa.who2020_meets (true/false): true if activity is roughly equivalent to ≥150–300 min/week moderate or ≥75–150
min/week vigorous (or combination) based on MET-min total.
• Optional: pa.sedentary_minutes = pa.sit.min_day.
Output mapping (suggested)
•
•
•
Raw fields: local codes onkn.pa.* as shown.
Derived:
o onkn.pa.met.walk|mod|vig|total (unit: MET·min/wk)
o onkn.pa.ipaq_category (enum: low/moderate/high)
o onkn.pa.who2020_meets (boolean)
FHIR: represent derived items as Observations (category: social-history / lifestyle).
Microcopy (EN/PL) for helpers (1-liners)
• Moderate examples: brisk walking, easy cycling, gardening.
Umiarkowana aktywność: szybki marsz, lekka jazda na rowerze, prace w ogrodzie.
•
•
Vigorous examples: running, fast cycling, sport training.
Intensywna aktywność: bieg, szybka jazda na rowerze, trening sportowy.
Sitting includes: desk work, driving, TV.
Siedzenie obejmuje: praca biurowa, prowadzenie auta, oglądanie TV.
Sexual health
Table 1. Sexual health history – user-facing fields
Field Key
sexhx.info
Question
(EN)
Sexual
health &
HPV-related
cancers
(info)
Question (PL)
Zdrowie
seksualne a
nowotwory
HPV-zależne
(informacja)
TypeOptions / Allowed Logic (Show
Values
When)
InfoStatic copy
explaining that:•
this section is
optional;• data are
anonymous and
not stored in an
Always, before
account;• answers other sexual-health
help tailor
items
information on
HPV-related
cancers (szyjki
macicy, odbytu,
narządów
Required
—
Validati
on
UX Notes
(Mobile
)
—
Output Mapping
Small info
card above
section;
tone: neutral,
non-moralisi
ng. Stress
UI only (no export).
“Możesz
pominąć tę
część – plan
i tak będzie
działał.”Field Key
Question
(EN)
Question (PL)
Type
Options / Allowed Logic (Show
Values
When)
RequiredValidati
on
UX Notes
(Mobile
)
Short helper:
One
“Pomaga to
option if dopasować
user
informacje o
interact nowotworac onkn.sex.section_opt_
s;
h
in (enum: yes / no /
otherwis HPV-zależny prefer_no)
e allow ch. Możesz
leaving w każdej
empty
chwili
pominąć.”
Output Mapping
płciowych, jamy
ustnej/gardła).
Radio
(chips)• Yes, I’m
comfortable
answering / Tak,
odpowiem• No,
skip this section /
Nie, pomiń tę
część• Prefer not
to say / Wolę nie
odpowiadaćAlways (Sexual
health section
header)No
Have you
Czy kiedykolwiek
ever had any
miałaś/miałeś
sexual
kontakt
sexhx.ever_sexual_c contact with
seksualny z inną Radio
ontact
another
osobą? (narządy
person?
płciowe, seks
(genital, oral,
oralny lub analny)
or anal)• No, never / Nie,
nigdy• Yes / Tak•
Prefer not to say /
Wolę nie
odpowiadaćsexhx.section_opt_i
n = Yes OR
(section_opt_in
empty and section
shown by default)Helper:
wyjaśnij, że
One
Yes (but
chodzi o
must be
onkn.sex.ever_active
“Prefer not
kontakt
selected
(enum: never / ever /
to say” is
fizyczny –
if row
prefer_no)
valid)
nie
reached
rozmowy/onli
ne.
Would you
Czy chcesz
like to
odpowiedzieć na
answer a few
kilka
sexhx.section_opt_in optional
opcjonalnych
questions
pytań o zdrowie
about sexual
seksualne?
health?
W jakim mniej
więcej wieku po
raz pierwszy
miałaś/miałeś
Number
stosunek
pochwowy, analny
lub seks oralny?Age in years 8–80
(integer)Over your
lifetime,
about how
many
sexhx.lifetime_partne different
rs_cat
sexual
partners (of
any gender)
have you
had?W ciągu całego
dotychczasowego
życia, z iloma
różnymi
partnerami
Select
seksualnymi
(dowolnej płci)
miałaś/miałeś
kontakty
seksualne?• 0–1• 2–4• 5–9•
Optional
10–19• 20 or more
(recomme
/ 20 lub więcej•
sexhx.ever_sexual_
nded if
Prefer not to say / contact = Yes
comfortabl
Wolę nie
e)
odpowiadaćNo
Chips or
numeric dropdown;
input;
clarify “nie
just
liczymy
onkn.sex.lifetime_part
categor wielokrotnyc ners_cat (ordered
y; no
h kontaktów enum)
extra
z tą samą
validatio osobą
n
oddzielnie”.
In the past
12 months,
about how
many
sexhx.partners_12m_
different
cat
sexual
partners
have you
had?W ciągu ostatnich
12 miesięcy, z
iloma różnymi
partnerami
Select
seksualnymi
miałaś/miałeś
kontakty?• 0• 1• 2–3• 4–5• 6
or more / 6 lub
więcej• Prefer not
to say / Wolę nie
odpowiadaćsexhx.ever_sexual_
Optional
contact = YesHelper:
“Liczymy
partnerów, z
Categor którymi był
onkn.sex.partners_12
y only
kontakt
m_cat (ordered enum)
genitalny,
analny lub
oralny.”
sexhx.ever_sexual_
Optional
contact = Yes—
Simple
yes/no chip;
supports
onkn.sex.new_partner
rules around
_12m (enum:
“new partner
yes/no/prefer_no)
= nowy typ
narażenia na
HPV”.
Which types Z jakimi
of partners
partnerami
sexhx.partner_gende
have you
miałaś/miałeś
rs
had sexual
kontakty
contact with? seksualne?• Only men / Tylko
z mężczyznami•
Only women /
Tylko z kobietami•
Men and women /
Z mężczyznami i
Checkbo kobietami•
sexhx.ever_sexual_
Optional
xes
Partners of other
contact = Yes
genders / Z
partnerami o innej
tożsamości
płciowej• Prefer not
to say / Wolę nie
odpowiadaćAt least
one
option
or
“Prefer
not to
say”
Behaviour-b
ased, not
identity-base onkn.sex.partner_gen
d; helper:
ders (multi-enum;
“To pytanie derive MSM flag using
dotyczy
this + sex_at_birth
wyłącznie
elsewhere)
zachowań,
nie etykiet.”
Jakie rodzaje
kontaktów
seksualnych
miałaś/miałeś
kiedykolwiek?
(zaznacz
wszystkie
pasujące)• Vaginal sex
(penis in vagina) /
Stosunek
pochwowy (penis
w pochwie)• Anal
Checkbo sex – receptive
sexhx.ever_sexual_
Optional
xes
(something in your contact = Yes
anus) / Seks
analny – bierny
(coś w Twoim
odbycie, np. penis,
palec, zabawka)•At least
one or
“Prefer
not to
say”
Keep
wording
neutral;
show brief
definitions
on tap.
sexhx.age_first_sex
About how
old were you
when you
first had
vaginal,
anal, or oral
sex?
Integer
Use
8–80;
steppers;
show
allow
soft
approximate.
warning
Explain:
Observation:
<16
“Jeśli nie
onkn.sex.age_first_se
(“możes
pamiętasz
x (unit: a, years)
z
dokładnie,
wpisać
wpisz
przybliż
przybliżony
ony
wiek.”
wiek”)
In the past
12 months, Czy w ostatnich
have you
12 miesiącach
had any new pojawił się u
sexhx.new_partner_1 sexual
Ciebie nowy
Radio
2m
partner
partner seksualny
(someone
(ktoś, z kim
you hadn’t
wcześniej nie
had sex with współżyłaś/eś)?
before)?
Which types
of sexual
contact have
sexhx.sex_sites_ever you ever
had?
(choose all
that apply)
Yes / No / Prefer
not to say
sexhx.ever_sexual_
Optional
contact = Yes
onkn.sex.sex_sites_ev
er (multi-enum;
sub-flags e.g.
vaginal_ever,
anal_rec_ever,
anal_ins_ever,
oral_ever)Field Key
Question
(EN)
Question (PL)
Type
Options / Allowed Logic (Show
Values
When)
Required
Validati
on
UX Notes
(Mobile
)
Output Mapping
Anal sex –
insertive (your
penis in partner’s
anus) / Seks
analny – czynny
(Twój penis w
odbycie
partnera/partnerki)•
Oral sex to your
genitals/anus /
Seks oralny
wykonywany Tobie
(usta/język na
narządach
płciowych/okolicy
odbytu)• Oral sex
you give to partner
/ Seks oralny
wykonywany przez
Ciebie
partnerowi/partnerc
e• Other sexual
contact (genital
rubbing, sex toys
only, etc.) / Inne
kontakty seksualne
(np. ocieranie
narządów
płciowych, same
zabawki)• Prefer
not to say / Wolę
nie odpowiadać
In the past
12 months,
which types
sexhx.sex_sites_12m
of sexual
contact have
you had?
sexhx.condom_use_
12m
Jakie rodzaje
kontaktów
seksualnych
miałaś/miałeś w
ostatnich 12
miesiącach?
Same options as
sexhx.sex_sites_e
Checkbo ver plus “None in
sexhx.ever_sexual_
Optional
xes
past 12 months /
contact = Yes
Brak w ostatnich
12 mies.”
Podczas
When you
stosunków
have vaginal
pochwowych lub
or anal sex,
analnych, jak
how often do
Select
często Ty lub
you or your
partner/partnerka
partner use
używacie
condoms?
prezerwatywy?
Have you
Czy kiedykolwiek
ever given or świadczyłaś/świad
received
czyłeś usługi
sexual
seksualne lub
sexhx.sex_work_ever services in
otrzymywałaś/eś Radio
exchange for seks w zamian za
money, gifts, pieniądze,
or other
prezenty lub inne
benefits?
korzyści?
sexhx.sex_work_role
If yes: in
what role?
Apart from
HIV,
sexhx.sti_history_oth
hepatitis B/C
er
and HPV
(asked
Jeśli tak: w jakiej
roli?
Czy poza HIV,
WZW B/C i HPV
(pytane osobno)
kiedykolwiek
powiedziano Ci,
• Always / Zawsze•
More than half the
time / Częściej niż
w połowie
przypadków• Less
than half the time /
Rzadziej niż w
sexhx.ever_sexual_
połowie
contact = Yes AND
przypadków• Never
(sexhx.sex_sites_ev Optional
/ Nigdy• No vaginal
er includes vaginal
or anal sex in past
or anal)
12 months / Brak
seksu
pochwowego/analn
ego w ostatnich 12
mies.• Prefer not to
say / Wolę nie
odpowiadać
• No / Nie• Yes /
Tak• Prefer not to
say / Wolę nie
odpowiadać
sexhx.ever_sexual_
Optional
contact = Yes
• Mainly provided
sexual services /
Głównie
świadczyłam/świad
czyłem usługi
seksualne• Mainly
received sexual
Checkbo
sexhx.sex_work_ev
services / Głównie
Optional
xes
er = Yes
korzystałam/korzys
tałem z usług
seksualnych• Both
/ Obie role• Prefer
not to say / Wolę
nie
doprecyzowywać
Radio
• No / Nie• Yes /
Tak• Not sure / Nie
sexhx.ever_sexual_
wiem• Prefer not to
Optional
contact = Yes
say / Wolę nie
odpowiadać
—
Helps
distinguish
past vs
current
onkn.sex.sex_sites_12
pattern (e.g.
m (multi-enum)
now in
monogamou
s
relationship).
Ensure
onkn.sex.condom_use
Helper:
one
_12m (enum; can be
“Pytamy
option;
mapped to
ogólnie – nie
no
“mostly_protected /
trzeba liczyć
numeric
mostly_unprotected/no
dokładnie.”
;
ne”)
—Short helper
emphasising
non-judgmen
t: “To pytanie
służy
onkn.sex.sex_work_ev
wyłącznie
er (enum)
dopasowani
u zaleceń
medycznych,
bez
oceniania.”
—Only for
more
granular
onkn.sex.sex_work_ro
internal
le (multi-enum)
analytics;
keep clearly
optional.
—Keep
separate
from
cond.hiv /
cond.hbv /
onkn.sex.sti_history_o
ther (enum)Field Key
Question
(EN)
Question (PL)
Type
Options / Allowed Logic (Show
Values
When)
Required
Validati
on
UX Notes
(Mobile
)
elsewhere), że masz chorobę
have you
przenoszoną
ever been
drogą płciową
told you had (STI)?
any sexually
transmitted
infection
(STI)?
If yes: which
have you
Jeśli tak: które?
sexhx.sti_types_other
had?
(opcjonalne)
(optional)
In the past
12 months,
have you
been treated
for any STI
sexhx.sti_treated_12 (including
m
chlamydia,
gonorrhoea,
syphilis,
herpes,
genital
warts)?
Output Mapping
cond.hcv /
cond.hpv.sta
tus to avoid
duplication.
• Chlamydia•
Gonorrhoea•
Syphilis• Genital
herpes• Genital
Checkbo warts (brodawki
sexhx.sti_history_ot
Optional
xes
narządów
her = Yes
płciowych)• Other /
Inne• Not sure /
Nie pamiętam
nazw
Czy w ciągu
ostatnich 12
miesięcy leczono
u Ciebie
jakąkolwiek
chorobę
przenoszoną
Radio
drogą płciową (np.
chlamydię,
rzeżączkę, kiłę,
opryszczkę,
brodawki
narządów
płciowych)?
Yes / No / Not sure sexhx.ever_sexual_
Optional
/ Prefer not to say contact = Yes
Have you
ever been
• Cervix / Szyjka
told you had Czy kiedykolwiek
macicy•
severe cell powiedziano Ci,
Vulva/vagina /
changes or że masz
Srom/pochwa•
“pre-cancer poważne zmiany
Anus / Odbyt•
” related to komórkowe lub
Penis / Penis•
HPV (for
„stan
Always, but
Mouth/throat /
example
przednowotworo
visually grouped
sexhx.hpv_precancer
Checkbo Jama ustna/gardło•
CIN2/3 of
wy” związany z
as “HPV-related
Optional
_history
xes
Not sure / Nie
the cervix,
HPV (np. CIN2/3
changes (optional)”
wiem / pamiętam
vulvar/vagin szyjki macicy,
in Advanced
tylko, że były
al or anal
zmiany HSIL
„zmiany
HSIL, or
sromu/pochwy lub
przednowotworowe
needed a
odbytu, zabieg
”• Prefer not to say
procedure
typu
/ Wolę nie
like
LEEP/konizacja)?
odpowiadać
LEEP/koniza
cja)?
—Helper: “Nie
musisz
zaznaczać
dokładnie –
zaznacz to,
co
pamiętasz.”onkn.sex.sti_types_ot
her (multi-enum; map
to Conditions if
desired)
—Captures
recent
high-risk
exposure
without
details.onkn.sex.sti_treated_1
2m (enum)
—This
overlaps with
future
“Cancer &
pre-cancer
history”
onkn.sex.hpv_precanc
module –
er_sites (multi-enum;
can be
link to Condition
de-duplicate resources for
d at JSON
pre-cancers)
level. Very
important for
anal/cervical
surveillance
rules.
Table 2. Derived (hidden; auto-computed) – sexual health exposure flags
These are not shown to the user; they are for the guideline engine and analytics only, in line with ONKONO’s “no risk score /
no predictive metric” rule.
Values
Logic (Inputs → Rule)
/ Rules
Field KeyLabel (EN)Label (PL)Type
derived.sex.opted_outSexual health
section opted
outSekcja o zdrowiu
seksualnym
pominiętaDerive
d
true /
boolea false
n
derived.sex.hpv_exposure_band
HPV-related
Wzorzec narażenia
sexual exposure seksualnego na
pattern
HPV
true if sexhx.section_opt_in ∈
{No, Prefer not to say} OR
sexhx.ever_sexual_contact =
Prefer not to say OR section
not reached; else false.
Output Mapping
Observation onkn.sex.opted_out
(boolean). Use to avoid inferring
anything from missing data.
Evaluate only if
derived.sex.opted_out = false
AND
sexhx.ever_sexual_contact =
Yes.Higher if any of:•
sexhx.lifetime_partners_cat ∈
{10–19, ≥20}OR
sexhx.partners_12m_cat ∈ {4–
5, ≥6}OR sexhx.sex_sites_ever
includes any anal sex
Observation
Values:
(receptive or insertive)OR
onkn.sex.hpv_exposure_band
Low /
Derive
sexhx.sex_work_ever =
(enum). Use in
Mediu
d enum
Yes.Medium if not Higher and preventive-plan-config.*.json as one
m/
any of:•
of the gates for HPV-related
Higher.
sexhx.lifetime_partners_cat ∈ counselling (no numeric risk).
{2–4, 5–9}OR
sexhx.partners_12m_cat ∈ {2–
3}OR (sexhx.age_first_sex <
18 AND age_first_sex is
provided).Low if
sexhx.ever_sexual_contact =
Yes and none of the above;
null if ever_sexual_contact =
No.Label (PL)
Label (EN)derived.sex.multiple_partners_12mMultiple
Wielu partnerów w
partners in past ostatnich 12
12 months
miesiącachDerive
d
true /
boolea false
nonkn.sex.multiple_partners_12m
true if sexhx.partners_12m_cat
(boolean). Helpful for emphasising
∈ {2–3, 4–5, ≥6}; false if 0 or 1;
HPV vaccination / STI screening
null otherwise.
messages.
derived.sex.oral_hpvcancer_exposurePattern
associated with
HPV-related
oral/throat
cancersDerive
d
true /
boolea false
ntrue if (sexhx.sex_sites_ever
includes any oral sex option)
AND
(sexhx.lifetime_partners_cat ∈
{5–9, 10–19, ≥20} OR
sexhx.partners_12m_cat ∈ {2–
3, 4–5, ≥6}). Else false/null.
Wzorzec związany z
nowotworami
gardła/jamy ustnej
zależnymi od HPV
Type
Values
Logic (Inputs → Rule)
/ Rules
Field Keyderived.sex.msm_behaviorWzorzec zachowań:
Behaviour
Derive
mężczyzna mający
true /
pattern: man
d
kontakty seksualne z
false /
who has sex
boolea
mężczyznami
null
with men (MSM)
n
(MSM)
derived.sex.anal_receptive_everEver had
receptive anal
sex
Belongs to
“higher anal
derived.sex.highrisk_anal_cancer_grou
cancer risk”
p
behaviour/clinic
al group
Pattern
consistent with
higher
derived.sex.cervix_hpv_persistent_patt
persistent HPV
ern
exposure for
cervix-bearing
users
flag.sex.recent_sti
Kiedykolwiek seks
analny bierny
Derive
true /
d
false /
boolea
null
n
Output Mapping
Observation
onkn.sex.oral_hpvcancer_exposure
(boolean). Used to trigger extra
education on HPV vaccination and
head-and-neck symptom awareness
(no screening test is recommended).
Requires demographic field
demo.sex_at_birth
(male/female/other).Set true if
demo.sex_at_birth = “Male”
AND sexhx.partner_genders
Observation onkn.sex.msm_behavior
includes “Men” or “Men and
(boolean). Feeds anal-cancer
women”.False if
high-risk logic (hidden).
demo.sex_at_birth = Male and
partner_genders only
“Women”; null otherwise (incl.
prefer_not).
true if sexhx.sex_sites_ever
includes “Anal sex – receptive”;
Observation
false if
onkn.sex.anal_receptive_ever
sexhx.ever_sexual_contact =
(boolean).
Yes and receptive anal not
selected; null if opted_out.
Należy do grupy o
Derive
zwiększonym ryzyku
d
true /
raka odbytu
boolea false
(zachowania/chorob
n
y)true if any of:•
(derived.sex.msm_behavior =
true AND user_age ≥ 35)OR
(cond.hiv.status ≠ Never AND
(derived.sex.anal_receptive_ev Observation
er = true OR
onkn.sex.highrisk_anal_cancer_grou
derived.sex.msm_behavior =
p (boolean). Used only to consider
true))OR (cond.tx.status = Yes anal dysplasia/cancer screening info
OR meds.immunosupp.current where local guidelines support it; no
= Yes) AND
auto-diagnosis or risk %.
derived.sex.anal_receptive_ev
er = trueOR
(sexhx.hpv_precancer_sites
includes “Anus”).Else false/null.
Wzorzec sprzyjający Derive
true /
przetrwałej infekcji
d
false /
HPV u osób z szyjką boolea
null
macicy
nRequires demo.sex_at_birth
and “no prior total
hysterectomy” flag from gyn
Observation
module (not defined here).true
onkn.sex.cervix_hpv_persistent_patt
if user has cervix AND
ern (boolean). Can up-weight
derived.sex.hpv_exposure_ban
recommendations for cervical
d = Higher AND
screening adherence, but never used
(sexhx.hpv_precancer_sites
to alter national screening intervals
includes “Cervix” OR
beyond guideline rules.
cond.hpv.status ∈ {Past,
Current}).null if no cervix or
opted out.
Derive
d
true /
boolea false
nonkn.flag.sex.recent_sti (boolean).
true if sexhx.sti_treated_12m =
Drives generic “check in with doctor /
Yes; false if = No; null
STI screening” suggestions, including
otherwise.
discussion of HPV vaccination.
Any STI treated Leczone STI w
in past 12
ostatnich 12
months
miesiącach
Implementation notes:
1. Positioning and scope
• Place this block in Lifestyle / Sexual health. Only sexhx.section_opt_in is surfaced early; everything else is
progressively disclosed.
•
Rely on existing modules for infections and immunity (HBV, HCV, HIV, persistent HPV, immunosuppression,
transplant, HPV/HBV vaccination) so you don’t duplicate questions already captured under cond.* and imm.*.
2. Data minimisation & privacy
• Treat the entire section as soft-optional. If derived.sex.opted_out = true, the rules engine should act as if sexual
exposure is “unknown/average”, not “low risk”.
•
Never surface derived flags like msm_behavior or highrisk_anal_cancer_group to the user; they are purely internal
gates for which explanatory content to show (e.g., extra info on anal cancer or HPV vaccination).
• Keep all answers in memory for the current session only, consistent with ONKONO’s anonymous, no-account design.
3. Interop & coding
•
•
Store raw answers as FHIR QuestionnaireResponse items with a local code system onkn.sex.* (dot-style, no
slashes), Observation.category = social-history where you emit Observations.
Suggested Observation codes (examples):
o onkn.sex.age_first_sex, onkn.sex.lifetime_partners_cat, onkn.sex.sex_sites_ever,
onkn.sex.hpv_exposure_band, onkn.sex.highrisk_anal_cancer_group, etc.
• Units: years (a) only where numeric; most variables are enums/flags.
4. Rules-engine integration
• In preventive-plan-config.*.json, use simple boolean/enum gates like:o
o
derived.sex.hpv_exposure_band in ["Medium","Higher"] → add extra education on HPV vaccine catch-up (if
age window appropriate) and reinforce attendance to national screening programmes.
derived.sex.highrisk_anal_cancer_group = true → enable blocks that:
§ explain anal cancer symptoms,
§ reference (without enforcing) any local guidance on anal dysplasia screening for MSM, people
with HIV or transplant recipients, etc.
•
Keep logic deterministic: AI layer may explain why a flag led to a recommendation, but must not introduce new
recommendations that are not in the JSON config.
5. UX & copy details
• Use short, calm helpers under each sensitive question, e.g.:
o “To pytanie służy wyłącznie dopasowaniu zaleceń zdrowotnych; nie zapisujemy tu żadnych danych
osobowych.”
o “Jeśli nie chcesz odpowiadać, wybierz «Wolę nie odpowiadać» – to całkowicie w porządku.”
• On mobile, render long lists (e.g. sexhx.sex_sites_ever) as two-column chip grids to minimise scrolling.
• Ensure WCAG: radio/checkbox groups keyboard-navigable; “Prefer not to say” always visible as a first-class option.
6. No “risk scores”
•
Even though derived fields encode higher or lower exposure patterns, they must never be displayed as numeric risks
or “your chance of cancer is X%”. They are just internal switches telling the plan which educational and
guideline-based actions to include, consistent with ONKONO’s contractual constraints (no risk scoring,
inform-don’t-alarm).
If you’d like, I can next help you turn this table into a concrete JSON skeleton (assessment-questions.sexual.*.json +
preventive-plan-config.sexual.*.json) ready for direct use in the guideline engine.
Current Symptoms
Global rules (applied across all categories)
•
•
Show/Hide: Each category is Always visible in the “Symptoms” page (Core). Selecting any sub-symptom creates a
symptom[i] entry in Advanced → B1 and reveals the standard detail rows (onset, severity, frequency, notes) for that
sub-symptom. Each sub-symptom entry might be created only once.
Required: Globally, user must pick ≥1 symptom or ‘None’ in the Core “symptoms” control; per-category selection is
optional. “None” remains mutually exclusive.
•
Standard detail rows for any selected sub-symptom:
o symptom[i].severity — Slider 0–10 / Nasilenie 0–10 (integer).
o symptom[i].onset — Date or Month–Year; partial allowed; not in the future (ISO-8601).
o symptom[i].frequency — Daily / Weekly / Intermittent (enum).
o symptom[i].notes — Associated features (chips; add HPO terms if known).
• Interoperability: Symptoms map to HPO where available (preferred) or to SNOMED CT if HPO doesn’t cover that lay
term. All dates = ISO-8601; units = UCUM.
• Safety banners: Client shows informational banners for “red flag” picks (e.g., hemoptysis, melena, acute neuro
deficit, dramatic weight loss). UI does not diagnose or show risk %.
Standards basis for timing hints used below (developers): NICE NG12 (latest update 1 May 2025) organises urgent actions
by symptom, including 2-week fast-track referrals; NICE QS96 specifies urgent endoscopy ≤2 weeks for dysphagia; national
campaigns (NHS/CRUK) use cough ≥3 weeks as a primary trigger for chest X-ray/assessment. Use these as default triage
hints; surface them as derived, informational notes only (not diagnostic).
A) Weight & appetite
Question Question
(EN)
(PL)
Field Key
Which
symptoms.weight_appetite.subs apply to
you?
Które
objawy
Pana/Pani
dotyczą?
Type
Options / Allowed Values
Logic
Validation UX Notes (for Output
(Show Required
(Mobile)
the user)
Mapping
When)
• Unintentional weight loss —
losing weight without trying (≥5%
over 6–12 months) / Utrata
masy ciała niezamierzona —
chudnięcie bez prób (≥5% w 6–
Checkboxes
Always Optional
12 mies.) (HPO HP:0001824) •
Loss of appetite — eating much
less than usual / Utrata apetytu
— jedzenie znacznie mniej niż
zwykle (HPO HP:0004396)
—
Tip: Zaznacz,
jeśli
Each
chudniesz bez
selected item
starań lub jesz
spawns
mniej z
symptom[i]
powodu braku
with HPO
apetytu.
code
Short helper
under list
B) Systemic (“B-symptoms”) & general
Field Key
symptoms.systemic.subs
Question Question
(EN)
(PL)
Which
apply?
Type
Options / Allowed Values
Unexplained fever — intermittent or
persistent, not due to a known infection /
Gorączka niewyjaśniona — napadowa
Które
lub stała, bez znanej infekcji (HPO
objawy
HP:0001945) • Night sweats —
Checkboxes
dotyczą
drenching, needing to change
Pana/Pani?
clothes/bedding / Nocne poty — obfite,
wymagające przebrania (HPO
HP:0030166) • Severe fatigue —
exhaustion not improved by rest; affects
Logic
Required Validation UX Notes
Always Optional
—
Output
Mapping
Tip: Zaznacz, jeśli
poty mocno
przemaczają
piżamę/pościel lub
HPO
jeśli masz
codes as
przewlekłe
listed.
zmęczenie.
Emphasize
persistence (2–3+
weeks)Question Question
(EN)
(PL)
Field Key
Type
Options / Allowed Values
Logic
Output
Mapping
Required Validation UX Notes
daily life / Znaczne zmęczenie — nie
ustępuje po odpoczynku, ogranicza
funkcjonowanie (HPO HP:0012378) •
Generalized itching — persistent, no
obvious skin cause / Uogólniony świąd
— przewlekły, bez widocznej przyczyny
skórnej (HPO HP:0000989)
C) Pain (persistent or new)
Field Key
EN
Which
pain
applies?
symptoms.pain.subs
PLType
Options / Allowed Values
Jakie bóle
występują?Persistent/new pain — unexplained
>3 weeks / Ból utrzymujący
się/nowy — niewyjaśniony >3 tyg.
(map via SNOMED on submit) •
Bone pain — deep, constant, worse
at night / Ból kości — głęboki, stały,
gorszy w nocy (HPO HP:0002653) •
Back pain with nerve symptoms —
weakness, numbness, bladder/bowel
Checkboxes changes / Ból pleców z objawami
Always Optional —
nerwowymi — osłabienie,
drętwienie, zaburzenia zwieraczy
(HPO HP:0003418 + notes) •
Headache pattern change —
persistent/new; worse in morning or
with neuro signs / Nowy/zmieniony
ból głowy — uporczywy, gorszy rano
lub z objawami neurologicznymi
(HPO HP:0002315)
If persistent/back + neuro deficits
elsewhere → Emergency same day.
Otherwise persistent bone pain →
GP soon (≤2 weeks).
Time
Wskazówka
symptoms.pain.triage_hint indicator czasu
Derived
(auto)
(auto)
Logic
Auto
Req.
—
Validation UX Notes
—
Output Mapping
Tip: Zaznacz
ból, który
utrzymuje
się
tygodniami
lub budzi w
nocy.HPO for
bone/back; “other”
captured to
SNOMED/HPO
later.
A visible
banner
appears for
acute neuro
deficit.Local enum;
safety banner per
spec. NICE
Guideline 12,
"Suspected
Cancer:
Recognition and
Referral
D) Lumps / lymph nodes
Field Key
EN
PL
Type
Where is Gdzie
the lump wyczuwalny
symptoms.lumps.subs or
guzek lub
swollen powiększony
node?
węzeł?
Options / Allowed Values
Logic
Req.
Validation UX Notes
New or enlarging lump — any site (e.g.,
breast, testis, soft tissue) / Nowy lub
rosnący guzek — dowolna lokalizacja
(SNOMED at runtime) • Swollen lymph
nodes — firm, non-tender, >1 cm,
persisting / Powiększone węzły chłonne
Checkboxes
Always Optional —
— twarde, niebolesne, >1 cm,
utrzymujące się (HPO HP:0002716) •
Generalized nodes — multiple areas ± B-
symptoms / Uogólniona limfadenopatia
— wiele okolic ± B-objawy (HPO
HP:0002716 + note)
Tip: Zaznacz,
jeśli guzek jest
nowy, twardy
lub
powiększa
się.
Output
Mapping
HPO/SNOMED
Tip: note size
(e.g.,
pea/grape),
growth, and
site
E) Bleeding (from any site)
Field Key
symptoms.bleeding.subs
EN
Which
applies?
PLType
Jakie
krwawienia
występują?Coughing blood (hemoptysis) /
Krwioplucie (HPO HP:0002105)
• Rectal bleeding (bright red) /
Krwawienie z odbytu (świeża
krew) (HPO HP:0002573) •
Black, tarry stools (melena) /
Czarne, smoliste stolce
(melena) (HPO HP:0002249) •
Checkboxes Postmenopausal vaginal
Always Optional —
bleeding / Krwawienie po
menopauzie (HPO HP:0033840)
• Blood in urine (visible) / Krew
w moczu (widoczna) (HPO
HP:0000790) • Microscopic
blood in urine / Krew
mikroskopowa w moczu (HPO
HP:0002907)
Time
Wskazówka
symptoms.bleeding.triage_hint indicator
Derived
czasu (auto)
(auto)
Options / Allowed Values
• Postmenopausal bleeding →
Urgent 2-week fast-track Gyn
(≤2 weeks). • Dysphagia +
weight loss (if present in GI) →
Urgent endoscopy ≤2 weeks. •
Visible haematuria (esp. ≥45–
60y) → Urgent Urology
pathway.
Time indicator (auto):
• Hemoptysis (esp. age ≥40,
smoker/ex-smoker) → urgent
chest assessment.
• Rectal bleeding + age/duration
thresholds → urgent colorectal
Logic Req.
Auto
—
Validation UX Notes
—
Output
Mapping
Tip: Jeśli widzisz
krew w stolcu,
moczu lub po
spoczynku
menstruacyjnym
— zaznacz.HPO codes
as listed.
Display concise
hints; no risk %
shown.NICE
Guideline 12,
"Suspected
Cancer:
Recognition
and ReferralField Key
EN
PL
Type
Options / Allowed Values
Logic Req.Validation UX NotesOutput
Mapping
LogicValidation UX NotesOutput
Mapping
pathway (≤2 weeks).
• Postmenopausal bleeding →
urgent gynaecology (≤2
weeks).
• Visible haematuria
(unexplained) → urgent urology
(≤2 weeks); microscopic
haematuria + risks (older adults)
→ urgent evaluation.
F) Breathing / ENT
Field Key
symptoms.resp_ent.subs
ENPL
Type
Options / Allowed Values
Which
applies?• Persistent cough — >3 weeks /
Kaszel utrzymujący się — >3
tyg. (HPO HP:0012735) •
Shortness of breath — new or
worsening / Duszność — nowa
lub narastająca (HPO
HP:0002094) • Hoarseness/voice
Jakie objawy
change — persistent >3 weeks /
Checkboxes
Always Optional —
występują?
Chrypka/zmiana głosu — >3 tyg.
(HPO HP:0001609) • Persistent
sore throat / difficulty
swallowing / Utrzymujący się
ból gardła / trudności w
połykaniu (sore throat via
SNOMED; dysphagia HPO
HP:0002015 in GI)
Time
Wskazówka
symptoms.resp_ent.triage_hint indicator czasu
Derived
(auto)
(auto)
Cough ≥3 weeks → GP soon;
NG12/UK practice often → CXR /
assessment, fast-track if other
alarms present.
Req.
Tip: Jeżeli
kaszel trwa 3
tygodnie lub
dłużej, warto to
zaznaczyć —
może wymagać
prześwietlenia
klp.HPO codes
where
available;
sore throat
mapped via
SNOMED
Keep this as an
info note, not a
diagnosis.NICE
Guideline 12,
"Suspected
Cancer:
Recognition
and Referral
Auto——
LogicReq.Validation UX Notes
G) Gastrointestinal (GI)
Field Key
symptoms.gi.subs
ENPL
Type
Which
applies?• Change in bowel habit — looser/more
frequent stools / Zmiana rytmu —
luźniejsze/częstsze stolce (HPO
HP:0002014) • Change in bowel habit —
constipation / Zmiana rytmu — zaparcia
(HPO HP:0002019) • Abdominal
pain/bloating — persistent/new / Ból
Jakie objawy
brzucha/wzdęcia — przewlekłe/nowe
Checkboxes
Always Optional —
występują?
(HPO HP:0002027) • Indigestion with
alarm features — vomiting, weight loss,
anaemia / Niestrawność z objawami
alarmowymi — wymioty, chudnięcie,
niedokrwistość (map via SNOMED) •
Difficulty swallowing (dysphagia) /
Trudności w połykaniu (dysfagia) (HPO
HP:0002015)
Time
Wskazówka
symptoms.gi.triage_hint indicator
Derived
czasu (auto)
(auto)
Options / Allowed Values
Dysphagia or age ≥55 + weight loss +
dyspepsia → Urgent endoscopy within
2 weeks (QS96).
Time indicator (auto):
• Dysphagia (any age) → urgent
endoscopy/referral ≤2 weeks.
• Change in bowel habit ≥6 weeks (age
≥60) or rectal bleeding thresholds →
urgent colorectal pathway.
Output
Mapping
Tip: Zaznacz,
jeśli nowo
pojawiły się
trudności w
połykaniu lub
utrzymują się
objawy z
alarmami (np.
chudnięcie).
Add “alarm
feature” chips
(weight loss,
anemia)HPO where
listed;
dyspepsia via
SNOMED
Short banner;
link to “why”
(info tooltip).NICE
Guideline 12,
"Suspected
Cancer:
Recognition
and Referral
Auto——
LogicReq.Validation UX Notes
H) Skin / mouth
Field Key
symptoms.skin_mouth.subs
ENPL
Type
Options / Allowed Values
Which
applies?• Changing mole —
size/shape/colour;
bleeding/itching / Zmieniające
się znamię —
rozmiar/kształt/kolor;
krwawienie/świąd (map via
SNOMED) • Non-healing skin
ulcer/lesion — >3 weeks /
Niegojące się
Jakie objawy
owrzodzenie/zmiana skórna —
Checkboxes
występują?
>3 tyg. (HPO HP:0001031) •
Persistent mouth ulcer or
white/red patch — >3 weeks /
Przewlekłe owrzodzenie jamy
ustnej lub biała/czerwona
plama — >3 tyg. (HPO
HP:0000155, HP:0011107)
owrzodzenie (HP:0001031) •
Mouth ulcers (persistent) /
Przewlekłe owrzodzenia jamy
Always Optional —
Tip: Zaznacz,
jeśli zmiana
rośnie/krwawi
lub nie goi się
>2–3 tyg.
Output
Mapping
HPO where
listed;
changing
mole coded
via
SNOMEDField Key
EN
PL
Type
Options / Allowed Values
Logic
Req.
Validation UX Notes
Output
Mapping
ustnej (HP:0000155) • Oral white
patch (leukoplakia) / Biała
plama w jamie ustnej
(leukoplakia) (HP:0011107)
Non-healing, enlarging,
bleeding lesion → GP soon /
2-week fast-track depending on
site & risk.
Time
Wskazówka
symptoms.skin_mouth.triage_hint indicator czasu
Derived
(auto)
(auto)
Keep banner
informational
only.
Time indicator (auto):
“Suspicious pigmented lesion or
non-healing oral/skin ulcer >3
weeks → urgent
dermatology/max-fax (≤2
weeks).”Auto——
Options / Allowed ValuesLogicReq.Validation UX Notes
NICE
Guideline
12,
"Suspected
Cancer:
Recognition
and Referral
I) Breast or testicular changes
Field Key
symptoms.breast_testis.subs
ENPL
Type
Which
change
applies?New breast lump or
skin/nipple change —
dimpling, inversion, discharge /
Nowy guzek w piersi lub
zmiana skóry/brodawki —
Jakie zmiany
wgłębienie, wciągnięcie,
Checkboxes
Always Optional —
występują?
wyciek (HPO HP:0032408 +
SNOMED for nipple changes) •
Testicular lump/heaviness or
asymmetry / Guzek
jądra/uczucie ciężaru lub
asymetria (HPO HP:0032404)
Time
Wskazówka
symptoms.breast_testis.triage_hint indicator
Derived
czasu (auto)
(auto)
Time indicator (auto): “New
breast/testicular
lump/change → urgent
suspected-cancer clinic (≤2
weeks).”
Auto
—
—
Output
Mapping
Tip: Nie czekaj,
aż “minie
samo” — nowe
HPO where
guzki w
listed; others
piersi/jądrze
via SNOMED.
zwykle
wymagają
pilnej oceny.
Short
explanatory
banner.
NICE
Guideline 12,
"Suspected
Cancer:
Recognition
and Referral
J) Urinary
Field Key
symptoms.urinary.subs
ENPL
Type
Which
applies?Visible blood in urine
(gross haematuria) / Krew
w moczu (widoczna) (HPO
HP:0000790) • Microscopic
haematuria (on test) / Krew
mikroskopowa w moczu
Jakie objawy
Checkboxes (HPO HP:0002907) •
Always Optional —
występują?
Obstructive symptoms —
weak stream, straining,
retention / Objawy
przeszkodowe — słaby
strumień, parcie, zatrzymanie
(map via SNOMED)
Time
Wskazówka
symptoms.urinary.triage_hint indicator
Derived
czasu (auto)
(auto)
Options / Allowed Values
Time indicator (auto):
“Unexplained visible
haematuria → urgent
urology (≤2 weeks);
microscopic haematuria in
older adults with risk
factors → urgent
evaluation.”
Logic
Auto
Req.
—
Validation UX Notes
Output
Mapping
Tip: Każde
krwiomocz wymaga
omówienia z lekarzem HPO as
— nawet jeśli ustąpił. listed;
obstructive
Note
symptoms via
anticoagulants/UTIs;
SNOMED
prompt to exclude
infection
Shown as an info
chip; not a diagnosis.
—
NICE
Guideline 12,
"Suspected
Cancer:
Recognition
and Referral
K) Neurologic
Field Key
symptoms.neuro.subs
ENPL
Type
Options / Allowed Values
Logic Req.
Validation UX Notes
Which
applies?• New persistent headaches —
pattern change; worse in morning /
Nowe, utrzymujące się bóle głowy
— zmiana wzorca; gorsze rano (HPO
HP:0002315) • Seizures — new
onset / Napady drgawkowe —
początek (HPO HP:0001250) • Focal
weakness/numbness / Ogniskowe
osłabienie/drętwienie (HPO
Jakie objawy
HP:0001324, HP:0003401) •
Checkboxes
Always Optional —
występują?
Speech/vision change; balance
issues / Zaburzenia
mowy/widzenia; równowagi (HPO
HP:0002381, HP:0000505,
HP:0001251) • Back pain with
neurological deficits — leg
weakness, saddle anaesthesia,
bladder/bowel changes / Ból pleców
z objawami neurologicznymi —
osłabienie nóg, znieczulenie siodłowe,
Tip: Nagłe
osłabienie
połowicze,
bełkotliwa
mowa, nagła
utrata widzenia
⇒ działaj
natychmiast
(112/999).
Output
Mapping
HPO codes
as listed.Field Key
EN
PL
Type
Options / Allowed Values
Logic Req.
Validation UX Notes
Output
Mapping
zaburzenia zwieraczy (HPO
HP:0003418 + notes)
Acute focal deficit / seizure new
onset → Emergency (same day);
subacute progressive features → GP
soon / 2-week fast-track per NG12.
Time
Wskazówka
symptoms.neuro.triage_hint indicator czasu
Derived
(auto)
(auto)
Auto
—
—
NICE
Guideline 12,
This renders as
"Suspected
a high-visibility
Cancer:
banner.
Recognition
and Referral.
Standard detail rows (reused for any selected sub-symptom)
Field KeyQuestion
(EN)Question (PL)
symptom[i].severityHow bad is
it? (0–10)Jak bardzo
dokuczliwy? (0– Slider
10)
symptom[i].onsetSince
when?Od kiedy?
symptom[i].frequencysymptom[i].progression
Options /
Allowed
Values
RequiredValidation
(Mobile)
Shown for each
0–10 (integer) selected sub-
symptomYesKeyboard-
Anchors: 0 none, 3
Integer 0–
accessible slider; mild, 6 moderate, 8–
10
large hit area
10 severe
Date /
Month-
YearISO-8601
Show when any
(YYYY-MM or sub-symptom is
YYYY)
selectedOptionalNo future dates;
allow month/year
only
“If nor sure, pick
month/year”
ISO date
How often? Jak często?SelectDaily / Most
Show when any
days / Weekly sub-symptom is
/ Rarely
selectedOptionalOne must be
selected if row
opened
Helps capture
pattern
Enum
Getting
worse?Toggle
(Yes/No)Yes / NoShow when any
sub-symptom is
selectedOptional—
Feeds safety note;
shows if worsening
Boolean
Nasilenie
narasta?
Type
Logic
Output
Mapping
UX Notes
Implementation notes:
• This block reuses your existing B1 model; the category checklists simply pre-populate symptom[i].code and reveal the
standard rows for details.
• Keep multilingual labels and microcopy via i18n resources as in the spec.
• All banners are informational, consistent with “no risk scoring” policy.
Compliance with ONKONO form conventions
•
•
•
•
Core vs Advanced: Fits your Core symptoms (select all / None) with Advanced B1. Symptom Details (HPO
preferred).
Interoperability: Uses HPO for symptoms, falls back to SNOMED CT where HPO is not a clean match; dates =
ISO-8601; units = UCUM; aligns with your coding policy.
Validation & accessibility: 0–10 severity, future-date guard, exclusive “None”, keyboard-accessible tooltips and
sliders—consistent with mobile-first, WCAG 2.1 AA notes.
Safety banners: Use defined pattern (hemoptysis, melena, acute neuro deficit, dramatic weight loss) to nudge
prompt care without rendering diagnoses or percentages.
HPO code list used|:
• Weight loss HP:0001824; Poor appetite HP:0004396.
•
•
•
•
•
•
•
•
Fever HP:0001945; Night sweats HP:0030166; Fatigue HP:0012378; Pruritus HP:0000989.
Bone pain HP:0002653; Back pain HP:0003418. (HPO confirmations widely available; included in NG12-driven pain
context.)
Lymphadenopathy HP:0002716; Breast mass HP:0032408; Testicular mass HP:0032404.
Haemoptysis HP:0002105; Haematochezia HP:0002573; Melena HP:0002249; Postmenopausal bleeding
HP:0033840; Visible haematuria HP:0000790; Microscopic haematuria HP:0002907.
Cough HP:0012735; Dyspnoea HP:0002094; Hoarse voice HP:0001609.
Abdominal pain HP:0002027; Diarrhoea HP:0002014; Constipation HP:0002019; Dysphagia HP:0002015.
Skin ulcer HP:0001031; Oral ulcer HP:0000155; Oral leukoplakia HP:0011107.
Headache HP:0002315; Seizure HP:0001250; Muscle weakness HP:0001324; Aphasia HP:0002381; Ataxia
HP:0001251; Visual impairment HP:0000505; Paresthesia HP:0003401.
Chronic illnesses & related
Scope: conditions and therapies that change what to ask and what surveillance to consider (no “risk %” surfaced to the user).
Placement: Core question + expandable advanced sections.
Prefixing: cond.* (conditions), meds.* (therapies), imm.* (immunizations), derived.* (auto flags).
Field Key
Question (EN)
Question (PL)
Type
Options / Allowed
Values
Czy kiedykolwiek
HBV infection; HCV
Have you ever been
zdiagnozowano u
Checklist
infection; Cirrhosis
diagnosed with any
Pana/Pani któreś z (chips,
(any cause);
cond.summary of these long-term
poniższych
multi-select) Helicobacter pylori
conditions or are
schorzeń
+ None
(ever positive);
you on long-term
przewlekłych lub czy
Persistent/High-risk
Logic
(Show Required Validation (Mobile)
When)
UX Notes
Output
Mapping
Selecting any Each selection
item
spawns a FHIR
Yes (pick Exclusive “None”;
pre-populates Condition (or
Always ≥1 or
keyboard-accessible
its section in flag when
“None”) chips
Advanced.
therapy-only).
Keep
Codes: localField Key
Question (EN)
Question (PL)
Type
immunosuppressive przyjmuje Pan/Pani
treatment?
długotrwale leki
immunosupresyjne?
Logic
(Show Required Validation (Mobile)
When)
Options / Allowed
Values
HPV infection; HIV
infection;
Inflammatory bowel
disease
(UC/Crohn’s);
Primary sclerosing
cholangitis (PSC);
Barrett’s esophagus;
Chronic pancreatitis;
COPD; Type 2
diabetes; Solid-organ
transplant; Long-term
immunosuppression
(autoimmune/other)
Output
Mapping
UX Notes
language
sensitive, no
% risk.
onkn.condition.*
(SNOMED to be
bound in
codebook).
A) Chronic infections & liver disease
Options /
Validati
Require
Allowed Logic (Show When)
on
d
Values
(Mobile)
Field KeyQuestion
(EN)Question (PL)Typecond.hbv.statusHepatitis
B (HBV)
statusWZW B (HBV) –
statusNever /
Past
cond.summary
Radio (resolved)
includes HBV
/ Current /
Not surecond.hbv.year_dxYear first
Year
diagnose Rok rozpoznania (YYY
d
Y)cond.hbv.antiviral_
nowOn
antiviral
therapy
now?cond.hcv.statusHepatitis
C (HCV)
statuscond.hcv.year_dxYear first
Year
diagnose Rok rozpoznania (YYY
d
Y)ISO-8601cond.hcv.svr12If treated:
Jeśli leczony/a:
cured
potwierdzone
(SVR)
wyleczenie
confirmed
(SVR)?
?Radiocond.cirr.statusCirrhosis
(any
cause)Marskość
wątroby
(jakiejkolwiek
przyczyny)RadioGłówna
przyczynaHBV /
HCV /
Alcohol /
NASH
One
(fatty liver)
must be
Select
cond.cirr.status=Yes Optional
Keep concise.
/
selected
Autoimmu
if shown
ne / PBC /
Other / Not
sureCondition.note or extension
etiology.
Never /
Past
(treated) /
Past (not cond.summary
Radio
treated/not includes H. pylori
sure) /
Current /
Not sure“Tzw. bakteria
wrzodowa.”Condition(H. pylori infection)
+ Procedure(eradication) if
Past(treated).
cond.hpylori.status =
Not in
Optional
Past (treated)
future—Procedure.performedDateTi
me.
cond.summary
includes HPVScreening history will
capture Pap/HPV
results separately.Condition(HPV infection)
OR Observation per prior
result.
cond.cirr.etiology
cond.hpylori.status
Main
cause
Czy aktualnie
leczony/a lekami Toggl Yes / No /
przeciwwirusowy e
Not sure
mi?
WZW C (HCV) –
status
H. pylori
H. pylori – czy
ever
kiedykolwiek
diagnose
rozpoznano?
d?
If treated:
cond.hpylori.year_t year of
Jeśli leczony/a:
x
eradicatio rok eradykacji
n
cond.hpv.status
ISO-8601
cond.hbv.status ∈
{Past, Current}
Year
Output Mapping
Yes—Short help: “Past =
lekarz potwierdził
wyleczenie/serokonwer
sję.”Condition(HBV).
clinicalStatus =
active/remission/resolved;
code onkn.condition.hbv.
OptionalNot in
futureIf unknown, allow skip.Condition.onset (date).
Examples: entekawir,
tenofowir.MedicationStatement (class
antiviral); link to HBV
Condition via
reasonReference.
cond.hbv.status=Cur
Optional —
rent
Never /
Past
(cured/SV cond.summary
Radio
R) /
includes HCV
Current /
Not sure
UX Notes
Yes—“Past (SVR) = wynik po
leczeniu wskazał trwałą Condition(HCV).
eliminację wirusa.”
cond.hcv.status ≠
NeverOptionalNot in
future—Condition.onset.
Yes / No /
Not surecond.hcv.status ∈
{Past, Current}Optional —Only ask if user
remembers.Observation (boolean) or
Condition.clinicalStatus=reso
lved.
No / Yes /
Not surecond.summary
includes CirrhosisYesIf Yes → ask etiology.Condition(cirrhosis).
ISO-8601
Persistent
Czy
or
poinformowano o
Never /
high-risk
utrzymującym się
Past /
HPV
Radio
lub
Current /
infection
wysokoonkogenn
Not sure
(ever
ym HPV?
told)?
B) Immune deficiency / immunosuppression
Yes
—
—
Optional —Field KeyQuestion
(EN)Question
(PL)Typecond.hiv.statusHIV infectionZakażenie
HIVRadioNever / Past
(suppressed) /
cond.summary
Current
includes HIV
(unsuppressed/un
known) / Not sureYescond.hiv.on_artOn
Czy obecnie
antiretroviral
leczony/a
therapy (ART)
ART?
now?ToggleYes / No / Not
surecond.hiv.status ≠
NeverOption
—
alA proxy
for
immune
MedicationStatement (ART).
reconstitu
tion.
cond.tx.statusSolid-organ
transplantPrzeszczep
narząduRadioNo / Yescond.summary
includes Solid-organ
transplantYes—If Yes → Condition(status post
ask organ transplant) or
& year.
Procedure(transplant).
cond.tx.organWhich organ? Jaki narząd?SelectKidney / Liver /
Lung / Heart /
Pancreas / Othercond.tx.status=YesYesMust
pick
one—Procedure.bodySite;
Condition.code detail.
cond.tx.yearYear of
transplantISO-8601cond.tx.status=YesOption Not in
al
future—Procedure.performedDateTime
.
Yes / Nocond.summary
includes Long-term
Yes
immunosuppression
OR cond.tx.status=Yes
Rok
przeszczepie Year
nia
Czy obecnie
Long-term
przyjmuje
meds.immunosupp.c immunosuppr Pan/Pani leki
Toggle
urrent
essive therapy immunosupre
now?
syjne
długotrwale?
Main agent
meds.immunosupp.cl
classes
asses
(check all)
Options /
Allowed Values
Logic
Requir Validat
UX Notes
ed
ion
Calcineurin
inhibitor
(cyclosporine,
tacrolimus) /
mTOR inhibitor
(sirolimus,
everolimus) /
Thiopurine
(azathioprine,
Główne klasy
6-MP) / Anti-TNF
leków
Checkbo
meds.immunosupp.cur
(e.g., infliximab) /
Yes
(zaznacz
xes
rent=Yes
Other biologic
wszystkie)
(anti-IL,
anti-integrin) / JAK
inhibitor (e.g.,
tofacitinib) /
Methotrexate /
Chronic systemic
corticosteroid
(≥10 mg pred eq
≥3 mies.) / Other
meds.immunosupp.st
Początek
Started (year)
art_year
terapii (rok)
Year
ISO-8601
—
—
No labs
asked.
Next:
ART.
Condition(HIV).
“Długotrw
MedicationStatement
ale” = ≥3
category=immunosuppressant.
mies.
Short
At least
examples
one if
under
shown
each line.
meds.immunosupp.cur Option Not in
rent=Yes
al
future
Output Mapping
Multiple
MedicationStatements;
reasonReference to Condition
(IBD/RA/Tx).
Useful for
MedicationStatement.effective
exposure
Period.start.
duration.
C) Chronic inflammatory GI / hepatobiliary
Field Key
Question
(EN)
Question (PL)
Type
Options /
Allowed
Values
Logic
Required Validation
UX NotesOutput Mapping
cond.ibd.typeInflammatory Choroba
bowel
zapalna jelit –
disease type typUlcerative
colitis /
Radio Crohn’s
disease / Not
surecond.summary includes
IBDYes—This drives
CRC
surveillance
logic.
Condition(IBD) with
subtype.
cond.ibd.year_dxYear
diagnosedRok
rozpoznaniaYearISO-8601cond.ibd.type selectedOptionalNot in
future—
Condition.onset.
cond.ibd.extent(UC) Extent(WZJG) Zasięg SelectProctitis /
Left-sided /
Pancolitis /
Not surecond.ibd.type =
Ulcerative colitisOptional—Only for UC.
Condition.extension
extent.
cond.ibd.pscPSC also
diagnosed?Czy
współistnieje
PSC?ToggleYes / No / Not
cond.ibd.type selected
sureOptional—A major CRC
Links to PSC Condition.
risk modifier.
cond.psc.statusPrimary
sclerosing
cholangitisPierwotne
stwardniające
zapalenie dróg
żółciowych
(PSC)Radiocond.summary includes
No / Yes / Not
PSC OR
sure
cond.ibd.psc=YesYes——
cond.barrett.statusBarrett’s
esophagus
known?Czy
rozpoznano
przełyk
Barretta?RadioNo / Yes / Not cond.summary includes
sure
Barrett’sYes—If Yes → last
endoscopy
Condition(Barrett’s)
year.
Last
cond.barrett.last_endo endoscopy
(year)Ostatnia
endoskopia
(rok)YearISO-8601OptionalNot in
futureHelps
suggest
surveillance
interval.
Procedure(endoscopy)
date.
Chronic
pancreatitisPrzewlekłe
zapalenie
trzustkiRadioNo / Yes / Not cond.summary includes
sure
Chronic pancreatitisYes—If Yes →
etiology.
Condition(chronic
pancreatitis).
cond.pancr.status
cond.barrett.status=Yes
Condition(PSC).Question
(EN)
Field Key
cond.pancr.etiology
Main cause
Options /
Allowed
Values
Question (PL)Type
Logic
Required Validation
Główna
przyczynaAlcohol /
Hereditary
(e.g., PRSS1)
Select
cond.pancr.status=Yes
/ Obstructive /
Other / Not
sure
Optional
—
UX NotesOutput Mapping
“Hereditary”
indicates
high-risk
group.Condition.note/extension
etiology.
UX NotesOutput Mapping
E) Metabolic / endocrine
Field Key
Question
(EN)
Type 2
cond.t2dm.status
diabetes
Question
(PL)
Cukrzyca
typu 2
Type
Options /
Allowed Values
No / Yes / Not
Radio
sure
Logic
Required Validation
cond.summary includes
Type 2 diabetes
Yes
Medication specifics not
Condition(T2DM).
required here.
—
F) Hormonal therapy (menopause)
Question
(EN)
Field Key
Question (PL)
Type
Options /
Allowed Values
Logic
Require Validatio
d
n
Always
(Advanced
→
Optional —
Medications
)
UX Notes
meds.hrt.useMenopausal
Terapia
hormone
hormonalna
Radio
therapy
menopauzy (HTZ)
(HRT) useNever / Past /
Current
meds.hrt.typeHRT type
Rodzaj HTZ
(current/mo (bieżący/najnowsz Select
st recent)
y)Keep
Combined
meds.hrt.us
simple; we
estrogen+progesti
Must pick
e ∈ {Past,
Optional
don’t
n / Estrogen-only
if shown
Current}
calculate
/ Other
risk.
Approx.
meds.hrt.duration_y
total years
rs
of use
Łącznie lat
Numbe
0–50 (step 0.5)
stosowania (około) r
Output Mapping
If uterus
removed,
MedicationStatement (HRT).
estrogen-onl
y may apply.
MedicationStatement.medicationCo
de.
meds.hrt.us
MedicationStatement.effectivePerio
Range 0– Steppers on
e ∈ {Past,
Optional
d (if known) or Observation
50
mobile.
Current}
(quantity, UCUM a).
G) Immunizations (protective, but relevant to plan)
Question (PL) TypeOptions /
Allowed
Values
HPV
vaccination
doses
receivedDawki
szczepionki
HPVSelectAlways
0/1/2/3
(Advanced →
/ Not sure
Immunizations)
Year of last
HPV doseRok ostatniej
dawki HPVYearISO-8601
Hepatitis B
vaccination
imm.hbv.completed
(series
complete)?Szczepienie
przeciw HBV
(cykl
ukończony)?RadioYes / No /
Not sure
Field KeyQuestion
(EN)
imm.hpv.dosesimm.hpv.year_last
Logic
Required Validation
UX Notes
Output Mapping
—Capture known Immunization(HPV) with
count only.
protocolApplied.doseNumber.
imm.hpv.doses >
Optional
0Not in
future—
Always—Helps interpret
HBV
Immunization(HBV) completed flag.
susceptibility.
Optional
Optional
Immunization.occurrenceDateTime.
Derived (hidden; auto-computed)
Field Key
Label (EN)
Label (PL)
Type
Values /
Rules
Logic (Inputs → Rule)
Output Mapping
derived.hcc.surveillance_candidateConsider HCC
surveillanceRozważ nadzór
HCCTrue if cond.cirr.status=Yes OR
Observation
cond.hbv.status=Current.
Boolean True/False
onkn.eligibility.hcc_surveillance
(Locale-specific hepatology criteria may
(boolean).
further refine.)
derived.crc.ibd_surveillanceIBD-associated
CRC
surveillanceNadzór jelita
grubego w IBDTrue if cond.ibd.type set AND
Boolean True/False (years_since_dx ≥ 8 OR
cond.psc.status=Yes).
derived.barrett.surveillanceBarrett’s
surveillanceNadzór w
Boolean True/False True if cond.barrett.status=Yes.
przełyku Barretta
Observation
onkn.eligibility.barrett.
derived.skin_lymphoma_highriskHigh
non-melanoma
skin CA /
lymphoma riskWysokie ryzyko
raka skóry /
chłoniakaObservation
onkn.eligibility.skincheck.
derived.hpv_related_vigilanceCzujność dot.
HPV-related
nowotworów
cancer vigilance
HPV-zależnych
Boolean True/False
True if cond.tx.status=Yes OR
meds.immunosupp.current=Yes.
True if cond.hiv.status ≠ Never OR
Boolean True/False meds.immunosupp.current=Yes OR
cond.hpv.status ∈ {Past, Current}.
Implementation notes:
•
Interoperability
o Persist raw answers as FHIR QuestionnaireResponse.
Observation
onkn.eligibility.ibd_crc.
Observation
onkn.eligibility.hpv_related.o
o
•
•
•
•
•
•
•
Emit Condition resources for diagnoses; MedicationStatement for therapies; Immunization for vaccines;
Procedure for transplant/endoscopy; Observation for derived eligibility flags.
Use local codes onkn.* (dot style) now; bind SNOMED/LOINC in the codebook later to avoid incorrect
mappings in UI.
Units & dates: UCUM a for years; all dates ISO-8601; Year pickers for dx/treatment years (mobile numeric keypad).
Progressive disclosure: A single Core checklist controls visibility; each selected item reveals a compact row set only
for that item.
No risk scores in UI: Derived flags render as informational chips/banners (“Consider...”, “Eligible for...”) with brief
“why” tooltips, consistent with the rest of Onkono.
Accessibility & mobile: Steppers for numeric years; exclusive None chip; keyboard-accessible radio groups;
Polish/English microcopy through your i18n resource files.
Safety microcopy: For items that often warrant expedited assessment (e.g., cirrhosis with new symptoms; transplant
recipients with changing skin lesions), show neutral, educational notes—no alarming language.
Versioning: Tag these derivations as onkn.clinical_eligibility.v2025.1 in Observation.note/extension.
Analytics: Keep duration of immunosuppression (if provided) and year of transplant for background analytics;
not required for any gate.
Microcopy (helpers; one-liners)
•
•
•
•
HBV/HCV: “Jeśli nie pamiętasz szczegółów (np. wyniku badania wirusowego), wybierz «Nie wiem».”
IBD/PSC: “Jeśli nie wiesz, czy dotyczy Cię PSC, pozostaw puste.”
Transplant/immunosuppression: “Długotrwale = co najmniej 3 miesiące.”
HRT: “Wybierz typ, jeśli wiesz (estrogeny same vs. z progestagenem). To tylko informacja dot. planu badań.”
Optional “lean” codebook stubs (local codes)
•
•
•
onkn.condition.hbv, .hcv, .cirrhosis, .hpylori, .hpv, .hiv, .ibd.uc, .ibd.crohns, .psc, .barrett, .pancreatitis, .copd, .t2dm,
.transplant.
onkn.meds.immunosupp.class.cni, .mtor, .thiopurine, .anti_tnf, .biologic_other, .jak, .mtx, .steroid.
onkn.eligibility.hcc_surveillance, .ibd_crc, .barrett, .skincheck, .hpv_related.
Personal cancer history & treatments
1. Core – Personal cancer history (summary)
Question
(EN)ca.any_historyCzy
Have you ever kiedykolwiek
been
rozpoznano u
diagnosed
Pana/Pani
Radio
with cancer (of nowotwór
any type)?
(dowolnego
typu)?No / Yes
/ Not
Always
sure
ca.active_treatment_nowAre you
Czy obecnie
currently being jest Pan/Pani
treated for
leczony/a z
cancer
powodu
(including
nowotworu (w Radio
tablets,
tym tabletki,
injections,
zastrzyki,
infusions or
wlewy,
radiotherapy)? radioterapia)?No / Yes
/ Not
Always
sure
ca.current_followupAre you still
under regular
follow-up for
any past
cancer?
Number of
ca.num_cancers_reported separate
(auto)
cancers
entered (auto)
Implementation note (Core):
Question
(PL)
Options
/
Logic (Show
Allowed When)
Values
Field Key
Type
Czy pozostaje
Pan/Pani pod
regularną
kontrolą z
Radio
powodu
przebytego
nowotworu?
Liczba
zgłoszonych
nowotworów
(auto)
RequiredValidation
UX Notes
(Mobile)
Output Mapping
YesMicrocopy:
“Obejmuje każdy
rodzaj nowotworu
One must
złośliwego. Nie
be
dotyczy małych,
selected
łagodnych zmian
(np. proste torbiele,
zwykłe znamiona).”
If Yes/Not sure, enable
cancer[i] entries. Derived flag
derived.ca.any_history. Each
cancer[i] → FHIR Condition
(code = site-specific cancer,
SNOMED/ICD-10 in
codebook).
OptionalShort helper:
“Dotyczy trwającego
One must
FHIR Observation or
leczenia
be
QuestionnaireResponse item;
onkologicznego –
selected if
also used in derived flag
nie obejmuje
shown
derived.ca.current_treatment.
jedynie
kontroli/obserwacji.”
No / Yes
ca.any_history
/ Not
Optional
= Yes
sure
Derived Integer
(hidden) ≥0
Auto when
cancer[i] list
filled
—
—Helper: “Kontrola =
wizyty kontrolne w
poradni, planowe
badania
obrazowe/markery.”Boolean Observation
(onkn.ca.followup.active).
Helpful to prioritize “doctor’s
discussion” topics.
—UI: not shown to
user; used only by
rules engine.Derived from count of
cancer[i]. Exposed as
Observation
onkn.ca.num_cancers
(UCUM 1).•
•
UI pattern: If ca.any_history = Yes, show compact “+ Add cancer” pattern (Fab/button). Each click spawns a new
cancer[i] block with the fields below.
Core answers + cancer[i] blocks feed the deterministic guideline engine; AI layer may only explain, not create new
actions.
2. Per-cancer episode details – cancer[i] (diagnosis metadata). Each cancer[i] represents one primary cancer episode.
Users can add multiple.
Field KeyQuestio Question
n (EN)
(PL)
cancer[i].label_autoCancer
#i label
(auto)
cancer[i].site_group
Which
cancer
was
this?
(main
location)
Type
Etykieta
Derive
nowotworu #i
“Cancer 1”, “Cancer 2”, etc.
d
(auto)
Jaki to był
nowotwór?
(główna
lokalizacja)
Logic
(Show
When)
Which
Po której
side (if
stronie (jeśli
applies)? dotyczy)?Radio
cancer[i].year_dxYear of
Rok
first
pierwszego
diagnosi
rozpoznania
sYear
(YYY
Y)
Requir Validation
ed
(Mobile)
ca.any_histo
—
ry = Yes
Solid tumours (examples):
Breast; Prostate; Colon;
Rectum; Lung; Melanoma
(skin); Other skin cancer
(non-melanoma); Cervix;
Endometrium (uterus body);
Ovary/fallopian tube/peritoneal;
Vulva/vagina; Stomach;
Oesophagus; Pancreas;
Liver/bile ducts; Kidney/upper
urinary tract; Bladder/urethra;
Brain/central nervous system;
Head & neck
(mouth/throat/larynx/sinuses/sa
Select
Shown for
livary); Thyroid; Testis;
(with
each
Sarcoma – bone; Sarcoma –
searc
cancer[i]
soft tissue; Neuroendocrine /
h)
block
carcinoid; Other solid tumour –
please specify. Blood
cancers: Hodgkin lymphoma;
Non-Hodgkin lymphoma;
Chronic lymphocytic leukaemia
(CLL); Other leukaemia;
Multiple myeloma / plasma cell
disorder; Myeloproliferative
neoplasm (PV/ET/MF);
Myelodysplastic syndrome;
Other blood cancer – please
specify. Childhood / other:
Childhood/teenage cancer –
please specify.
cancer[i].laterality
Stage at
first
cancer[i].stage_grou diagnosi
p
s (if you
rememb
er)
Options / Allowed Values
Yes
—
UX NotesOutput Mapping
Used only in
UI headings.Local label in
QuestionnaireRespons
e; not exported as
separate clinical
resource.
Helper: short
examples per
FHIR Condition.code
One option
category
mapped via local code
required; allow
(e.g., “Rak
system →
search/autocomp jelita grubego
SNOMED/ICD-10 in
lete
=
backend.
colon/rectum”
).
Left / Right / Both / Not
applicable / Not sureShow when
site_group in
{Breast,
Ovary/fallopi
an, Testis,
Optiona
—
Kidney/uppe l
r urinary
tract, Lung,
Sarcoma –
limb}Small helper:
Condition.bodySite.late
only for
rality (SNOMED), or
paired
extension.
narządów.
1900–current yearca.any_histo
Yes
ry = YesHelper: “Jeśli
nie
pamiętasz
Condition.onsetDateTi
dokładnie –
me (year-only).
przybliżony
rok.”
4-digit year, not
in future
Zaawansowa
nie przy
I / II / III / IV / Not told / Don’t
rozpoznaniu Select
remember
(jeśli
pamiętasz)ca.any_histo Optiona
—
ry = Yes
lNon-judgmen
tal: “Jeśli nie Condition.stage.summ
pamiętasz – ary (text) + local enum
wybierz «Nie onkn.ca.stage_group.
pamiętam».”
Wiek w chwili Numb
rozpoznania er or
0–120 (integer)
(auto lub
Derive
wpisany)
dDerived from
year of birth
+ year_dx; if
Optiona
DOB
0–120
l
unknown,
show as
manual fieldObservation
Mobile:
onkn.ca.age_at_dx
numeric
(UCUM a). Used by
keypad; allow derived flags
blank.
(childhood/young-onset
).
What is
the
cancer[i].status_curr current
ent
status of
this
cancer?Jaki jest
obecny stan
tego
nowotworu?ca.any_histo
Yes
ry = YesHelper chips
explaining
each option
(short).
Condition.clinicalStatus
+ verificationStatus;
local enum
onkn.ca.status.
Has this
cancer
ever
cancer[i].recurrence_
come
ever
back
after
finishingCzy ten
nowotwór
kiedykolwiek
Radio No / Yes / Not sure
nawrócił po
zakończeniu
leczenia?UX: short
clarifier
“Nawrót =
ponowne
pojawienie
się tego
samego
nowotworu.”
Condition.note flag;
Observation
onkn.ca.recurrence_ev
er (boolean).
cancer[i].age_at_dx
(auto/optional)
Age at
diagnosi
s (auto
or
manual)
Select
No evidence of disease / In
remission under follow-up /
Active treatment now / Stable
or chronic disease / Not sure
One option
required
ca.any_histo Optiona
—
ry = Yes
lField Key
Questio Question
n (EN)
(PL)
Type
Options / Allowed Values
Logic
(Show
When)
Requir Validation
ed
(Mobile)
UX Notes
Output Mapping
ca.any_histo Optiona
—
ry = Yes
lHelper:
“Przerzut =
ognisko w
innym
narządzie niż
guz
pierwotny.”
Condition.stage
(metastatic flag) or
Observation
onkn.ca.metastatic_ev
er.
ca.any_histo Optiona
—
ry = Yes
lObservation
Keep neutral; onkn.ca.possible_here
suggest later ditary (boolean/enum).
explanation
Will interact with
in plan, not
separate
risk %.
genetics/family
sections.
treatmen
t?
Were
you ever
Czy
told this
kiedykolwiek
cancer
poinformowa
had
cancer[i].metastatic_
no
spread
Radio No / Yes / Not sure
ever
Pana/Panią,
(metasta
że nowotwór
tic /
dał
seconda
przerzuty?
ry
cancer)?
Were
you ever
told this
cancer
might be
linked to
cancer[i].genetic_flag an
inherited
gene
change
(e.g.
BRCA,
Lynch)?
Czy
kiedykolwiek
poinformowa
no
Pana/Panią,
że ten
nowotwór
może być
Radio No / Yes / Not sure
związany z
dziedziczną
zmianą
genetyczną
(np. BRCA,
zespół
Lyncha)?
3. Per-cancer treatment history – cancer[i] (modalities & details)
3.1 High-level modalities
Field Key
Question
(EN)
Question
(PL)
Type
Options / Allowed
Values
Logic (Show
When)
Required
Surgery to remove
tumour /
Radiotherapy
What
(radiation
Jakie leczenie
treatments
treatment) / Drug
zastosowano
did you
treatments (chemo /
Yes (at
w związku z
receive for
targeted /
ca.any_history least one
cancer[i].treatments_modalities
tym
Checkboxes
this
immunotherapy) /
= Yes
or “Not
nowotworem?
cancer?
Hormone-blocking
sure”)
(zaznacz
(check all
therapy (endocrine
wszystkie)
that apply)
therapy) / Stem-cell
or bone marrow
transplant / Other /
Not sure
Validation
UX Notes Output Mapping
(Mobile)
Helper
Drives visibility of
(EN/PL):
Exclusive
modality-specific
brief
“Not sure”;
detail rows; each
one-liners
at least
selection spawns
for each
one tick if
Procedure /
modality;
“Not sure”
MedicationStatement
icons may
not chosen
/ Observation
help on
elements.
mobile.
3.2 Surgery details
Field KeyOptions /
Questi
Question (PL) Type Allowed
on (EN)
ValuesLogic (Show When)cancer[i].surgery.anyDid you
have
Czy miał(a)
surgery
Pan/Pani
as part
zabieg
of
operacyjny w
treatme
leczeniu tego
nt for
nowotworu?
this
cancer?Shown if
cancer[i].treatments_moda
lities does not include
Optiona
—
Surgery but site suggests l
surgery is common
(optional safety check)Optional
correction
layer for
users who
might have
missed
“Surgery”
checkbox.
cancer[i].surgery.year_mainYear of
main
cancer
surgery
(if any)cancer[i].treatments_moda Optiona Not in
lities includes Surgery
l
future“Jeśli było
kilka
operacji,
Procedure.performedDate
proszę podać
Time (year).
rok
najważniejsz
ej.”
What
type of
breast
cancer[i].surgery.breast_type
surgery
was
done?
Radi No / Yes / Not
o
sure
Rok głównego
zabiegu
1900–current
Year
onkologiczneg
year
o (jeśli był)
Jaki rodzaj
operacji piersi
przeprowadzo
no?
Breast-conserv
ing surgery
(lumpectomy,
segmentectom
y) / Single-side
mastectomy /
Show when
Sele Double
cancer[i].site_group =
ct
mastectomy
Breast
(both breasts
removed) /
Reconstruction
only / Not sure
/ Does not
apply
Requir
ed
Validati
on
UX Notes
(Mobile)
Optiona
—
l
Drives
mammograp
hy vs MRI vs
“no breast
tissue” hints;
keep neutral.
Output Mapping
If Yes, create Procedure
resource(s) with code
“cancer surgery” +
bodySite.
Procedure.bodySite +
extension
onkn.ca.breast_surgery_ty
pe.Options /
Questi
Question (PL) Type Allowed
on (EN)
Values
Field Key
Requir
ed
Logic (Show When)
Was the
uterus
Czy macica
and/or
i/lub oba jajniki
both
zostały
cancer[i].surgery.gyn_prophy ovaries
Radi No / Yes / Not
usunięte, aby
lactic
remove
o
sure
zmniejszyć
d to
ryzyko
reduce
nowotworu?
cancer
risk?
Validati
on
UX Notes
(Mobile)
Helps
interpret gyn
screening
needs vs
surgical
menopause.
cancer[i].site_group in
{Ovary/fallopian,
Optiona
Endometrium, Cervix} OR
—
l
ca.prophylactic_surgery.a
ny = Yes
Output Mapping
Procedure (hysterectomy /
bilateral
salpingo-oophorectomy)
with reason
“risk-reducing”; used by
derived flags (see §4).
3.3 Radiotherapy details
Field KeyQuestion
(EN)
Question
(PL)
cancer[i].rt.regio
nWhich
area(s) of Jakie okolice
the body
ciała były
Checkbox
received
napromienian es
radiotherap e?
y?
Type
How old
Ile miał(a)
were you
Pan/Pani lat
when you
podczas
cancer[i].rt.age_fi first
pierwszej
Number
rst
received
radioterapii z
radiotherap
powodu tego
y for this
nowotworu?
cancer?
Year of last Rok
cancer[i].rt.year_l
radiotherap zakończenia
ast
y session
radioterapii
Year
Options / Allowed
Values
Logic (Show When)
Head/neck/brain /
Chest/breast/mediasti
cancer[i].treatments_mod
num / Abdomen/pelvis
alities includes
/ Spine/limbs / Whole
Radiotherapy
body / Other / Not
sure
0–120 (integer)cancer[i].treatments_mod
alities includes
Radiotherapy
1900–current yearcancer[i].treatments_mod
alities includes
Radiotherapy
Requir
ed
Validati
on
UX Notes
(Mobile)
Output Mapping
Optiona
—
lTiny note: Procedure.category =
“Jeśli kilka radiotherapy; region
serii –
mapped to
wystarczy Procedure.bodySite; also
przybliżony Observation
obszar.”
onkn.ca.rt.region.
Optiona Range
l
0–120Important
for later
breast/thyr
oid
surveillanc
e flags, but
optional for
user
comfort.
Optiona Not in
l
futureHelper:
“Rok
zakończeni Procedure.performedDate
a całej serii Time (range end).
(ostatni
zabieg).”
Observation
onkn.ca.rt.age_first
(UCUM a). Used by
derived flags (chest RT
<30).
3.4 Drug treatments (chemo / targeted / immunotherapy)
Field Key
Questio
Question (PL)
n (EN)
Type
Options /
Allowed
Values
Logic (Show When)
Validati
Requir
on
UX Notes
ed
(Mobile)
Output Mapping
Classic
chemothera
py (IV or
oral) /
Targeted
Which
therapy
Short
drug
Jakie leczenie
(e.g.
examples
Each checked option →
treatmen
lekami otrzymał(a)
trastuzumab cancer[i].treatments_mo
Exclusiv under each
MedicationStatement
cancer[i].sys.type ts did
Checkbox
Optiona
Pan/Pani w
, TKIs) /
dalities includes Drug
e “Not
type; avoid
category=antineoplastic, class
s
you
es
l
związku z tym
Immunother treatments
sure”
brand names; code via local system
receive
nowotworem?
apy (e.g.
can show “i” (onkn.ca.sys.*).
for this
“checkpoint
tooltip.
cancer?
inhibitors”) /
Other
anti-cancer
medicines /
Not sure
Are you
still
taking
any of
these
cancer[i].sys.curr
anti-can
ent
cer
medicin
es for
this
cancer?
Czy nadal
przyjmuje
Pan/Pani któreś z
tych leków
Radio
przeciwnowotworo
wych z powodu
tego nowotworu?
Year
when
you
Rok zakończenia
finished
leczenia lekami
cancer[i].sys.year these
przeciwnowotworo Year
_last
anti-can
wymi (jeśli
cer
zakończone)
medicin
es (if
finished)
3.5 Hormone-blocking (endocrine) therapy
No / Yes /
Not sure
cancer[i].treatments_mo
Optiona
dalities includes Drug
—
l
treatments
cancer[i].treatments_mo
dalities includes Drug
1900–
Optiona Not in
treatments AND
current year
l
future
cancer[i].sys.current =
No
Feeds
“current
treatment”
MedicationStatement.effectivePe
banner and
riod.end unknown if Yes; used in
drug-interacti
derived.ca.current_treatment.
on advice in
doctor-discus
sion section.
Helper:
“Przybliżony
MedicationStatement.effectivePe
rok jest
riod.end.
wystarczający
.”Field Key
Question (EN)
Question (PL)
Optio
ns /
Allow
Type
Logic (Show When)
ed
Value
s
Validati
Requir on
UX Notes
ed
(Mobile
)
Output Mapping
Breast
cance
r/
W związku z którym
For which cancer
Prosta cancer[i].treatments_m
nowotworem
cancer[i].endocrine.indi was
Selec te
odalities includes
Option
stosowano leczenie
—
cation
hormone-blockin
t
cance Hormone-blocking
al
hormonozależne/blo
g therapy used?
r/
therapy
kujące hormony?
Other
/ Not
sureOnly visible for
cancers where
endocrine
MedicationStatement.reason
therapy is
Reference → this Condition;
typical; can be onkn.ca.endocrine.indication
auto-preselect enum.
ed from
site_group.
Are you currently Czy obecnie
taking
przyjmuje Pan/Pani
hormone-blockin leki blokujące
No /
g medicines (e.g. hormony (np.
cancer[i].endocrine.cur
Yes /
tamoxifen,
tamoksyfen,
Radio
rent
Not
aromatase
inhibitory
sure
inhibitor,
aromatazy, leczenie
androgen-depriva hormonalne raka
tion)?
prostaty)?cancer[i].treatments_m
odalities includes
Option
—
Hormone-blocking
al
therapyHelper:
“Dotyczy
tabletek/zastrz
yków
MedicationStatement.status +
przyjmowanyc Observation
h przez wiele onkn.ca.endocrine.current
lat po
(boolean).
zakończeniu
głównego
leczenia.”
Approximate total Łączny przybliżony
duration of
czas leczenia
0–20
cancer[i].endocrine.yea
Numb
hormone-blockin hormonozależnego
(step
rs_total
er
g therapy for this dla tego nowotworu
0.5)
cancer (years)
(w latach)cancer[i].treatments_m
odalities includes
Option Range
Hormone-blocking
al
0–20
therapyNumeric
stepper;
helper: “Jeśli
trwa – podaj
czas
dotychczasow
y.”
Observation
onkn.ca.endocrine.years_tota
l (UCUM a). Used by
derived.ca.longterm_endocrin
e.
3.6 Stem-cell / bone-marrow transplant (HSCT)
Field Key
Question
(EN)
Options /
Question (PL) Type Allowed
Values
Logic (Show When)
Require
d
Czy w związku
z tym
Did you have
No / Yes –
nowotworem
a
own cells
przebył(a)
bone-marro
(autologous cancer[i].treatments_modalitie
Pan/Pani
Selec
cancer[i].hsct.type w or
) / Yes –
s includes Stem-cell or bone
Optional
przeszczep
t
stem-cell
donor cells marrow transplant
szpiku lub
transplant for
(allogeneic)
komórek
this cancer?
/ Not sure
macierzystych
?
cancer[i].hsct.yea Year of
r
transplant
Rok
przeszczepu
Year
1900–
cancer[i].hsct.type ∈ {Yes –
current year own cells, Yes – donor cells}
Optional
Validatio UX
n (Mobile) Notes
Output Mapping
—Neutral
helper;
mention
that
details
Procedure (HSCT) with type;
will help
Observation onkn.ca.hsct.type.
in
long-ter
m
follow-up
planning.
Not in
future—
Procedure.performedDateTime
; used by
derived.ca.hsct_survivor.
4. Risk-reducing / prophylactic surgeries (global).
These may exist even without personal cancer, but are highly relevant; they also help interpret screening recommendations
without exposing “risk scores.”
Field Key
Question Question
(EN)
(PL)
Type
Czy
kiedykolwiek
miał(a)
Have you
Pan/Pani
ever had
zabieg
surgery
chirurgiczny
mainly to
wykonany
reduce
głównie w
ca.prophylactic_surgery.any cancer
Radio
celu
risk (not
zmniejszenia
because
ryzyka
of cancer
nowotworu
already
(a nie
present)?
leczenia
istniejącego
nowotworu)?
Options /
Allowed
Values
No / Yes /
Not sure
Logic (Show When)
Always (Advanced)
Validati
Requir
on
UX Notes
ed
(Mobile)
Option
al
Bilateral
mastectom
y (both
Which
breasts
risk-reduc Jakie zabiegi
removed) /
ca.prophylactic_surgery.typ ing
profilaktyczn Checkbo Bilateral
ca.prophylactic_surge Option
es
surgeries e
xes
removal of ry.any = Yes
al
have you wykonano?
ovaries &
had?
tubes /
Hysterecto
my (uterus
removed) /
—
Helper: “Np.
profilaktyczne
usunięcie piersi lub
jajników z powodu
obciążenia
rodzinnego/genetycz
nego.”
Output Mapping
Boolean; controls
visibility of surgery-type
checklist; interacts with
genetic/family history
modules.
Each → Procedure with
Exclusiv Keep wording simple; reason “risk-reducing”;
e “Not
explanatory tooltips
Observations
sure”
per option.
onkn.ca.prophylactic.*
for rules engine.Field Key
Question Question
(EN)
(PL)
Type
Options /
Allowed
Values
Logic (Show When)
Validati
Requir
on
UX Notes
ed
(Mobile)
Output Mapping
Large
bowel
partly or
fully
removed /
Thyroid
removed /
Other / Not
sure
Year of
Rok
main
głównego
ca.prophylactic_surgery.yea
risk-reduc zabiegu
Year
r_main
ing
profilaktyczn
surgery
ego
1900–
current
year
ca.prophylactic_surge Option
ry.any = Yes
al
Not in
future
—
Procedure.performedDat
eTime (year); may be
used for
hormone/menopause
context.
5. Derived (hidden; auto-computed) – Cancer history & treatment flags
These are not shown to the user; they feed the deterministic rules engine and high-level “Consider discussing with your
doctor...” chips on the plan, in line with the “inform, not diagnose / no risk scores” principle.
Values /
Logic (Inputs → Rule)
Rules
Field KeyLabel (EN)Label (PL)Type
Output Mapping
derived.ca.any_historyAny personal
history of cancerPrzebyta choroba
nowotworowaObservation
True if ca.any_history ∈ {Yes,
Boolea True/Fals
onkn.ca.flag.any_history (boolean).
Not sure} OR count(cancer[i]) ≥
n
e
Drives generic “cancer survivor”
1.
wording.
derived.ca.current_treatmentCurrently on active
cancer treatmentAktualnie leczony/a
z powodu
nowotworuTrue if ca.active_treatment_now
= Yes OR any
Observation
cancer[i].status_current =
Boolea True/Fals
onkn.ca.flag.current_treatment. If
“Active treatment now” OR
n
e
true, plan emphasises coordination
cancer[i].sys.current = Yes OR
with treating oncologist.
cancer[i].endocrine.current =
Yes.
derived.ca.num_primariesNumber of primary
cancersLiczba pierwotnych
nowotworówNumbe Integer
r
≥0Count distinct cancer[i] entries.Observation onkn.ca.num_primaries
(UCUM 1).
derived.ca.multiple_primariesMultiple primary
cancersWiele pierwotnych
nowotworówBoolea True/Fals True if
n
e
derived.ca.num_primaries ≥ 2.Observation
onkn.ca.flag.multiple_primaries. May
gate “consider genetic counselling”
advice (no risk %) in rules JSON.
derived.ca.childhood_survivorCancer diagnosed
in
childhood/teenage
yearsRozpoznanie
True if any cancer[i].age_at_dx
nowotworu w wieku Boolea True/Fals
< 21 (from derived or manual
dziecięcym/nastolet n
e
field).
nimObservation
onkn.ca.flag.childhood_survivor.
Triggers long-term survivorship
content.
derived.ca.young_onset_breast_g Young-onset
yn
breast/gyn cancerTrue if any cancer[i].site_group
∈ {Breast,
Wczesny rak
Boolea True/Fals
Ovary/fallopian/peritoneal,
piersi/jajnika/macicy n
e
Endometrium, Cervix} AND
cancer[i].age_at_dx ≤ 45.Observation
onkn.ca.flag.young_onset_breast_g
yn. May suggest discussion about
hereditary risk/family testing;
messaging remains
non-quantitative.
Przebyta choroba
nowotworowa jelita
grubegoBoolea True/Fals True if any cancer[i].site_group
n
e
∈ {Colon, Rectum}.Observation
onkn.ca.flag.colorectal_history.
Used to adapt colonoscopy
surveillance recommendations vs
population screening.
derived.ca.colorectal_historyPersonal history of
colorectal cancerderived.ca.chest_rt_lt30Chest/mediastinal
Radioterapia
radiotherapy before śródpiersia/klp
age 30
przed 30. r.ż.True if any
cancer[i].treatments_modalities
Boolea True/Fals includes Radiotherapy AND
n
e
cancer[i].rt.region includes
Chest/breast/mediastinum AND
cancer[i].rt.age_first < 30.Observation
onkn.ca.flag.chest_rt_lt30. Used for
enhanced breast/thyroid surveillance
rules (no risk % surfaced).
derived.ca.pelvic_rt_anyPelvic/abdominal
radiotherapyBoolea True/Fals True if any cancer[i].rt.region
n
e
includes Abdomen/pelvis.Observation
onkn.ca.flag.pelvic_rt_any. Used to
nuance colorectal/bladder follow-up.
derived.ca.hsct_survivorPrzebyta
History of
transplantacja
stem-cell/bone-marr
szpiku/komórek
ow transplant
macierzystychderived.ca.longterm_endocrineLong-term
hormone-blocking
therapy (≥5 years
total)
derived.ca.prophylactic_surgery_fl Risk-reducing
ag
surgery performed
Pattern suggesting
derived.ca.hereditary_pattern_pos
possible hereditary
sible
cancer syndrome
Radioterapia jamy
brzusznej/miednicy
Observation
onkn.ca.flag.hsct_survivor. Used for
Boolea True/Fals True if any cancer[i].hsct.type ∈
dedicated survivorship hints (e.g.,
n
e
{autologous, allogeneic}.
second cancers, vaccines) in
explanatory layer.
Długotrwałe
True if Σ over all
leczenie
Boolea True/Fals
cancer[i].endocrine.years_total
hormonozależne (≥5 n
e
≥ 5.
lat łącznie)
Observation
onkn.ca.flag.longterm_endocrine.
Used to tailor breast/gyn/prostate
follow-up and bone-health advice.
Wykonane zabiegi
profilaktyczneTrue if
Observation
ca.prophylactic_surgery.any =
onkn.ca.flag.prophylactic_surgery.
Boolea True/Fals
Yes OR any
Used for tailored explanations about
n
e
cancer[i].surgery.gyn_prophylac why screening schedule may differ
tic = Yes.
from “standard”.
Możliwy zespół
dziedzicznej
predyspozycji do
nowotworówTrue if any of:
derived.ca.multiple_primaries =
True;
derived.ca.young_onset_breast
Boolea True/Fals
_gyn = True;
n
e
derived.ca.childhood_survivor =
True AND another adult cancer;
ca.prophylactic_surgery.any =
Yes; any cancer[i].genetic_flag
Observation
onkn.ca.flag.hereditary_pattern_pos
sible. Only used to trigger neutral
“Consider asking your doctor about
hereditary risk or genetic
counselling” text – no risk scores, no
automatic labels.Field Key
Label (EN)
Label (PL)
Type
Values /
Logic (Inputs → Rule)
Rules
Output Mapping
= Yes. (Exact thresholds
adjustable in config.)
Implementation notes:
1.
2.
3.
4.
5.
Namespace & keys
o Keep cancer history under a dedicated namespace: ca.* and repeated cancer[i].*, plus derived flags under
derived.ca.*.
o This follows the pattern used for chronic conditions (cond.*) and symptoms (symptom[i].*).
Questionnaire → Guideline engine → AI explainer
o Persist raw answers as FHIR QuestionnaireResponse items (anonymous, session-only, per ONKONO
spec).
o Generate Condition, Procedure, MedicationStatement, and Observation resources in memory for the
guideline engine.
o The deterministic rules (preventive-plan-config.*.json) consume derived.ca.* flags and key raw fields (e.g.
cancer[i].site_group, year_dx) to select actions (no risk scoring).
o The AI layer may only turn selected actions into natural-language explanations and a “doctor discussion
guide”, never add new actions.
Anonymity & data minimisation
o Avoid storing any identifiers; years and age ranges are sufficient.
o All health data is processed in-memory and discarded at session end, consistent with project objectives.
UX patterns (mobile-first)
o Use progressive disclosure: show cancer[i] blocks only if ca.any_history = Yes. Inside each block, only
show treatment sub-sections when their modality is ticked.
o For large site_group lists, use searchable select with grouped headings (“Breast & gyn”, “Digestive”,
“Urinary & male”, “Skin”, “Blood cancers”, “Other”).
o Provide short, reassuring helper text; avoid alarmist phrasing and any numeric risk. (Same tone as
lifestyle/symptom sections.)
JSON shape (suggested)
o Mirror existing questionnaire spec: each field entry includes key, label_en, label_pl, type, options,
showWhen, required, validation, uxNotes, mapping.
o Derived flags can be implemented either in a dedicated derivation layer (derive-ca.ts) or as computed fields
in the rule engine, but exposed under the keys listed in §5 so the rules JSON remains declarative.
Family Cancer History
Notes for reading:
• famhx.rel[i] = repeatable “Relative” group (one card per relative).
• famhx.rel[i].cancer[j] = repeatable “Cancer” rows within each relative.
• [site] in derived fields = any cancer site group from the list below.
Table 1 – Core family cancer overview
Field Key
Questio Question
Type
n (EN) (PL)
Options /
Allowed Values
Logic (Show
When)
Validati
Requir
on
UX Notes
ed
(Mobile)
Output Mapping
YesHelper: EN
“Biological family =
parents, children,
full or half siblings,
grandparents,
aunts/uncles,
nieces/nephews,
One
first cousins.”PL
option
„Rodzina
must be
biologiczna =
selected
rodzice, dzieci,
rodzeństwo (także
przyrodnie),
dziadkowie,
ciocie/wujkowie,
siostrzeńcy/bratank
owie, kuzynostwo.”QuestionnaireResponse item
coded as
onkn.famhx.any_family_cancer.
Derived flags (Observations):
onkn.famhx.none (boolean),
onkn.famhx.adopted_unknown
(boolean).
Mother / Father /
„Którzy
Sister(s) /
Which członkowi
Brother(s) /
relatives e rodziny
Daughter(s) /
had
mieli
Son(s) /
Show when
famhx.quick_relatives cancer? nowotwór Checkbox Grandparent(s) /
famhx.any_family_c No
_chips
(You’ll ?
es (chips) Aunt(s) / Uncle(s)
ancer = Yes
add
(szczegół
/
details y podasz
Niece(s)/Nephew
next).
za
(s) / Cousin(s) /
chwilę).”
Other blood
relative / NoneHelper: used only
If None
to pre-spawn
selected
relative cards; user
, other
can still
chips
add/remove
disabled
relatives manually.Local enum list
onkn.famhx.quick_relatives (not
used directly in rules; only for
UI prefill).
„Czy u
Has
kogoś z
anyone Pana/Pani
in your bliskiej
close
rodziny
biologic biologicz
famhx.any_family_can
al family nej
Radio
cer
ever
kiedykolwi
been
ek
diagnos rozpozna
ed with no
cancer? nowotwór
złośliwy?”
Yes / No /
Adopted_or_unk
nown / Not_sure
Table 2 – Relative-level details (famhx.rel[i])
AlwaysQuestio
n (EN)
famhx.rel[i].relationshipMother /
Father /
Sister /
Brother /
Half-sister
/
Half-broth
er /
Daughter /
Son /
Maternal
grandmot
her /
Paternal
What is „Kim jest
grandmot
this
ten krewny
Show when
her /
relative’s w stosunku
famhx.any_family_c
Select Maternal
relations do
ancer = Yes and
grandfath
hip to
Pana/Pani?
relative card open
er /
you?
”
Paternal
grandfath
er / Aunt /
Uncle /
Niece /
Nephew /
Cousin
(first
cousin) /
Other
blood
relative /
Step-relati
ve
famhx.rel[i].side_of_familyWhich
„Z której
side of
strony
the family rodziny
is this
pochodzi
relative
ten
on?
krewny?”
Maternal
(your
mother’s
side) /
Paternal
(your
father’s
Radio side) /
Both
parents
(your
child) /
Not sure /
Not
applicable
famhx.rel[i].sex_at_birth„Jaką płeć
What sex
przypisano
was this
temu
relative
Radio
krewnemu
assigned
przy
at birth?
urodzeniu?”
famhx.rel[i].vital_statusIs this
relative
still
alive?
How old
is this
relative
now (or
famhx.rel[i].age_now_or_at how old
_death
were
they
when
they
died)?
famhx.rel[i].is_blood_relate
d
Question
(PL)
Options /
Allowed Logic (Show When) Required
Values
Field Key
Type
„Czy ten
krewny
żyje?”Alive /
Show when
Radio Deceased famhx.any_family_c
/ Not sure ancer = Yes
„Ile lat ma
ten krewny
obecnie
(lub ile
miał/miała
lat w chwili
śmierci)?”Show when
Numb Integer 0–
famhx.any_family_c
er
110
ancer = Yes
„Czy jest to
Is this a
krewny
blood
Toggl
biologiczny
relative
e
(spokrewnio
Yes / No
(biologica
Yes/N
ny
lly
o
genetycznie
related)?
)?”
Auto-filled from
relationship,
user-editable
Output Mapping
Helper: EN
“Include only
biological relatives
for cancer
patterns.
Step-relatives can
be added but
FHIR
One
won’t change your FamilyMemberHistory.relatio
option
plan.”PL „Wzorce nship (CodeableConcept).
required rodzinne liczymy
Local code
tylko dla krewnych onkn.famhx.relationship.*.
biologicznych.
Członków rodziny
„przybranej”
można dodać
informacyjnie – nie
wpływają na plan.”
Yes
Show when
relationship set AND
relative can be
Optional
mapped to a side
(blood relatives and
children)
Female /
Male /
Intersex /
Show when
difference
famhx.any_family_c
s in sex
ancer = Yes
developm
ent / Not
sure
Validati
on
UX Notes
(Mobile)
Enum
only
Optional
Enum
(recommend
only
ed)
Helpful for
“clusters on one
side of family”.Extension on
FamilyMemberHistory:
onkn.famhx.side_of_family.
Explain relevance
for
breast/ovarian/pro
state patterns.FamilyMemberHistory.sex or
equivalent extension. Local
code
onkn.famhx.sex_at_birth.
—Maps to
FamilyMemberHistory.decea
sed[x] (boolean or age/date
when extended).
OptionalEnum
onlyOptionalInteger
0–110; Helper:
soft
“Approximate age
warning is fine.”
if >100FamilyMemberHistory.age or
deceasedAge (Age, UCUM
a). Local code
onkn.famhx.age_now_or_at_
death.
Yes when
shownDefault Yes for all
except
Step-relative
(default No).
Drives inclusion in
derived flags.FamilyMemberHistory.exten
sion
onkn.famhx.is_blood_related
(boolean).
—
Table 3 – Cancer-level details per relative (famhx.rel[i].cancer[j])
Field KeyOptions / Allowed
Questi Questio
Logic (Show
Type Values (site
on (EN) n (PL)
When)
groups etc.)RequiredValidat
ion
UX Notes
(Mobil
e)
famhx.rel[i].cancer[j].site_group„Jakiego
breast – Breast
What
rodzaju
cancer (female or
type of
Selec
nowotw
male)ovarian –
cancer
t
ór miał
Ovarian/fallopian
did this
ten
tube/primaryYesOne
option
require
d
Within each rel[i]
when user taps
“Add cancer”
Output Mapping
Scrollable
FamilyMemberHistory.conditio
searchable n[n].code bound via codebook
select; lay
(SNOMED/ICD). Local enum
descriptions onkn.famhx.cancer.site_group.Field Key
Options / Allowed
Questi Questio
Logic (Show
Type Values (site
on (EN) n (PL)
When)
groups etc.)
relative krewny?
have? ”
famhx.rel[i].cancer[j].age_at_dx
Validat
ion
UX Notes
(Mobil
e)
peritoneal
canceruterine_endo
metrial –
Womb/uterus
(endometrial)
cancercervical –
Cervical
cancerprostate –
Prostate
cancercolorectal –
Bowel/colon/rectal
cancerstomach –
Stomach
canceresophagus –
Esophageal
cancerpancreas –
Pancreatic
cancerliver_bile –
Liver or bile duct
cancerkidney –
Kidney
cancerbladder_urin
ary – Bladder or
urinary tract
cancerlung – Lung
cancerhead_neck –
Mouth, throat,
larynx, nose,
sinusesbrain_cns –
Brain or spinal cord
tumourthyroid –
Thyroid
cancermelanoma –
Melanoma (serious
skin
cancer)non_melano
ma_skin – Other
skin cancer
(BCC/SCC
etc.)leukemia –
Leukemialymphom
a – Lymphoma
(Hodgkin or
non-Hodgkin)myelo
ma – Multiple
myelomasarcoma –
Sarcoma (bone or
soft
tissue)childhood_ot
her – Other
childhood cancer
(<18y)other – Other
cancerunknown_typ
e – Cancer, type
unknown
„Ile lat
How old miał/a
was this ten
relative krewny,
when
gdy po
this
raz
Num
Integer 0–110
cancer pierwsz ber
was
y
first
rozpozn
diagnos ano ten
ed?
nowotw
ór?”
For this
cancer,
did this
relative
have
cancer
in both
of the
famhx.rel[i].cancer[j].bilateral_or_ same
multiple
organs
or more
than
one
separat
e
cancer
of this
type?
Required
„Czy w
przypad
ku tego
nowotw
oru u
krewneg
o
wystąpił
nowotw
ór w
obu
Radi
takich
Yes / No / Not sure
o
samych
narząda
ch albo
kilka
odrębny
ch
nowotw
orów
tego
samego
typu?”
Output Mapping
for each
category.
Show when
site_group set
Helper: “If
you’re not
sure,
approximat
Optional
Integer
FamilyMemberHistory.conditio
e (e.g., 40,
(strongly 0–110;
n[n].onsetAge (Age, UCUM a).
50).”
recommen allow
Local code
Early-age
ded)
empty
onkn.famhx.cancer.age_at_dx.
cancers can
change
suggestions
.
Show only when
site_group in
{breast, kidney,
colorectal,
sarcoma,
Optional
melanoma,
uterine_endometrial
, ovarian, thyroid,
brain_cns}
Enum
only
Helper
examples:
EN “Both
breasts or
two
separate
colon
cancers”;
PL „Np.
nowotwór w
obu
piersiach
albo dwa
odrębne
raki jelita
grubego.”
FamilyMemberHistory.conditio
n[n].extension
onkn.famhx.bilateral_or_multipl
e (boolean/enum).Field Key
Options / Allowed
Questi Questio
Logic (Show
Type Values (site
on (EN) n (PL)
When)
groups etc.)
„Czy
Has a
lekarz
doctor przekaz
ever
ał, że
told this ten
relative nowotw
that this ór u
cancer krewneg
is linked o jest
to an
związan
Show when
famhx.rel[i].cancer[j].known_gen
Radi
inherite y z
Yes / No / Not sure famhx.rel[i].is_bloo
etic_syndrome
o
d gene dziedzic
d_related = Yes
change zną
(for
zmianą
exampl genetyc
e
zną (np.
BRCA, BRCA,
Lynch, zespół
APC,
Lyncha,
TP53)? APC,
TP53)?”
RequiredValidat
ion
UX Notes
(Mobil
e)
OptionalClarify:
question is
about the
relative’s
testing/diag
nosis, not
the user’s
own.
Enum
only
Output Mapping
Extension or flag on
FamilyMemberHistory.conditio
n[n]:
onkn.famhx.genetic_syndrome
_flag (enum/boolean).
Table 4 – Derived family history metrics (hidden; for rules engine)
These are not shown to users; they are computed after the questionnaire and exposed as FHIR Observations, category =
social-history, and then consumed by the deterministic guideline engine.
4.1 Patterned site-specific metrics (same pattern for each [site])
Applicable [site] values (linking back to site_group):
breast, ovarian, uterine_endometrial, colorectal, stomach, pancreas, prostate, melanoma, brain_cns, kidney, bladder_urinary,
thyroid, liver_bile, lung, leukemia, lymphoma, myeloma, sarcoma.
Field Key
Label (EN) Label (PL)
Type
Values /
Logic (Inputs → Rule)
Rules
Output Mapping / Notes
derived.famhx.[site].fdr_countNumber of
first-degree
relatives
with [site]
cancer„Liczba
Derived
krewnych I
0, 1, 2,
number
stopnia z
...
(integer)
rakiem [site]”Count all
famhx.rel[i].cancer[j].site_group
== [site] where
rel[i].is_blood_related = true and
relationship is parent, full/half
sibling, or child.
derived.famhx.[site].sdr_third_countNumber of
2nd–
3rd-degree
relatives
with [site]
cancer„Liczba
Derived
krewnych II–
0, 1, 2,
number
III stopnia z
...
(integer)
rakiem [site]”Count blood relatives with [site]
cancer whose relationship maps Observation code =
to 2nd or 3rd degree
onkn.famhx.[site].sdr_third_count,
(grandparents, aunts/uncles,
valueInteger.
nieces/nephews, first cousins).
Youngest
„Najmłodszy
age at
wiek
diagnosis of rozpoznania
derived.famhx.[site].youngest_dx_age_any [site] cancer raka [site] w
in family
rodzinie
(any
(dowolny
degree)
stopień)”
Take minimum of all age_at_dx
Derived
Minimum for blood relatives with [site]
number
age or
cancer; ignore empty/unknown
(integer
null
ages. Return null if no ages
or null)
known.
Observation code =
onkn.famhx.[site].fdr_count, valueInteger.
Used by rules like “≥1 FDR with early [site]
cancer → consider enhanced screening”.
Observation code =
onkn.famhx.[site].youngest_dx_age_any,
valueQuantity (UCUM a). Rules engine
can combine this with counts, e.g., < 50.
4.2 Aggregate metrics (all cancers)
Field Key
Label (EN)
Total blood
relatives
derived.famhx.total_blood_relatives_with_cancer
with any
cancer
Values Logic (Inputs →
/ Rules Rule)
Label (PL)Type
Output Mapping / Notes
„Łączna liczba
krewnych
biologicznych z
jakimkolwiek
nowotworem”Count distinct
famhx.rel[i] where
Derived
Observation code =
0, 1, 2, is_blood_related =
number
onkn.famhx.total_blood_relatives_with_cancer,
...
true and there is at
(integer)
valueInteger.
least one
cancer[j].
derived.famhx.first_degree_any„Czy występuje
Any
jakikolwiek
first-degree
nowotwór u
relative with
krewnego I
cancer
stopnia”Derived true /
boolean falsetrue if any
1st-degree blood
relative has ≥1
cancer[j].Observation code =
onkn.famhx.first_degree_any, valueBoolean.
derived.famhx.early_onset_anyAny cancer
diagnosed
before age
50 in a
blood
relative„Czy u
któregokolwiek
krewnego
biologicznego
rozpoznano
nowotwór przed
50 r.ż.”Derived true /
boolean falsetrue if any blood
relative has
age_at_dx < 50
for any cancer.Observation code =
onkn.famhx.early_onset_any, valueBoolean.
4.3 Pattern flags (family “clusters”, still non-predictive)Field Key
Label (EN)
Label (PL)
Type
Values /
Rules
Logic (Inputs →
(example;
Rule)
configurable)
true if e.g. ≥2
blood relatives
with breast
cancer (any
degree, at
least one <50) Implement as a rule
OR any
set over site-specific
„Wzorzec rodzinny
Breast/ovarian/pancreatic
Deriv ovarian cancer derived metrics and
rak
derived.famhx.pattern_breast_ovaria /prostate family cancer
ed
in blood
raw entries; exact
piersi/jajnika/trzustki/
n_cluster
cluster present (pattern
boole relative OR
thresholds can be
prostaty (flaga
flag)
an
male breast
tuned per guideline
wzorca)”
cancer OR
set without schema
combination of changes.
breast with
pancreas or
prostate in
blood
relatives.
Colorectal/endometrial
derived.famhx.pattern_colorectal_clu
family cancer cluster
ster
present (pattern flag)
„Wzorzec rodzinny
rak jelita
grubego/trzonu
macicy (flaga
wzorca)”
„Wzorzec rodzinny
wielu nowotworów
Multiple childhood or rare
derived.famhx.pattern_childhood_or
wieku dziecięcego
aggressive cancers in
_rare_cluster
lub rzadkich,
family (pattern flag)
agresywnych (flaga
wzorca)”
true if, for
example: ≥1
FDR with
colorectal
cancer <50
OR ≥2 blood
relatives with
Deriv colorectal on
ed
same side of
boole family OR mix
an
of colorectal +
uterine_endo
metrial /
ovarian /
stomach
cancers in
blood
relatives.
Output Mapping / Notes
Observation code =
onkn.famhx.pattern_breast_ovarian
_cluster, valueBoolean. Used only
as internal eligibility signal, never
as “high-risk” label to user
(consistent with “no risk scoring”
rule).
Uses
[site].fdr_count,
[site].sdr_third_count
,
Observation code =
[site].youngest_dx_a onkn.famhx.pattern_colorectal_clus
ge_any and
ter, valueBoolean.
side_of_family to
detect Lynch-like
clusters.
true if ≥2 blood
relatives with
sarcoma,
brain_cns,
Deriv
Runs over raw
leukemia, or
ed
cancers and
childhood_oth
boole
age_at_dx for the
er and at least
an
listed sites.
one diagnosis
<18 or multiple
diagnoses
<30.
Observation code =
onkn.famhx.pattern_childhood_or_r
are_cluster, valueBoolean. Useful
to gate “consider genetic
counselling” text, without explicit
risk scoring.
Implementation notes:
•
•
•
Interoperability
o Persist raw answers as FHIR QuestionnaireResponse items under a famhx.* prefix.
o For each famhx.rel[i] create a FamilyMemberHistory resource:
§ relationship, sex, age/deceased, is_blood_related, side_of_family as attributes/extensions.
§ Each cancer[j] row → FamilyMemberHistory.condition[n] with coded cancer site and onsetAge.
o Emit Observation resources for:
§ Site-specific derived metrics: derived.famhx.[site].fdr_count, .sdr_third_count,
.youngest_dx_age_any.
§ Global flags: derived.famhx.total_blood_relatives_with_cancer, .first_degree_any,
.early_onset_any.
§ Pattern flags: derived.famhx.pattern_breast_ovarian_cluster, .pattern_colorectal_cluster,
.pattern_childhood_or_rare_cluster.
o Use local codes onkn.famhx.* now; bind to SNOMED CT / LOINC / HGNC in the codebook later (to avoid
breaking UI when mappings change).
Units, ages & dates
o Ages (age_now_or_at_death, age_at_dx) always in years, UCUM a when stored as Quantity.
o No calendar dates required here; everything can be expressed as age in years → lighter cognitive load and
no date math in UI.
o Allow approximate ages; no need for decimals (integer 0–110, soft checks for >100).
Progressive disclosure
o One core control famhx.any_family_cancer drives everything:
§ No → hide the whole section; fire derived none_flag.
§ Adopted_or_unknown → hide detailed inputs; fire adopted_unknown_flag.
§ Yes → show helper chips and “Add relative” button.
o Within each relative card:
§ Start with relationship + side_of_family + sex_at_birth.
§ Only when the user taps “Add cancer for this relative” show the nested cancer rows.o
•
•
•
•
•
•
Show advanced questions (bilateral_or_multiple, known_genetic_syndrome) only when they matter
(specific sites / blood relatives).
No risk scores in UI
o Consistent with ONKONO’s “no risk scoring or predictive metrics” rule:
§ Do not show “high/medium/low risk family history” labels.
§ Use derived flags only to enable or suppress guideline actions (e.g. “consider enhanced breast
screening”) in the plan.
§ Any banners/chips shown to the user should be phrased as “Consider...” / “To discuss with
your doctor...”, not “You are high risk”.
Accessibility & mobile
o Use steppers or numeric keypad for ages; 0–110 bounds; simple integer fields.
o Relative cards must be collapsible and keyboard-accessible:
§ Focus order: relationship → side_of_family → sex → alive/deceased → age → “Add cancer”.
o Chips for quick relatives and site groups: large hit areas, clear focus outline, EN/PL labels from i18n
resource files.
o Make “None” or “No cancer history” an exclusive chip where applicable.
Safety microcopy
o Keep wording neutral and non-alarmist – this block is informational, not diagnostic:
§ Emphasise that many people with cancer in the family never develop cancer themselves, and
vice versa.
§ For early-age cancers (e.g. <50) show soft explanations (“This can change which screening
tests are recommended”) rather than warning language.
o Where pattern flags are triggered (e.g. breast/ovarian cluster), let the plan text say:
§ “Your answers suggest it may be useful to discuss family-linked cancers with your doctor. This
does not mean you will get cancer.”
Versioning
o Tag this derivation set as onkn.famhx.v2025.1 in:
§ Observation.note or a dedicated extension on all derived.famhx.* Observations.
§ Optional: add questionnaireVersion to QuestionnaireResponse so guideline rules can be
version-aware.
Analytics (background, not user-facing)
o For anonymous analytics, you may log (without any identifiers):
§ Number of relatives entered.
§ Presence of early-onset family cancer (derived.famhx.early_onset_any).
§ Whether major pattern flags are true/false.
o Do not log the exact combination of rare cancers and relationships in a way that could become
re-identifiable; aggregate into coarse features only (e.g. “≥2 FDR with breast cancer” yes/no).
Front-end data model
o Represent relatives as a repeatable array:
§ famhx.rel: Relative[] with nested cancer: Cancer[].
o Use stable, internal id for each relative/cancer row in the UI to support edit/delete without relying only on
array index.
o When a relative card is deleted, recompute derived metrics in memory before sending the payload to the
guideline engine.
Microcopy (helpers; one-liners)
These are short hints you can drop under the questions (PL; add EN in your i18n as needed):
•
•
•
•
•
•
Biologiczna rodzina (core question)
„Rodzina biologiczna = rodzice, dzieci, rodzeństwo (także przyrodnie), dziadkowie, ciocie/wujkowie,
siostrzeńcy/bratankowie, kuzynostwo.”
Adopcja / brak danych
„Jeśli jesteś adoptowany/a lub znasz tylko część historii rodzinnej, zaznacz to i podaj jedynie informacje, które
pamiętasz.”
Wiek rozpoznania nowotworu
„Jeśli nie pamiętasz dokładnie wieku, wpisz przybliżoną wartość (np. «40» lub «50» lat).”
Krewny biologiczny vs przybrany
„Wzorce rodzinne liczymy tylko dla krewnych biologicznych. Członków rodziny «przybranej» można dodać
informacyjnie – nie wpływają na plan badań.”
Wzorce rodzinne (pattern flags)
„Ta część pomaga lekarzowi zdecydować, czy potrzebne są inne badania. Nie obliczamy tu «ryzyka» ani nie
stawiamy rozpoznania.”
Genetyka (BRCA, Lynch itp.)
„Zaznacz «Tak» tylko wtedy, gdy lekarz wyraźnie poinformował o dziedzicznej zmianie genetycznej (np. BRCA,
zespół Lyncha). Jeśli masz wątpliwości, wybierz «Nie wiem».”
Optional “lean” codebook stubs (local codes)
You can keep these as local dot-style codes and bind to SNOMED/LOINC/HGNC later in your codebook.•
•
•
•
•
Questionnaire items (raw)
o onkn.famhx.any_family_cancer
o onkn.famhx.quick_relatives
o onkn.famhx.rel.relationship.* (e.g. .mother, .father, .sister, .brother, .half_sister, .half_brother, .daughter,
.son, .gm.maternal, .gm.paternal, .gf.maternal, .gf.paternal, .aunt, .uncle, .niece, .nephew, .cousin,
.other_blood, .step_relative)
o onkn.famhx.rel.side_of_family (maternal, paternal, both_parents, unknown, na)
o onkn.famhx.rel.sex_at_birth (female, male, intersex, unknown)
o onkn.famhx.rel.vital_status (alive, deceased, unknown)
o onkn.famhx.rel.age_now_or_at_death
o onkn.famhx.rel.is_blood_related
Cancer rows per relative
o onkn.famhx.cancer.site_group with values:
breast, ovarian, uterine_endometrial, cervical, prostate, colorectal, stomach, esophagus, pancreas,
liver_bile, kidney, bladder_urinary, lung, head_neck, brain_cns, thyroid, melanoma, non_melanoma_skin,
leukemia, lymphoma, myeloma, sarcoma, childhood_other, other, unknown_type.
o onkn.famhx.cancer.age_at_dx
o onkn.famhx.cancer.bilateral_or_multiple (yes, no, unknown)
o onkn.famhx.cancer.genetic_syndrome_flag (yes, no, unknown)
Derived site-specific metrics (patterned by [site] from the list above)
o onkn.famhx.[site].fdr_count
o onkn.famhx.[site].sdr_third_count
o onkn.famhx.[site].youngest_dx_age_any
Global derived metrics & pattern flags
o onkn.famhx.total_blood_relatives_with_cancer
o onkn.famhx.first_degree_any
o onkn.famhx.early_onset_any
o onkn.famhx.pattern_breast_ovarian_cluster
o onkn.famhx.pattern_colorectal_cluster
o onkn.famhx.pattern_childhood_or_rare_cluster
Versioning tag
o onkn.famhx.v2025.1 as a profile/version marker in Observation.note or extension.
Genetics
1. User-facing genetics questions
Field keyQuestion (EN)
gen.testing_everCzy
kiedykolwiek
miał(a)
Pan/Pani
Have you ever
wykonane
had a genetic test
badanie
for inherited
genetyczne w
cancer risk (on
kierunku
blood or saliva)?
dziedzicznego
ryzyka
nowotworów (z
krwi lub śliny)?
Have you ever
been told that
you carry a
genetic change
gen.path_variant_sel
(pathogenic or
f
likely pathogenic
variant) that
increases your
cancer risk?
Question (PL)
Type
Radio
Czy
kiedykolwiek
poinformowano
Pana/Panią, że
u Pana/Pani
stwierdzono
zmianę
genetyczną
Radio
(mutację
patogenną lub
prawdopodobni
e patogenną),
która zwiększa
ryzyko
nowotworu?
Czy u
Has any blood
kogokolwiek z
relative been
krewnych
found to have a
stwierdzono
pathogenic or
patogenny lub
likely pathogenic
gen.path_variant_fa
prawdopodobni
variant in a
Radio
mily
e patogenny
cancer-predisposi
wariant w genie
tion gene (e.g.,
predysponujący
BRCA1/2 or a
m do
Lynch syndrome
nowotworów
gene)?
(np. BRCA1/2,
Options / Allowed values
(summary)
never / yes_report /
yes_no_details / not_sure
Logic (Show when)
Always
Require
Notes / Output mapping
d?
Yes
Short helper: includes
BRCA1/2 and multi-gene
hereditary cancer panels
ordered by a doctor; excludes
ancestry-only tests. Map as
Observation or
DiagnosticReport flag
onkn.gen.testing_ever.
Recommended: show if Yes
no / yes / vus_only / not_sure gen.testing_ever !=
(when
never (or Always)
shown)Explain that VUS ≠ confirmed
risk variant; “Yes” only if
report says
“pathogenic”/“likely
pathogenic”. Map as
Condition or Observation
onkn.gen.path_variant_self.
no / yes_first_deg /
yes_other / not_sureTip: if several relatives,
choose the closest degree.
Map as FamilyMemberHistory
flag
onkn.gen.path_variant_family
.
Always
YesField key
Question (EN)
Question (PL)
Type
Options / Allowed values
(summary)
Logic (Show when)
Require
Notes / Output mapping
d?
geny zespołu
Lyncha)?
Jakiego typu
badanie
genetyczne
miał(a)
Pan/Pani
wykonane?
single_brca (single-gene,
e.g. BRCA1/2 only) /
panel_breast_ovarian
(hereditary breast/ovarian
panel) / panel_multicancer
(multi-cancer panel – dozens
of genes) /
gen.testing_ever in
Checkboxes
panel_colorectal_polyposis
{yes_report,yes_no_de No
(multi-select)
(colorectal / polyposis panel, tails}
e.g. Lynch, APC, MUTYH,
POLE, POLD1) /
exome_genome
(WES/WGS) /
tumor_only_with_germline_s
uspect / other
gen.test_typeWhat type of
genetic testing
have you had?
gen.test_year_firstW którym roku
po raz pierwszy
In which year did wykonano u
you first have
Pana/Pani
Number
1990–current year
genetic testing for badanie
(year, YYYY)
cancer risk?
genetyczne w
kierunku ryzyka
nowotworów?
Którego genu /
których genów
dotyczy
Pana/Pani
wynik?
(zaznacz
wszystkie
właściwe)
Which gene(s)
are affected in
your test result?
(Select all that
apply)
gen.mutyh_biallelicJeśli genem jest
If your gene is
MUTYH: czy w
MUTYH: did your wyniku
report say that
napisano, że
both copies of
zmiany dotyczą
Radio
the gene are
obu kopii genu
changed (biallelic (tzw. biallelic
MUTYH-associat MUTYH-associ
ed polyposis)?
ated
polyposis)?
gen.family_genesJeśli krewny
If a relative has a
ma stwierdzoną
known
mutację
pathogenic
patogenną,
variant, which
którego genu
gene is it in?
ona dotyczy?
gen.prs_doneCzy miał(a)
Pan/Pani
Have you had a wykonany
genomic or
genomowy test
polygenic risk
ryzyka lub tzw.
score test that
polygenic risk
reported your
score, który
future risk of
podawał
Radio
common
przyszłe
diseases (e.g.
ryzyko
breast, colorectal częstych
or prostate
chorób (np.
cancer)?
raka piersi,
jelita grubego,
prostaty)?
For which cancer
types did the
gen.prs_cancers_fla
report say your
gged
risk was higher
than average?
Dla jakich
nowotworów w
raporcie
napisano, że
Pana/Pani
ryzyko jest
Validate as 1990–current
year, not in future.
gen.testing_ever in
Approximate year allowed.
{yes_report,yes_no_de Optional Map as
tails}
DiagnosticReport.effectiveDat
eTime or Observation
onkn.gen.test_year_first.
Breast/ovarian – high
penetrance: BRCA1,
BRCA2, PALB2, TP53,
PTEN, CDH1, STK11, NF1
Breast/ovarian – moderate:
ATM, CHEK2, BARD1,
BRIP1, RAD51C, RAD51D,
NBN Lynch (MMR): MLH1,
MSH2, MSH6, PMS2,
EPCAM
Colorectal/polyposis &
related: APC, MUTYH,
Checkboxes POLE, POLD1, SMAD4,
(multi-select, BMPR1A, NTHL1
gen.path_variant_self =
No
grouped in
Pancreatic / GI /
yes
UI)
multi-organ: CDKN2A,
PRSS1, DICER1, PTCH1,
SUFU Renal: VHL, FH,
FLCN, MET, SDHB, SDHC,
SDHD, BAP1 Endocrine /
MEN / neuroendocrine:
MEN1, RET, MAX, TSC1,
TSC2 Melanoma / other:
CDKN2A, CDK4,
MITF_E318K
Other/unknown:
other_specified,
unknown_gene
gen.self_genes
yes_biallelic / no_monoallelic Show if gen.self_genes
No
/ not_sure
includes MUTYH
Checkboxes
Same gene options as
(same gene
gen.self_genes +
list as
other_specified,
gen.self_gen
unknown_gene
es)
Allow none if not sure. Short
examples under each. Map to
DiagnosticReport.category /
Observation
onkn.gen.test_type.*.
gen.path_variant_famil
y in
No
{yes_first_deg,yes_oth
er}
Genes reflect current
high/moderate-penetrance
hereditary cancer panels; UI
groups by syndrome; user
may skip if not sure. Map
each selected gene to
Condition (genetic
susceptibility) and/or
Observation with HGNC
code; raw array
onkn.gen.self_genes[].
Important for distinguishing
MUTYH-associated polyposis
(biallelic) vs monoallelic
carrier. Map as Observation
onkn.gen.mutyh_biallelic.
If multiple relatives with
different genes, user picks
the one doctors focus on /
they worry most about. Map
into FamilyMemberHistory +
Observation
onkn.gen.family_genes[].
NoHelper: examples of
PRS-type tests giving
“below/average/above” risk
for several diseases.
ONKONO does not calculate
its own scores. Map to
Observation
onkn.gen.prs_done.
breast / colorectal / prostate /
gen.prs_done in
Checkboxes ovarian / melanoma /
{yes_clinical,yes_cons No
(multi-select) pancreatic / other /
umer}
none_highernone_higher mutually
exclusive with other options.
Only mark cancers where
report clearly said “higher /
above average”. Map as
Observation
never / yes_clinical
(clinical/insurer) /
yes_consumer
Always
(direct-to-consumer genomic
test) / not_sureField key
Question (EN)
Question (PL)
Type
Options / Allowed values
(summary)
Logic (Show when)
Require
Notes / Output mapping
d?
wyższe niż
przeciętne?
Overall, how did
gen.prs_overall_ban the test describe
d
your genetic risk
for cancer?
onkn.gen.prs_cancers_flagge
d.
Ogólnie, jak test
opisywał
Pana/Pani
Radio
genetyczne
ryzyko
nowotworów?
lower / average / higher /
mixed / not_sure
gen.prs_done in
{yes_clinical,yes_cons No
umer}
Clarify: ONKONO will not
recalculate or display numeric
risk; this is just context. Map
as Observation
onkn.gen.prs_overall_band.
2. Derived (hidden) genetics flags (for rules engine only)
Field key
Label (EN)
High-penetrance
derived.gen.high_penetrance_carrie
hereditary cancer
r
syndrome present
Label (PL)
Type
Rule / values
Notes / Output mapping
true if any of: High-penetrance
breast/ovarian genes: BRCA1,
BRCA2, PALB2, TP53, PTEN,
CDH1, STK11, NF1 Lynch (MMR):
Wysokopenetracyj
MLH1, MSH2, MSH6, PMS2,
Internal eligibility flag only (no UI). Map to
ny zespół
Boolea EPCAM Polyposis/GI: APC,
Observation
dziedzicznej
n
biallelic MUTYH (gen.mutyh_biallelic onkn.eligibility.gen.high_penetrance_carrie
predyspozycji
= yes_biallelic), POLE, POLD1,
r (boolean).
nowotworowej
SMAD4, BMPR1A, NTHL1 Other
high-risk syndromes: VHL, FH,
FLCN, MET, MEN1, RET, BAP1,
TSC1, TSC2, CDKN2A
Wariant genu o
Moderate-penetran umiarkowanej
derived.gen.moderate_penetrance_
ce cancer gene
penetracji – bez
only
variant only
innych zespołów
wysokiego ryzyka
true if: gen.path_variant_self = yes
AND
derived.gen.high_penetrance_carrie
Boolea r = false AND all genes in
n
gen.self_genes ∈ moderate list
(ATM, CHEK2, BARD1, BRIP1,
RAD51C, RAD51D, NBN,
monoallelic MUTYH, etc.).Used to route to “moderate-risk” screening
recommendations (e.g. intensified breast
screening, but not full high-risk protocols).
Map to Observation
onkn.eligibility.gen.moderate_penetrance_
only.
derived.gen.lynch_syndromeConfirmed Lynch
syndrome gene
variantPotwierdzony
wariant genu
zespołu Lynchatrue if any of MLH1, MSH2, MSH6,
Boolea
PMS2, EPCAM selected in
n
gen.self_genes.Drives Lynch-specific
colorectal/endometrial surveillance rules.
Map to Observation onkn.eligibility.lynch.
derived.gen.polyposis_syndromeHereditary
polyposis
syndromeDziedziczny
zespół
polipowatościtrue if any of: APC OR (MUTYH in
gen.self_genes AND
Boolea
gen.mutyh_biallelic = yes_biallelic)
n
OR POLE OR POLD1 OR SMAD4
OR BMPR1A OR NTHL1.Used for colonoscopy surveillance
frequency, potential upper GI surveillance,
etc. Map to Observation
onkn.eligibility.polyposis.
derived.gen.prs_elevatedPolygenic risk
score indicates
elevated cancer
risktrue if gen.prs_done in
Polygenic risk
{yes_clinical,yes_consumer} AND
score – wskazane Boolea (any cancer in
podwyższone
n
gen.prs_cancers_flagged or
ryzyko nowotworu
gen.prs_overall_band in
{higher,mixed}).Allows rules like “Consider earlier
discussion of screening due to genomic
test showing elevated risk” without
ONKONO computing scores. Map to
Observation onkn.eligibility.prs_elevated.
Any genetic factor
derived.gen.any_genetic_risk_factor increasing cancer
risk present
Występuje
jakikolwiek czynnik
Boolea
genetyczny
n
zwiększający
ryzyko nowotworu
true if any of:
derived.gen.high_penetrance_carrie
r = true OR
derived.gen.moderate_penetrance_
only = true OR
derived.gen.prs_elevated = true OR
gen.path_variant_family in
{yes_first_deg,yes_other}.
Simple aggregate “genetic risk present”
switch for high-level plan logic. Map to
Observation
onkn.eligibility.any_genetic_risk_factor.
Implementation notes:
• Interoperability
• Persist raw answers as FHIR QuestionnaireResponse.item under a gen.* prefix:
gen.testing_ever, gen.path_variant_self, gen.path_variant_family, gen.test_type, gen.test_year_first,
gen.self_genes[], gen.self_genes_other_label, gen.mutyh_biallelic, gen.family_genes[],
gen.family_genes_other_label, gen.prs_done, gen.prs_cancers_flagged[], gen.prs_overall_band.
•
•
•
•
For each self P/LP variant (personal carrier status):
o Create a Condition Genetic susceptibility to malignant neoplasm with:
§ code → local onkn.gene.{symbol} (e.g. onkn.gene.BRCA1), HGNC/SNOMED bindings in the
codebook later.
§ evidence / extension for gene symbol and, if needed, free-text variant description.
For family P/LP variants (gen.path_variant_family, gen.family_genes[]):
o Use FamilyMemberHistory (from the famhx section) and attach the gene information as
FamilyMemberHistory.condition[n].extension with onkn.gene.*.
o You don’t need a full pedigree here – the coarse distinction (first-degree vs other) is enough for rules.
PRS and overall bands → Observation resources:
o onkn.gen.prs_done, onkn.gen.prs_cancers_flagged, onkn.gen.prs_overall_band with
valueCodeableConcept from a small local valueset (lower/average/higher/mixed, site enums).
Derived genetics flags → separate Observations (category: risk-assessment / social-history):
o derived.gen.high_penetrance_carrier
o derived.gen.moderate_penetrance_only
o derived.gen.lynch_syndrome•
•
o
o
o
derived.gen.polyposis_syndrome
derived.gen.prs_elevated
derived.gen.any_genetic_risk_factor
Code systems / namespaces:
o onkn.gen.* – raw questionnaire items.
o onkn.gene.* – specific gene codes (HGNC mapping later).
o onkn.eligibility.gen.* – derived eligibility flags.
All mappings should be maintained in your static codebook, not in the UI, so future SNOMED/LOINC/HGNC changes
don’t break the product.
• Units, ages & dates
•
•
•
Year-only for test timing (gen.test_year_first): integer YYYY, range 1900–current year, no exact dates required.
No need to store exact date of report or variant discovery; year is enough for “test is recent vs very old” logic.
No ages are needed on the genetics side (ages at diagnosis stay in famhx.*); keep all units as simple integers or
enums.
• Progressive disclosure
•
•
Use a two-step approach:
1. Simple high-level questions for everyone:
§ gen.testing_ever (ever tested?)
§ gen.path_variant_self (told you have a pathogenic variant?)
§ gen.path_variant_family (known variant in relatives?)
2. Show advanced controls only when relevant:
§ If gen.testing_ever != never → show gen.test_type, gen.test_year_first, and, if
gen.path_variant_self = yes, the gen.self_genes group.
§ If gen.self_genes includes MUTYH → only then show gen.mutyh_biallelic.
§ If gen.path_variant_family in {yes_first_deg, yes_other} → show gen.family_genes + “Other
gene” textbox.
§ If gen.prs_done in {yes_clinical, yes_consumer} → show PRS details (gen.prs_cancers_flagged,
gen.prs_overall_band).
Keep gene lists grouped and collapsible (e.g. “Breast/ovarian genes”, “Lynch genes”, “Polyposis genes”), especially
on mobile.
• No risk scores in UI
•
•
•
Genetics must fully respect ONKONO’s “no risk scoring or predictive metrics” constraint:
o Do not display calculated lifetime risk, 10-year risk, “10× higher than average”, percentile ranks, etc.
o PRS outputs are stored only as broad bands (lower, average, higher, mixed), and even those come from
the user’s report, not ONKONO’s calculation.
derived.gen.* flags are used only to:
o Turn guideline actions on/off (e.g. “Consider referral to a genetics clinic”, “Discuss higher-intensity
colonoscopy schedule”).
o Gate textual advice phrased as “Consider...” / “You may wish to discuss...”, never “You are high risk” or
similar.
The AI layer (explainer) must not invent new investigations based on genetics; it can only rephrase the actions
chosen deterministically by the rules engine.
• Accessibility & mobile
• Use large, tappable chips for the main gene groups and statuses (e.g. “Lynch genes”, “Polyposis genes”) and allow
expansion to see the exact genes.
•
•
•
•
Keep maximum 4–6 gene options per viewport; offer search-style filter (simple “type to filter” over gene symbols)
only if it stays performant on low-end devices.
Radio groups for yes/no/not sure questions (gen.testing_ever, gen.path_variant_self, gen.prs_done) should:
o Be keyboard accessible.
o Have a stable focus order: testing → self variant → family variant → details.
Year inputs: numeric keypad, range guards (1900–current year) with soft validation messages instead of hard blocks
whenever possible.
Free-text *_other_label fields: keep them short (max 30 chars) and auto-uppercase so “brca1” becomes “BRCA1” in
the payload.
• Safety microcopy
•
•
Core messaging: inform, not alarm.
o Emphasise that having a variant does not mean the person will necessarily get cancer.
o Equally, not finding a variant does not guarantee that cancer will never occur.
For high-penetrance flags (e.g. BRCA, Lynch, APC, biallelic MUTYH):
o Plan text should say: “Because you reported a known hereditary change in a high-risk gene, doctors often
recommend a different screening schedule. This is something to discuss with your doctor or a genetics
clinic.”•
•
For PRS:
o
Explain that polygenic risk scores are just one piece of the puzzle, and ONKONO only uses the category
given in the user’s report.
For “not sure” options:
o Suggest bringing reports to their doctor or genetics clinic; never urge users to order new commercial tests.
• Versioning
•
•
Tag genetics derivations as onkn.gen.v2025.1:
o Put this version tag in Observation.note or a dedicated extension on all derived.gen.* Observations.
o Optionally store the genetics questionnaire version alongside other questionnaire metadata so rules can be
version-aware.
When you change gene lists or logic (e.g. promote a moderate-risk gene to high-risk based on new evidence), bump
to onkn.gen.v2025.2 etc. and keep backward-compatible analytics mappings.
• Analytics (background, not user facing)
•
•
•
For anonymous analytics you may log, without any identifiers:
o Whether any genetic factor was reported (derived.gen.any_genetic_risk_factor).
o Simple buckets such as:
§ “High-penetrance carrier (self)”
§ “Moderate-penetrance only”
§ “Family variant only (not tested)”
§ “PRS elevated only”
o Count of users selecting “not sure” in the key questions (helps refine wording).
Do not log:
o Full combinations of rare genes + family structures + symptoms – risk of re-identification.
o Free-text gene names from *_other_label for rare genes; instead map to “other_gene_reported = true”.
Keep analytics feature set very small and boolean/enums-only, mirroring the approach in the contract (no user health
data persisted beyond high-level anonymous logs).
• Front end data model
•
Represent genetics answers as a flat object plus arrays; derived flags are computed in memory and never manually
edited:
type GenState = {
testing_ever: 'never' | 'yes_report' | 'yes_no_details' | 'not_sure';
path_variant_self: 'no' | 'yes' | 'vus_only' | 'not_sure';
path_variant_family: 'no' | 'yes_first_deg' | 'yes_other' | 'not_sure';
test_type: string[];
// enum codes
test_year_first?: number;
self_genes: string[];
// BRCA1, CHEK2, MUTYH, other_specified, unknown_gene...
self_genes_other_label?: string;
mutyh_biallelic?: 'yes_biallelic' | 'no_monoallelic' | 'not_sure';
family_genes: string[];
family_genes_other_label?: string;
prs_done: 'never' | 'yes_clinical' | 'yes_consumer' | 'not_sure';
prs_cancers_flagged: string[]; // breast/colorectal/prostate/...
prs_overall_band?: 'lower' | 'average' | 'higher' | 'mixed' | 'not_sure';
}
• On submit:
o Send gen.* to /api/assess together with other sections.
o The server-side guideline engine computes derived.gen.* and uses them to select actions in preventive-
plan-config.*.json.
o No genetics data ends up in the operational DB; only anonymous event logs do, per your architecture.
• Microcopy (helpers; one-liners – PL, EN via i18n)
You can drop these hints under the relevant controls (PL text here; EN goes into i18n):
• Badania genetyczne ogólnie (gen.testing_ever)
„Dotyczy badań zlecanych przez lekarza lub poradnię genetyczną (np. BRCA1/2, panele wielogenowe). Nie dotyczy
testów czysto genealogicznych / przodków.”
•
•
•
Wariant patogenny vs VUS (gen.path_variant_self)
„Zaznacz «Tak» tylko wtedy, gdy w opisie wyniku napisano wyraźnie, że wariant jest patogenny lub prawdopodobnie
patogenny. Wariant «o niepewnym znaczeniu» (VUS) wybierz osobno.”
Mutacje rodzinne (gen.path_variant_family, gen.family_genes)
„Jeśli dotyczy kilku osób w rodzinie, wybierz najbliższego krewnego lub ten gen, na który lekarze zwracali największą
uwagę.”
Lista genów (gen.self_genes)
„Jeśli nie pamiętasz dokładnie, możesz zaznaczyć tylko grupę (np. geny zespołu Lyncha) albo wybrać «Nie wiem».”•
•
MUTYH – jedna czy dwie kopie? (gen.mutyh_biallelic)
„Ta informacja pomaga odróżnić nosicielstwo jednej zmiany od zespołu polipowatości, który wymaga innego nadzoru
jelita grubego.”
Testy PRS / genomowe (gen.prs_*)
„Nie przeliczamy tutaj ryzyka. Jeśli masz wynik typu «ryzyko nieco wyższe niż przeciętne», wybierz odpowiednią
opcję – to tylko wskazówka do rozmowy z lekarzem.”
• Optional “lean” codebook stubs (local codes)
•
•
Questionnaire items (raw)
o onkn.gen.testing_ever
o onkn.gen.path_variant_self
o onkn.gen.path_variant_family
o onkn.gen.test_type.single_brca / .panel_breast_ovarian / .panel_multicancer / .panel_colorectal_polyposis /
.exome_genome / .tumor_only_with_germline_suspect / .other
o onkn.gen.test_year_first
o onkn.gen.self_genes.BRCA1, .BRCA2, .PALB2, .TP53, .PTEN, .CDH1, .STK11, .NF1, .ATM, .CHEK2, etc.
+ .other_specified, .unknown_gene
o onkn.gen.self_gene_other
o onkn.gen.mutyh_biallelic
o onkn.gen.family_genes.* mirror of self_genes
o onkn.gen.family_gene_other
o onkn.gen.prs.done, .prs.cancers_flagged, .prs.overall_band
Derived flags
o onkn.eligibility.gen.high_penetrance_carrier
o onkn.eligibility.gen.moderate_penetrance_only
o onkn.eligibility.gen.lynch_syndrome
o onkn.eligibility.gen.polyposis_syndrome
o onkn.eligibility.gen.prs_elevated
o onkn.eligibility.gen.any_genetic_risk_factor
o Version marker: onkn.gen.v2025.1 as profile/extension on these Observations.
Screening history and Immunization
Screening history – field specifications
Question
(PL)
Options /
Allowed
Values
Field KeyQuestion
(EN)
screen.summaryCervical
smear/HPV
test •
Breast
imaging
(mammogr
aphy /
ultrasound
/ MRI) •
Bowel
cancer
screening
(colonosco
py /
Które z
sigmoidosc
Which of the poniższych
opy / stool
following
badań
tests) •
preventive przesiewowy
Lung
screenings ch lub
low-dose
Checkbo
or
kontrolnych
CT
Always (Advanced
xes
check-ups miał(a)
screening • → “Screenings”)
(chips)
have you
Pan/Pani
Prostate
ever had?
kiedykolwiek
PSA blood
(select all
wykonane?
test •
that apply) (zaznacz
Full-body
wszystkie)
skin check
by
dermatolog
ist • Liver
ultrasound
for chronic
liver
disease/HB
V • Upper
GI
endoscopy
(gastrosko
pia) • Other
cancer-
related
Type
Logic (Show
When)
Validat
Requi ion
UX Notes
red
(Mobil
e)Output Mapping
Short
helper: “To
przybliżona
Enforce lista – jeśli
exclusi nie
Yes
ve
pamiętasz
(≥1
“None wszystkich
option
of the szczegółów
or
above”; , zaznacz
“None
at least to, co
of the
one
kojarzysz.”
above”
chip
Selecting
)
selecte any
d
non-“None”
item can
expand its
detail rows.Local enum list
onkn.screen.summary[*]. For
each selected item, reveal its
block and pre-create a lightweight
“screening episode” object.Field Key
Question
(EN)
Question
(PL)
Type
Options /
Allowed
Values
Logic (Show
When)
Validat
Requi ion
UX Notes
red
(Mobil
e)
Output Mapping
screening •
None of
the above
screen.cervix.everCzy
Have you
kiedykolwiek
ever had a miała Pani
cervical
wymaz
smear (Pap cytologiczny Radio
test) or HPV (Pap) lub
test of the
test HPV
cervix?
szyjki
macicy?
screen.cervix.last_yearWhen was
your most
recent
cervical
smear or
HPV test?
(year is
enough)
Show when:
derived.sex_at_birth
= female AND
derived.age_years ≥
18 AND
Yes, at
Yes
(screen.summary
least once /
(when
includes “Cervical
No, never /
shown
smear/HPV test”
Not sure
)
OR
advanced_mode =
true) AND
derived.cervix_pres
ent ≠ false
One
option
must
be
selecte
d
Microcopy:
“Wliczamy
badania
wykonywan onkn.screen.cervix.ever (enum).
e przy
Used by guideline engine for
rutynowej
cervical cancer screening logic.
wizycie
ginekologic
znej.”
Kiedy
wykonano
ostatnie
badanie
cytologiczne Year
lub test HPV (YYYY)
szyjki
macicy?
(wystarczy
rok)ISO-8601
yearJakiego typu
było to
Select
badanie?Pap smear
only / HPV
test only /
screen.cervix.ever = Option
Both Pap
“Yes, at least once” al
and HPV
(co-testing)
/ Not surescreen.cervix.last_resultWhat was
the result of
your most
recent
cervical
test?Jaki był
wynik
ostatniego
badania
szyjki
macicy?Normal /
Abnormal –
follow-up
was
screen.cervix.ever = Option
recommen
—
“Yes, at least once” al
ded / Don’t
know /
Prefer not
to sayKeep
wording
neutral, no
risk %;
explain
FHIR Observation.summary or
“follow-up = local enum
np.
onkn.screen.cervix.last_result.
powtórna
cytologia,
kolposkopia
.”
screen.cervix.followup_doneIf follow-up
was
recommend
ed (e.g.
repeat test
or
colposcopy)
, was it
completed?Jeśli
zalecono
kontrolę (np.
powtórne
Radio
badanie,
kolposkopię)
, czy została
wykonana?screen.cervix.last_r
Yes / No /
esult = “Abnormal – Option
Still waiting
—
follow-up was
al
/ Not sure
recommended”Small
banner if
“No” or “Still
waiting” to onkn.screen.cervix.followup_statu
nudge user s (enum). Feeds “talk to your
to discuss doctor” notes, not risk scores.
with doctor
(no auto
triage).
screen.breast.mammo_everCzy
kiedykolwiek
Have you
miała Pani
ever had a
wykonane
mammogra
Radio
badanie
m (breast
mammografi
X-ray)?
czne (RTG
piersi)?
screen.cervix.last_type
What type
of test was
it?
When was
your most
screen.breast.mammo_last_y
recent
ear
mammogra
m? (year)
What was
the result of
screen.breast.mammo_last_r your most
esult
recent
mammogra
m?
Select
Year
not in
screen.cervix.ever = Option the
“Yes, at least once” al
future;
allow
blank
Show when:
derived.sex_at_birth
= female AND
Yes, at
derived.age_years ≥ Yes
least once / 30 AND
(when
No, never / (screen.summary
shown
Not sure
includes “Breast
)
imaging” OR
advanced_mode =
true)
Kiedy
wykonano
ostatnią
Year
mammografi
ę? (rok)ISO-8601
year
Jaki był
wynik
ostatniej
Select
mammografi
i?Normal /
Benign
changes
only (no
cancer) /
screen.breast.mam
Required
mo_ever = “Yes, at
extra tests least once”
or biopsy /
Don’t know
/ Prefer not
to say
In the past 3 Czy w ciągu
years, have ostatnich 3
you had
lat miała
screen.breast.other_imaging_
other breast Pani inne
Radio
3y
imaging
badania
(ultrasound piersi (USG,
or MRI)?
rezonans)?
Yes / No /
Not sure
screen.breast.mam
mo_ever = “Yes, at
least once”
One
option
if user
opens
row
Hint: “Jeśli
nie
pamiętasz
dokładnie,
wybierz
przybliżony
rok.”
onkn.screen.cervix.last_year
(integer year). Map to latest
Procedure/Observation.effective
date if exported.
Short tooltip
with
examples
(e.g.,
onkn.screen.cervix.last_type
“wynik:
(enum). Helps pick correct interval
cytologia
from config.
LBC, test
HPV
16/18”).
Hint:
“Mammogra
fia to
One
badanie
option RTG piersi onkn.screen.breast.mammo_ever
require wykonywan (enum).
d
e zwykle w
programach
przesiewow
ych.”
Year
Option not in
al
the
futureAllow
onkn.screen.breast.mammo_last_
approximat
year (year). Used to compute
e year
due/overdue via config.
selection.
Option
—
alShort
helper for
“benign”:
“np. torbiel,
łagodny
guzek.”
Show when:
derived.sex_at_birth
Option
= female AND
—
al
derived.age_years ≥
30
onkn.screen.breast.mammo_last_
result (enum). If “Required extra
tests or biopsy”, plan can add a
gentle “confirm follow-up with
doctor” note.
No need for
details; this
is only to
onkn.screen.breast.other_imaging
acknowledg _3y (boolean/enum).
e intensified
follow-up.Validat
Requi ion
UX Notes
red
(Mobil
e)
Options /
Allowed
ValuesLogic (Show
When)
Czy
kiedykolwiek
Have you
miał(a)
ever had
Pan/Pani
any bowel
wykonane
(colon)
badania
Radio
screening or
jelita
tests for
grubego lub
blood in
testy na
stool?
krew utajoną
w stolcu?Yes / No /
Not sureHelper: list
examples:
Show when:
“kolonoskop
derived.age_years ≥ Yes
One
ia,
40 OR
(when option sigmoidosk
onkn.screen.crc.ever_any (enum).
cond.ibd.type set
shown require opia, test
OR
)
d
FIT/FOBT,
cond.cirr.status=Yes
kolonoskopi
a wirtualna
(TK).”
screen.crc.last_methodWhich test
did you
have most
recently?Jakie
badanie
wykonano
ostatnio?SelectColonosco
py /
Flexible
sigmoidosc
opy / Stool
test
(FIT/FOBT)
screen.crc.ever_any Option
/ Stool
—
= “Yes”
al
DNA test /
CT
colonograp
hy (virtual
colonoscop
y) / Not
sure
screen.crc.last_yearWhen was
your most
recent
bowel
screening
test? (year)Kiedy
wykonano
ostatnie
badanie
jelita
grubego /
test stolca?
(rok)YearISO-8601
yearscreen.crc.polyps_everHave you
ever been
told that
polyps or
advanced
changes
were found
on
colonoscop
y?Czy
kiedykolwiek
poinformowa
no
Pana/Panią
o polipach
lub
Radio
zaawansow
anych
zmianach w
jelicie
grubym w
kolonoskopii
?Yes / No /
Had
colonoscop
Show when:
y but don’t
Option
screen.crc.ever_any
—
know /
al
= “Yes”
Never had
colonoscop
y
Keep
neutral:
“Polipy to
łagodne
zmiany,
które
czasem
wymagają
częstszych
kontroli.”
screen.crc.followup_intervalPo ostatniej
After your
kolonoskopii
last
, czy
colonoscop zalecono
Select
y, were you powtórzenie
told when to badania po
repeat it?
określonym
czasie?Show when:
1–3 years /
screen.crc.last_met
5 years /
hod ∈
10 years /
Option
{Colonoscopy,
—
Other / Not
al
Flexible
sure / Not
sigmoidoscopy, CT
applicable
colonography}
Microcopy:
“Jeśli nie
pamiętasz
dokładnie,
wybierz
onkn.screen.crc.followup_interval
»Nie wiem« (enum). Used to soften language
– aplikacja i if interval already set.
tak
wygeneruje
ogólne
zalecenia.”
screen.lung.ldct_everCzy
kiedykolwiek
miał(a)
Have you
Pan/Pani
ever had a niskodawko
low-dose
wą
CT scan
tomografię
specifically klatki
Radio
for lung
piersiowej
cancer
wykonywaną
screening
jako badanie
(not just any przesiewow
CT)?
e w kierunku
raka płuca
(nie zwykłe
TK)?Yes / No /
Not sureShow when:
(smoking_status in
{Former, Current}
OR
Option
—
htp.status=Current) al
AND
derived.age_years ≥
40
One-line
helper
differentiati
onkn.screen.lung.ldct_ever
ng low-dose
(enum).
CT from
diagnostic
CT.
screen.lung.ldct_last_yearWhen was
your most
recent
low-dose
CT for lung
screening?
(year)Kiedy
wykonano
ostatnią
niskodawko
wą
tomografię w Year
ramach
badań
przesiewowy
ch płuc?
(rok)ISO-8601
yearYear
screen.lung.ldct_ev Option not in
er = “Yes”
al
the
future
—
onkn.screen.lung.ldct_last_year
(year).
screen.lung.ldct_last_resultWhat was
Jaki był
the result of wynik
your most
ostatniejNeutral
helper:
“Wynik
onkn.screen.lung.ldct_last_result
(enum). Drives tone of
recommendation, not risk %.
Field KeyQuestion
(EN)
screen.crc.ever_any
Question
(PL)
Type
Select
Year
screen.crc.ever_any Option not in
= “Yes”
al
the
future
No
screen.lung.ldct_ev Option
suspicious
—
er = “Yes”
al
nodules /
Show tiny
icons next
to each
method to
aid recall.
Output Mapping
onkn.screen.crc.last_method
(enum). Maps to FHIR
Procedure.code.
Allow
approximat onkn.screen.crc.last_year (year).
e year.
onkn.screen.crc.polyps_ever
(enum). Helps choose interval tier
(standard vs high-risk follow-up).Field Key
screen.prostate.psa_ever
Question
(EN)Question
(PL)
recent
low-dose
CT?niskodawko
wej
tomografii
płuc?
Have you
ever had a
PSA blood
test
(prostate-sp
ecific
antigen)?
Options /
Allowed
Values
Logic (Show
When)
Validat
Requi ion
UX Notes
red
(Mobil
e)
Nodules
found –
monitoring
only /
Required
further
tests or
treatment /
Don’t know
Czy
kiedykolwiek
miał Pan
badanie
PSA
Radio
(antygen
swoisty dla
prostaty) z
krwi?
Kiedy
When was
wykonano
your most
screen.prostate.psa_last_year
ostatnie
recent PSA
badanie
test? (year)
PSA? (rok)
Have you
ever been
told your
PSA was
screen.prostate.psa_abnorma
high or had
l_or_biopsy
a prostate
biopsy
because of
PSA?
Type
Year
Czy
kiedykolwiek
poinformowa
no Pana o
podwyższon
ym PSA lub
Radio
miał Pan
biopsję
prostaty z
powodu
wyniku
PSA?
»monitoring
« oznacza
zwykle
kontrolne
badanie za
pewien
czas.”
Show when:
Yes, at
derived.sex_at_birth
least once /
Option
= male AND
—
No, never /
al
derived.age_years ≥
Not sure
40
ISO-8601
year
Yes / No /
Not sure
Output Mapping
Short
explainer:
“PSA to
badanie
onkn.screen.prostate.psa_ever
krwi, często
(enum).
wykonywan
e w ramach
kontroli
prostaty.”
Year
screen.prostate.psa
Option not in
_ever = “Yes, at
al
the
least once”
future—
Show when:
screen.prostate.psa Option
—
_ever = “Yes, at
al
least once”If “Yes”,
plan
wording can
emphasize
continuity of
onkn.screen.prostate.psa_abnorm
urology
al_or_biopsy (enum).
follow-up,
not new
screening
suggestions
.
Helper:
mention
that routine
checks are
common in onkn.screen.skin.full_exam_ever
people with (enum).
many moles
or strong
sun
exposure.
onkn.screen.prostate.psa_last_ye
ar (year).
screen.skin.full_exam_everCzy
Have you
kiedykolwiek
ever had a miał(a)
full-body
Pan/Pani
skin
pełne
Radio
examination badanie
by a
skóry całego
dermatologi ciała u
st?
dermatologa
?Yes / No /
Not sureAlways (Advanced
→ “Screenings”)screen.skin.last_yearWhen was
your most
recent
full-body
skin exam?
(year)ISO-8601
yearYear
screen.skin.full_exa Option not in
m_ever = “Yes”
al
the
future—
screen.skin.biopsy_everCzy
kiedykolwiek
Have you
miał(a)
ever had a
Pan/Pani
skin lesion
Radio
usuwaną lub
removed or
biopsjowaną
biopsied?
zmianę
skórną?Always (Advanced
→ “Screenings”)If “Yes”,
follow-up
cancer
history
(elsewhere)
captures
onkn.screen.skin.biopsy_ever
diagnoses; (enum).
here we
only flag
dermatologi
c follow-up
need.
screen.hcc.us_everCzy
kiedykolwiek
Have you
miał(a)
ever had
Pan/Pani
regular liver
regularne
ultrasound
USG
(with or
wątroby (z
without AFP
Radio
lub bez
blood test)
badania
as
AFP) w
monitoring
ramach
for liver
kontroli
disease?
choroby
wątroby?
Kiedy
wykonano
ostatnie
pełne
badanie
skóry? (rok)
Kiedy
wykonano
ostatnie
USG
wątroby w
ramach
takiej
kontroli?
(rok)
Year
Yes / No /
Not sure
Yes / No /
Not sure
Option
—
al
Option
—
al
Show when:
cond.cirr.status=Yes
OR
Option
cond.hbv.status=Cu
—
al
rrent OR
cond.hcv.status ∈
{Past, Current}
onkn.screen.skin.last_year (year).
Helper
clarifies:
“Chodzi o
badania
onkn.screen.hcc.us_ever (enum).
wykonywan
e cyklicznie,
np. co 6–12
miesięcy.”
screen.hcc.us_last_yearWhen was
your most
recent liver
ultrasound
for
monitoring?
(year)YearISO-8601
yearYear
screen.hcc.us_ever Option not in
= “Yes”
al
the
future—onkn.screen.hcc.us_last_year
(year).
screen.hcc.us_intervalHow often is Jak często
Select
liver
zaplanowanEvery 6
months /screen.hcc.us_ever Option
—
= “Yes”
alUsed only
to tuneonkn.screen.hcc.us_interval
(enum).Field Key
Question
(EN)Question
(PL)
ultrasound
planned for
you?ou
Pana/Pani
kontrolne
USG
wątroby?
Type
Logic (Show
When)
Validat
Requi ion
UX Notes
red
(Mobil
e)
Every 12
months /
Other / Not
on a fixed
schedule /
Not sure
Czy
kiedykolwiek
miał(a)
Have you
Pan/Pani
ever had an gastroskopię
upper
(badanie
Radio
endoscopy endoskopow
(gastroscop e górnego
y)?
odcinka
przewodu
pokarmoweg
o)?
When was
Kiedy
your most
wykonano
recent
screen.upper_endo.last_year
ostatnią
Year
upper
gastroskopię
endoscopy?
? (rok)
(year)
screen.upper_endo.ever
Options /
Allowed
Values
screen.upper_endo.reasonWhat was
Jaki był
the main
główny
reason for
powód
the most
wykonania
Select
recent
ostatniej
upper
gastroskopii
endoscopy? ?
screen.other.listAny other
cancer-
related
screening
tests (e.g.
ovarian
ultrasound,
CT/MRI
done as
preventive
checks)?
(short
description)
Output Mapping
wording
(“kontynuo
wać obecny
nadzór”).
Yes / No /
Not sureShow when:
cond.barrett.status=
Yes OR
cond.hpylori.status
≠ Never OR
symptoms.gi.subs
Option
—
contains
al
dyspepsia/dysphagi
a OR
screen.summary
includes “Upper GI
endoscopy”Helper:
reassure
about
purpose
(ulcers,
reflux,
Barrett’s,
bleeding).onkn.screen.upper_endo.ever
(enum).
ISO-8601
yearYear
screen.upper_endo. Option not in
ever = “Yes”
al
the
future—onkn.screen.upper_endo.last_yea
r (year).
Symptoms
(pain,
reflux,
anaemia,
bleeding) /
Check or
follow-up
for
Barrett’s
screen.upper_endo. Option
—
oesophagu ever = “Yes”
al
s/
Screening
or check
because of
family
history /
Other / Not
sure
Czy miał(a)
Pan/Pani
inne badania
związane z
profilaktyką
Short
nowotworów
text
0–500
(np. USG
(multi-lin characters
jajników,
e)
TK/MRI
wykonywane
profilaktyczn
ie)? (krótki
opis)
Show when:
screen.summary
includes “Other
cancer-related
screening”
Limit
Option length
al
to 500
chars
This helps
distinguish
symptom-dr
onkn.screen.upper_endo.reason
iven scopes
(enum).
from
surveillance
programs.
Allow the
user to list
1–3 key
onkn.screen.other.list (string).
tests;
Backend may map recognizable
free-text
tests to local types but no hard
parsing
requirement.
stays on the
backend.
Immunization history – field specfications
Field Key
Question
(EN)
Question
(PL)
Type
Czy ma
Do you have Pan/Pani
your
przy sobie
vaccination
książeczkę
imm.card_available
Radio
card or app at szczepień
hand right
lub aplikację
now?
z historią
szczepień?
Options /
Allowed Logic (Show When)
Values
Yes / No
Always (Advanced →
“Immunizations”)
Validat
Requir ion
UX Notes
ed
(Mobile
)
Option
—
al
imm.hpv.dosesSzczepienie
HPV
przeciw
vaccination – HPV – ile
how many
dawek
Select
doses have
łącznie
you received? Pan/Pani
otrzymał(a)?Always (Advanced →
0/1/2/
Immunizations) OR
Option
3 / Not
when
al
sure
derived.age_years ≤ 45
imm.hpv.year_lastHPV – rok
HPV – year of
ostatniej
the last dose
dawkiISO-8601 imm.hpv.doses ∈
year
{1,2,3}
Yes / No Always (Advanced →
/ Not sure Immunizations)
Hepatitis B
(HBV)
imm.hbv.completed vaccination –
have you
completed
Year
Szczepienie
przeciw
WZW B
Radio
(HBV) – czy
ukończył(a)
Output Mapping
If “No”, show
microcopy:
“Możesz
onkn.imm.card_available (boolean).
odpowiedzieć
Only affects tone and confidence of
orientacyjnie –
plan, not logic.
dokładne daty nie
są konieczne.”
Reuse your
existing UX: short
info what HPV is
& that both
women and men
may be
vaccinated.Immunization(HPV).protocolApplied.
doseNumber; local code
onkn.imm.hpv.doses. (Existing field;
keep semantics identical.)
Year
Option not in
al
the
future“Jeśli nie
pamiętasz
dokładnie,
wybierz
przybliżony rok.”onkn.imm.hpv.year_last (year).
Immunization.occurrenceDateTime
(latest).
Option
—
alThis mirrors your
earlier field; keep
same wording.Immunization(HBV).status =
completed/partially/not-done; local
enum onkn.imm.hbv.completed.
(Existing field.)
Option
must
be
picked
if row
openedField Key
Question
(EN)Question
(PL)
the basic
series?Pan/Pani
podstawowy
cykl?
Type
Options /
Allowed Logic (Show When)
Values
Validat
Requir ion
UX Notes
ed
(Mobile
)
imm.hbv.dosesWZW B – ile
łącznie
HBV – how
dawek
many doses
Numbe 0–10
otrzymał(a)
in total (if you
r
(integer)
Pan/Pani
remember)?
(jeśli
pamięta)?
imm.hbv.year_lastWZW B –
HBV – year of
rok ostatniej Year
last dose
dawkiimm.hav.anyHepatitis A
(HAV) – have
you ever
been
vaccinated?imm.hav.year_lastWZW A –
HAV – year of
rok ostatniej Year
last dose
dawkiimm.flu.last_seaso
nIn the most
recent flu
season, did
you get a flu
shot?W ostatnim
sezonie
grypowym,
czy
przyjął/przyj
Radio
ęła
Pan/Pani
szczepionkę
przeciw
grypie?Yes / No
Option
derived.age_years ≥ 18
—
/ Not sure
al
imm.flu.year_lastFlu – year of
last dose (if
not sure
about
season)Grypa – rok
ostatniej
dawki (jeśli
Year
nie pamięta
Pan/Pani
sezonu)ISO-8601 imm.flu.last_season ∈
year
{Yes, Not sure}
imm.covid.dosesCOVID-19
vaccination –
total number
of doses (all
brands)?Szczepienie
przeciw
COVID-19 –
łączna
Numbe 0–20
liczba
r
(integer)
dawek
(wszystkie
preparaty)?
COVID-19 –
imm.covid.year_las
year of last
t_dose
dose
WZW A
(HAV) – czy
kiedykolwie
k był(a)
Radio
Pan/Pani
szczepiony(
a)?
COVID-19 –
rok ostatniej Year
dawki
Output Mapping
Range
0–10;
Option
integer;
al
allow
blankHelper:
“Standardowo są
onkn.imm.hbv.doses (integer). Used
3 dawki, czasem
only for analytics/derived
więcej w
completeness flag.
schemacie
przyspieszonym.”
ISO-8601 imm.hbv.completed ∈
year
{Yes, Not sure}Year
Option not in
al
the
future—
Yes / No
Always
/ Not sureOption
—
alMainly relevant in
some high-risk
GI/liver contexts; onkn.imm.hav.any (enum).
low impact on
main cancer plan.
ISO-8601
imm.hav.any = Yes
yearYear
Option not in
al
the
future—
onkn.imm.hav.year_last (year).
Helper: “Sezon
grypowy trwa
zwykle jesienią i
zimą.”
onkn.imm.flu.last_season (enum).
—
onkn.imm.flu.year_last (year).
Show when:
imm.hbv.completed ≠
“No”
derived.age_years ≥ 12
Helper text
Option 0–20;
clarifies to include onkn.imm.covid.doses (integer).
al
integer
boosters.
Year
Option not in
al
the
future
—onkn.imm.covid.year_last_dose
(year).
Year
ISO-8601
Option not in
derived.age_years ≥ 18
year
al
the
futureHelper reminds:
“Często
podawane przy
skaleczeniach,
zabiegach lub w
dzieciństwie co
kilka lat.”onkn.imm.td_tdap.year_last (year).
Used for generic “booster may be
due” note.
Show when:
derived.age_years ≥ 50
OR cond.copd=true OR
Yes / No cond.t2dm.status = Yes Option
—
/ Not sure OR cond.tx.status=Yes al
OR
meds.immunosupp.curr
ent=YesHelper: “U
dorosłych stosuje
się różne
preparaty (PCV,
onkn.imm.pneumo.ever (enum).
PPSV). Jeśli nie
pamiętasz nazwy
– wybierz »Nie
wiem«.”
Jeśli tak:
czy pamięta
If yes: do you
imm.pneumo.vacci
Pan/Pani
remember
Select
ne_type
rodzaj
which type?
szczepionki
?PCV13 /
PCV15 /
PCV20 /
imm.pneumo.ever =
PPSV23 /
Yes
Combinat
ion / Not
sureOption
—
alOnly for nuance;
not used directly onkn.imm.pneumo.vaccine_type
by rules engine in (enum).
MVP.
Pneumococc
imm.pneumo.year_l
Pneumokoki
al – year of
Year
ast
– rok
last doseISO-8601 imm.pneumo.ever =
year
YesOption Year
al
not in—
Kiedy
przyjął/przyj
When was
ęła
your last
Pan/Pani
tetanus /
ostatnie
imm.td_tdap.year_l diphtheria (± szczepienie
Year
ast
pertussis)
przeciw
shot?
tężcowi/błon
(approximate icy (±
year)
krztuścowi)?
(przybliżony
rok)
imm.pneumo.ever
Czy
kiedykolwie
k był(a)
Have you
Pan/Pani
ever had a
szczepiony(
pneumococca
a) przeciw
l vaccine (for
Radio
pneumokok
pneumonia/s
om
erious lung
(zapobiega
infections)?
ciężkim
zapaleniom
płuc itp.)?
ISO-8601
imm.covid.doses > 0
year
Year
Option not in
al
the
future
onkn.imm.hbv.year_last (year).
onkn.imm.pneumo.year_last (year).Field Key
Question
(EN)
Question
(PL)
Options /
Allowed Logic (Show When)
Values
Type
ostatniej
dawki
Validat
Requir ion
UX Notes
ed
(Mobile
)
Output Mapping
the
future
Czy
kiedykolwie
k
przyjął/przyj
ęła
Radio
Pan/Pani
szczepienie
przeciw
półpaścowi?
Show when:
derived.age_years ≥ 50
Yes / No OR
Option
—
/ Not sure meds.immunosupp.curr al
ent=Yes OR
cond.tx.status=YesShort explanation:
“Szczepionka
przeciw
półpaścowi jest
onkn.imm.zoster.ever (enum).
zwykle zalecana
w starszym wieku
lub przy obniżonej
odporności.”
SelectLive
vaccine
(older
type) /
imm.zoster.ever = Yes
Recombi
nant
vaccine /
Not sureOption
—
alHelps shape
wording around
revaccination if
applicable
(config-driven).onkn.imm.zoster.vaccine_type
(enum).
Półpasiec –
imm.zoster.year_la Zoster – year
rok ostatniej Year
st
of last dose
dawkiISO-8601
imm.zoster.ever = Yes
yearYear
Option not in
al
the
future—onkn.imm.zoster.year_last (year).
imm.zoster.ever
Have you
ever had a
shingles
(zoster)
vaccine?
Jeśli tak:
If yes: do you czy wie
imm.zoster.vaccine
know which
Pan/Pani,
_type
type?
jaki to był
preparat?
imm.mmr.status
Measles–
mumps–
rubella
(MMR) –
status
Chickenpox
(varicella) –
imm.varicella.status
history or
vaccination
imm.other_list
Any other
vaccines
recommende
d to you due
to chronic
illness,
weakened
immunity or
cancer
treatment?
(short list)
RadioFully
vaccinate
d in
childhood
/ Partially
Option
derived.age_years ≥ 18
—
vaccinate
al
d / Not
vaccinate
d / Not
sureNo need for
dates; acts as a
coarse flag re:
onkn.imm.mmr.status (enum).
immunity
pre-immunosuppr
ession.
Ospa
wietrzna –
przebycie
Radio
choroby lub
szczepienieHad
chickenp
ox in the
past /
Vaccinat
Option
derived.age_years ≥ 18
—
ed (one
al
or more
doses) /
Neither /
Not sureHelper:
“Informacja
pomocna np. przy
planowaniu
onkn.imm.varicella.status (enum).
leczenia
obniżającego
odporność.”
Odra–
świnka–
różyczka
(MMR) –
status
Inne
szczepienia
zalecone z
powodu
chorób
Short
0–500
przewlekłyc text
Always (Advanced →
character
h, obniżonej (multi-li
Immunizations)
s
odporności ne)
lub leczenia
onkologiczn
ego? (krótka
lista)
Example
placeholder: “np.
onkn.imm.other_list (string).
Option 500-ch meningokoki,
Free-text; backend may optionally
al
ar max grypa
classify patterns.
wysokodawkowa,
RSV”.
Derived (hidden; auto-computed) – screenings & immunizations
These are internal fields (no direct UI), computed from the answers above + age/sex/condition data + your JSON guideline
config. They support the deterministic rules engine while keeping the UI light and non-alarmist, consistent with ONKONO’s
“inform, not score risk” principle.
Field Key
Label (EN)
Label (PL)
Type
Values /
Rules
Logic (Inputs → Rule)
(high-leve
l)
Output Mapping
derived.screen.cervix_dueCervical
screening
currently dueBadanie szyjki
macicy – aktualnie
do rozważeniaBoolea True /
n
FalseTrue if derived.cervix_present =
true AND user within configured
age band AND (no prior test
recorded OR current_year −
screen.cervix.last_year ≥
Observation
interval_from_config for
onkn.eligibility.screen_cervix_due
screen.cervix.last_type &
(boolean).
last_result). All thresholds
pulled from
preventive-plan-config.*.json,
not hard-coded.
derived.screen.breast_dueBreast
screening
currently dueBadanie piersi –
aktualnie do
rozważeniaBoolea True /
n
FalseSimilar pattern:
derived.assigned_female AND
age in programme range AND
(no mammogram ever OR
last_mammo beyond
interval_from_config).
derived.screen.crc_dueBowel cancer Badanie jelita
Boolea True /
screening
grubego – aktualnie
n
False
currently due do rozważenia
Observation
onkn.eligibility.screen_breast_due
(boolean).
Uses age, cond.ibd.,
Observation
cond.cirr.status, screen.crc. and onkn.eligibility.screen_crc_due
config entry per method
(boolean).Field Key
Label (EN)
Label (PL)
Type
Values /
Rules
Logic (Inputs → Rule)
(high-leve
l)
Output Mapping
(colonoscopy vs stool tests). If
no screening recorded and age
≥ start_age_from_config →
True.
derived.screen.lung_candidateKandydat/kandydat
Candidate for
ka do badań
Boolea True /
lung CT
przesiewowych
n
False
screening
płuc (TK LD)True if smoking_status in
{Former, Current} AND
Observation
pack-years ≥
onkn.eligibility.lung_screening_candi
threshold_from_config AND age
date (boolean). Uses pack-years from
in configured band; independent
smoking section.
of whether screening already
done (plan will differentiate).
derived.screen.prostate_discussPSA testing – PSA – temat do
discuss with omówienia z
doctor
lekarzemBoolea True /
n
FalseConfigurable, typically age band
Observation
+ optional life-expectancy
onkn.eligibility.psa_discussion
proxies; no hard
(boolean). Only used to generate
recommendation, just “topic for
“discussion topic” bullets.
visit”.
Boolea True /
n
FalseTrue if
symptoms.skin_mouth.subs
includes “changing mole /
Observation onkn.eligibility.skincheck
non-healing lesion” OR
(boolean). Extends your existing
derived.skin_lymphoma_highris skin-risk flag.
k = true OR
screen.skin.biopsy_ever = Yes.
Boolea True /
n
FalseBuilds on
derived.hcc.surveillance_candid
Observation
ate AND (screen.hcc.us_ever =
onkn.eligibility.hcc_surveillance_due
No OR current_year −
(boolean).
screen.hcc.us_last_year ≥
interval_from_config).
Regular
derived.screen.skin_check_recommen dermatology
ded
skin check
advisable
Wskazana
regularna kontrola
dermatologiczna
skóry
derived.screen.hcc_surveillance_dueKontrolne
Liver
USG/AFP w
ultrasound/AF
kierunku HCC –
P surveillance
aktualnie do
due
rozważeniaderived.screen.any_overdueJakiekolwiek
Any key
kluczowe badanie
Boolea True /
screening
przesiewowe –
n
False
likely due now prawdopodobnie do
rozważeniaTrue if any of
{derived.screen.cervix_due,
breast_due, crc_due,
hcc_surveillance_due} is true.
Lung/prostate handled as
“candidate/discussion”, not
“overdue”.
derived.imm.hpv_completeHPV
vaccination
Szczepienie HPV –
series
Boolea True /
cykl kompletny (wg
complete (per
n
False
wieku/schematu)
age /
schedule)True if imm.hpv.doses meets or
exceeds schedule_from_config
Observation
(e.g. 2 doses if started <15y, 3
onkn.eligibility.hpv_complete
doses otherwise). Year of last
(boolean).
dose may further refine “recent
vs remote” in config.
derived.imm.hbv_completeHBV
vaccination
course
completeTrue if imm.hbv.completed =
Yes OR imm.hbv.doses ≥
threshold_from_config.
derived.imm.hbv_susceptibleLikely
Prawdopodobnie
Boolea True /
susceptible to podatny/podatna na
n
False
HBV
WZW B
Szczepienie WZW
B – cykl kompletny
Boolea True /
n
False
Observation
onkn.eligibility.any_screen_overdue
(boolean). Used only to group plan
bullets.
Observation
onkn.eligibility.hbv_complete
(boolean).
Observation
True if cond.hbv.status = Never onkn.eligibility.hbv_susceptible
AND imm.hbv.completed ≠ Yes. (boolean). Drives suggestion to
discuss HBV vaccination/testing.
True if current_season
according to locale AND
imm.flu.last_season ≠ Yes AND Observation onkn.eligibility.flu_due
user in high-priority group (age, (boolean).
COPD, Tx,
immunosuppression) per config.
derived.imm.flu_dueAnnual flu
shot dueSzczepienie
przeciw grypie – do Boolea True /
rozważenia w tym n
False
sezoniederived.imm.covid_booster_dueCOVID-19
booster likely
dueDawka
przypominająca
Boolea True /
COVID-19 –
n
False
prawdopodobnie do
rozważeniaUses imm.covid.doses,
imm.covid.year_last_dose and
time thresholds from config; no
brand/series logic in MVP.derived.imm.tetanus_booster_dueTetanus
booster likely
dueSzczepienie
przeciw tężcowi –
Boolea True /
prawdopodobnie do n
False
odświeżeniaTrue if (current_year −
imm.td_tdap.year_last) ≥
Observation
interval_from_config OR
onkn.eligibility.tetanus_booster_due
imm.td_tdap.year_last unknown (boolean).
AND age ≥ threshold.
derived.imm.zoster_candidateCandidate for Kandydat/kandydat
Boolea True /
zoster
ka do szczepienia
n
False
vaccination
przeciw półpaścowiTrue if age and risk match
config AND imm.zoster.ever ≠
Yes.Observation
onkn.eligibility.zoster_candidate
(boolean).
derived.imm.pneumo_candidateKandydat/kandydat
Candidate for
ka do szczepienia Boolea True /
pneumococca
przeciw
n
False
l vaccination
pneumokokomTrue if (age and/or chronic
conditions) meet config criteria
AND imm.pneumo.ever ≠ Yes.Observation
onkn.eligibility.pneumo_candidate
(boolean).
derived.imm.any_gapJakikolwiek istotny
Any important
brak w
vaccine gap
szczepieniachTrue if any of {hbv_susceptible,
flu_due, covid_booster_due,
tetanus_booster_due,
zoster_candidate,
pneumo_candidate} is true.Observation
onkn.eligibility.any_vaccine_gap
(boolean). Used only for grouping
“vaccination topics” in the ActionPlan.
Boolea True /
n
False
Observation
onkn.eligibility.covid_booster_due
(boolean).
Implementation notes:
1.
Follow existing ONKONO conventions
o Field naming (screen.*, imm.*, derived.*) and column semantics mirror your current sections for smoking,
alcohol, diet, physical activity, symptoms and chronic conditions.o
2.
3.
4.
5.
As with the rest of ONKONO, these blocks must not calculate or display risk scores or percentages. They
only feed the deterministic rules engine and the “Doctor’s Discussion Guide” plan, in line with the contract’s
“inform, not predict” requirement.
Where to put things in the JSON
o The table above is meant to map 1:1 to entries in your assessment-questions.pl/en.json and to the rules in
preventive-plan-config.pl/en.json.
o Group screening fields in a dedicated Advanced → “screenings” section and immunizations in Advanced
→ “immunizations” (or similar B-blocks), mirroring cond.* for chronic illnesses.
FHIR / data model
o Screenings
§ Use Procedure for “test performed” data (e.g., colonoscopy, mammography) and Observation for
simplified outcome variables (e.g., screen.breast.mammo_last_result).
§ For this MVP, a single “most recent episode” per screening type is enough – no need to
reconstruct full longitudinal histories.
o Immunizations
§ Map each vaccine family to a FHIR Immunization resource; store dose count and last year as
occurrenceDateTime and protocolApplied.doseNumber.
§ Derived eligibility.* fields should be FHIR Observation with category = social-history or survey and
local codes onkn.eligibility.*.
Logic & configurability
o All age ranges, intervals and thresholds (e.g., when cervical/breast/CRC screening is “due”, pack-years
for lung CT, age cut-offs for zoster/pneumococcal) should live exclusively in config JSON, not in code or
the questionnaire spec. That keeps you future-proof to guideline updates without code changes.
o The derived booleans intentionally stay coarse (“due”, “candidate”, “topic to discuss”) so the AI explainer
can phrase recommendations gently without implying risk scores.
UX and accessibility
o On mobile, treat “year only” pickers as numeric inputs with steppers and max = current year; allow empty if
unknown.
o Use concise helpers and neutral tone (“to przybliżona informacja”; “porozmawiaj o tym z lekarzem”),
consistent with your empathetic, non-alarmist brand.
o Keep screening and vaccine questions in the Advanced area so Core flow remains lightweight; status
chips from derived.* are surfaced later only in the ActionPlan.
Occupational hazards relevant to cancer risk
Hazard categories correspond to common occupational or work-pattern exposures with strong evidence for increased cancer
risk (IARC Group 1 or 2A where applicable – asbestos, silica, diesel exhaust, wood dust, some pesticides, ionizing radiation,
and night shift work, among others)
1. Global rules (Occupational hazards block)
Scope & behaviour
• Block label (EN): Occupational hazards (work-related exposures)
•
•
•
•
•
Block label (PL): Narażenia zawodowe (czynniki związane z pracą)
Placement: Advanced → “Environment & work” (or similar), after lifestyle and chronic conditions.
Gating:
o If user answers “No” to occ.exposure_any, hide the checklist and advanced detail rows.
o If user answers “Yes” or “Not sure”, show the hazard checklist and allow multiple selections.
Each selected hazard in occ.hazards.subs creates one occ.exposure[i] entry, reusing the standard detail rows
below (pattern analogous to symptom[i]).
No risk scores are calculated; derived flags are only used to gate guideline rules (e.g. “consider lung imaging if...”) in
line with ONKONO’s “inform, not score” principle.
2. Core questions (gating + hazard checklist)
2.1 Gating question
Field Key
Question (EN) Question (PL)
Type
Options
Logic
/
Validation
(Show Required
UX Notes
Allowed
(Mobile)
When)
Values
Have you ever
Czy kiedykolwiek
had a job or
wykonywał(a)
regular work
Pan/Pani pracę z
where you
narażeniem na pył,
were exposed
No / Yes
chemikalia,
Radio
occ.exposure_any to dust,
/ Not
Always Yes
promieniowanie lub (chips)
chemicals,
sure
nocne zmiany, które
radiation or
mogą mieć
night shifts that
znaczenie dla ryzyka
might affect
nowotworów?
cancer risk?
One must
be
selected
Output Mapping
Short helper text under
question: EN: “This includes
long-term work in
Boolean / enum:
construction, mining, welding,
onkn.occ.exposure_any
farming with pesticides,
(none/yes/not sure). Store
healthcare with radiation,
as FHIR
night shifts, etc.” PL:
Observation.category =
„Dotyczy m.in. wieloletniej
social-history /
pracy w budownictwie,
environment.
górnictwie, spawalnictwie,
rolnictwie z pestycydami,
ochronie zdrowia zField Key
Question (EN) Question (PL)
Type
Options
Logic
/
Validation
(Show Required
UX Notes
Allowed
(Mobile)
When)
Values
Output Mapping
promieniowaniem, na nocne
zmiany itp.”
2.2 Hazard checklist (Core)
NOTE: Each selected option below creates one occ.exposure[i] with occ.exposure[i].hazard_code set accordingly.
Field Key
Question (EN)
Question (PL) Type
Options /
Allowed
Values
Logic (Show
(checkbox
When)
list;
multiple
allowed)
Czy
kiedykolwiek
pracował(a)
Have you ever
Pan/Pani
worked for
łącznie ok. 1
about 1 year or
rok lub dłużej
longer in any of
Checkboxes
w którymś z
See list
occ.hazards.subs the following
(chips;
poniższych
below
jobs or work
multi-select)
zawodów lub
environments?
środowisk
(Select all that
pracy?
apply)
(zaznacz
wszystkie,
które pasują)
Required
Validation
UX Notes
(Mobile)
Output Mapping
Show “None
of the
above” chip,
mutually
exclusive.
Short helper:
EN: “If not
sure, choose
Yes (pick At least 1
Each tick spawns
the closest
Show when
≥1 or
selection
occ.exposure[i] with
match or
occ.exposure_any “None of or explicit
occ.exposure[i].hazard_code
‘Other’ and
∈ {Yes, Not sure} the
“None of
= corresponding code (see
describe.”
above”)
the above”
codes in brackets).
PL: „Jeśli nie
masz
pewności,
wybierz
najbliższą
opcję lub
‘Inne’ i
opisz.”
Options for occ.hazards.subs (checkbox labels)
1.
Asbestos / insulation in older buildings or shipyards – e.g. construction, shipyards, demolition, brake linings
o PL: Azbest / materiały izolacyjne w starym budownictwie lub stoczniach (budownictwo, stocznie, rozbiórki,
okładziny hamulcowe)
o Code: occ.hazard.asbestos (IARC Group 1; mesothelioma, lung cancer)
2. Silica or rock dust – mines, quarries, stone cutting, sandblasting, foundries, ceramics
o PL: Pył krzemionkowy / skalny (kopalnie, kamieniołomy, cięcie kamienia, piaskowanie, odlewnie, ceramika)
o Code: occ.hazard.silica (Group 1; lung cancer)
3. Wood dust – furniture making, carpentry, sawmills, floor sanding
o PL: Pył drzewny (produkcja mebli, stolarstwo, tartaki, cyklinowanie podłóg)
o Code: occ.hazard.wood_dust (Group 1; nasal & sinus cancers)
4. Leather dust / boot and shoe production or repair (intensive sanding, buffing)
o PL: Pył skórzany / produkcja lub naprawa obuwia (intensywne szlifowanie, polerowanie)
o Code: occ.hazard.leather_dust (Group 1; nasal cancers)
5. Diesel exhaust – professional driver, diesel mechanic, heavy machinery, warehouse forklifts
o PL: Spaliny diesla (kierowca zawodowy, mechanik, operator ciężkich maszyn, wózki widłowe)
o Code: occ.hazard.diesel (Group 1; lung, bladder)
6. Metalworking fluids / oily mists – machining with cutting oils, metal rolling, printing with oily inks
o PL: Oleje obróbkowe / mgła olejowa (toczenie/frezowanie z chłodziwem olejowym, walcownie, drukarnie)
o Code: occ.hazard.mineral_oil (Group 1; skin, scrotal, possibly bladder)
7. Welding fumes / metal fumes – especially stainless steel welding, galvanizing, chrome/nickel plating, smelters,
battery plants
o PL: Dymy spawalnicze / opary metali (spawanie stali nierdzewnej, cynkowanie, galwanizacja
chromem/niklem, huty, produkcja akumulatorów)
o Code: occ.hazard.metals_welding (welding fume Group 1; lung, others)
8. Soot, coal tar, pitch, bitumen – chimney sweeping, roofing with tar/asphalt, coke ovens, aluminium works, asphalt
plants
o PL: Sadzę, smoła węglowa, pak, lepik/bitum (kominiarze, dekarze, koksownie, huty aluminium, wytwórnie
asfaltu)
o Code: occ.hazard.pahs (PAH-rich mixtures, Group 1)
9. Rubber, dye or chemical manufacturing – rubber factories, chemical plants, dye/pigment production
o PL: Produkcja gumy, barwników lub chemikaliów (zakłady gumowe, chemiczne, produkcja
barwników/pigmentów)
o Code: occ.hazard.rubber_chem (aromatic amines, Group 1; bladder, etc.)
10. Benzene or similar solvents – petrochemicals, printing, painting, degreasing, shoe gluing
o PL: Benzen lub podobne rozpuszczalniki (petrochemia, drukarnie, malowanie, odtłuszczanie, klejenie
obuwia)
o Code: occ.hazard.benzene_solvents (benzene Group 1; leukaemia)11. Formaldehyde / formalin – pathology/anatomy labs, funeral services, resin/plywood production
o PL: Formaldehyd / formalina (patomorfologia, prosektorium, usługi pogrzebowe, produkcja żywic/sklejki)
o Code: occ.hazard.formaldehyde (Group 1; nasopharynx, leukaemia)
12. Agricultural pesticides or fumigants – farm worker, greenhouse, pest control
o PL: Pestycydy rolnicze lub fumiganty (pracownik rolny, szklarnie, deratyzacja/dezynsekcja)
o Code: occ.hazard.pesticides (several specific pesticides Group 1/2A; haematologic & other cancers)
13. Ionizing radiation at work – radiology, nuclear medicine, interventional cardiology, industrial radiography, nuclear
power
o PL: Promieniowanie jonizujące w pracy (radiologia, medycyna nuklearna, kardiologia interwencyjna,
badania radiograficzne przemysłowe, energetyka jądrowa)
o Code: occ.hazard.ionizing (X-, γ-rays, radionuclides; Group 1)
14. Long-term outdoor work in strong sunlight – construction, agriculture, fishing, lifeguard, etc.
o PL: Długotrwała praca na zewnątrz w silnym słońcu (budownictwo, rolnictwo, rybołówstwo, ratownik itp.)
o Code: occ.hazard.solar_uv (solar UV Group 1; skin cancers)
15. Regular night shift work – work between ~23:00–06:00 at least some nights/month for several years (any sector)
o PL: Regularna praca na nocne zmiany (praca między ok. 23:00 a 6:00 co najmniej kilka nocy w miesiącu
przez kilka lat, w dowolnej branży)
o Code: occ.hazard.night_shift (night shift work Group 2A; breast & other cancers)
16. Firefighter / emergency services with heavy smoke exposure – professional or long-term volunteer
o PL: Strażak (zawodowy lub długoletni ochotnik) lub podobne służby z dużym narażeniem na dym/spaliny
o Code: occ.hazard.firefighter (IARC Monograph Volume 132; complex exposure mixture)
17. Hairdresser / barber / beautician – frequent use of hair dyes, bleaches, straightening products
o PL: Fryzjer/fryzjerka, barber lub kosmetyczka często używająca farb, rozjaśniaczy, preparatów do
prostowania włosów
o Code: occ.hazard.hairdresser (hairdresser/barber Group 2A)
18. Painter / spray painter / auto body painter – indoor/outdoor painting with solvent-based paints or sprays
o PL: Malarz, lakiernik, dekorator wnętrz, lakiernik samochodowy (farby rozpuszczalnikowe, natrysk)
o Code: occ.hazard.painter (occupational exposure as a painter; increased lung & bladder cancer)
19. Other long-term exposure to carcinogenic dusts, chemicals, fumes or radiation (please describe)
o PL: Inne długotrwałe narażenie na pyły, chemikalia, dymy lub promieniowanie o możliwym działaniu
rakotwórczym (proszę opisać)
o Code: occ.hazard.other (free text; allows emerging/rare exposures)
3. Standard detail rows (per selected exposure: occ.exposure[i])
These rows are auto-created for each hazard selected in occ.hazards.subs, analogous to symptom[i] details in the Symptoms
block.
Options /
Allowed
Values
Field KeyQuestion
(EN)Question (PL) Type
occ.exposure[i].hazard_code(auto)
Hazard
category
code(auto) Kod
narażenia
occ.exposure[i].hazard_label(auto)
Hazard
label
(EN/PL)(auto) Etykieta Derived Localized
narażenia
(hidden display
(PL/EN)
)
string
occ.exposure[i].main_job_titleW jakim
What job
zawodzie to
was this
narażenie
in? (short
występowało? Short
name, e.g.
(krótko, np.
text
“carpenter
„stolarz”,
”, “bus
„kierowca
driver”)
autobusu”)
occ.exposure[i].years_totalFor how
Przez ile
many
łącznie lat
years in
był(a)
total were
0.1–60
Pan/Pani
Numbe
you
(decimal,
narażony(a) w r
exposed in
step 0.5)
tym lub
this job or
podobnych
similar
zawodach?
jobs?
Logic (Show
When)
Require Validation
d
(Mobile)
One of
Auto-set when
Derived occ.hazard.
a hazard
(hidden * values
—
option is
)
selected in
selected
checklist
Auto (from
checklist
option)
—
UX Notes
Output Mapping
—Enum:
Not shown to
onkn.occ.hazard_code.
user; used by
Use as Observation.code
rules engine.
or component.
—For internal
Text:
display /
onkn.occ.hazard_label
ActionPlan
(i18n).
explanations.
Show for each
selected
hazard
Optional
(occ.exposure[
i] block open)Enforce 1– Placeholder
50 chars;
EN: “e.g.,
text input
underground
Text: onkn.occ.job_title.
with
miner”; PL:
example
„np. górnik
placeholder pod ziemią”.
Show when
hazard
selectedYesHelper: EN:
Range 0.1–
“Approximate Quantity:
60; numeric
is fine.” PL:
onkn.occ.years_total,
keypad,
„Wystarczy
UCUM a.
stepper 0.5
przybliżenie.”
ISO-8601
YYYYShow when
hazard
selectedOptional1900–
current
year; not in
the futureNumeric year
Observation:
picker; allow
onkn.occ.year_first_expos
blank if
ed (date or year).
unknown.
On
Średnio, ile
average, godzin
how many tygodniowo
hours per był(a)
Numbe 0–80
occ.exposure[i].hours_per_week
week were Pan/Pani
r
(integer)
you
bezpośrednio
directly
narażony(a) w
exposed
tej pracy?Show when
hazard
selectedOptionalRange 0–
80; integerHelper chips:
0–10 / 11–20 Quantity:
/ 21–40 / >40 onkn.occ.hours_per_week,
to speed
UCUM h/wk.
selection.
About
Około którego
which year
roku zaczęło
occ.exposure[i].year_first_expos did this
się to
ed
exposure
narażenie?
start? (if
(jeśli wiesz)
known)
Year
1–50
charactersField Key
Question
(EN)
Question (PL) Type
Options /
Allowed
ValuesLogic (Show
When)Require Validation
d
(Mobile)
No / Yes /
Not sureShow when
hazard
selectedOne must
be selected Used to
if row
differentiate
Optional opened
past vs
(soft
ongoing
requirement exposure.
)
UX Notes
Output Mapping
(in that
job)?
Are you
still
exposed
occ.exposure[i].current_exposur to this
e
hazard in
your
current
work?
Czy nadal jest
Pan/Pani
narażony(a)
Radio
na ten czynnik
w obecnej
pracy?
occ.exposure[i].ppe_useWhen you
were
Podczas
directly
bezpośrednieg
exposed, o narażenia,
did you
czy zwykle
usually
stosował(a)
use
Pan/Pani
Radio
effective
skuteczne
protective środki ochrony
equipment (maska,
(mask,
wentylacja,
ventilation, osłony)?
shielding)?
occ.exposure[i].notesCzy
Anything chciał(a)by
important Pan/Pani
to add
dodać coś
about this ważnego o
exposure? tym
(optional) narażeniu?
(opcjonalne)
Long
text
Always /
Often /
Show when
Rarely or
hazard
never / Not selected
sure
0–300
characters
Show when
hazard
selected
Optional —
Optional
Max 300
chars
Enum:
onkn.occ.current_exposur
e (yes/no/not sure).
Short help:
EN: “This
does not
change your
plan here,
but helps
interpret
exposure.”
Enum: onkn.occ.ppe_use.
PL: „Nie
zmienia to
automatyczni
e planu, ale
pomaga
lepiej
zrozumieć
narażenie.”
Free text,
e.g.
“underground
only”,
Text: onkn.occ.notes.
“stopped
after 1990”,
etc.
4. Derived (hidden; backend-only) flags
These are not shown to the user and must not be presented as risk scores. They are boolean “eligibility / vigilance flags”
used by the deterministic guideline engine to decide which organ-specific recommendations to consider (e.g., lung imaging, skin
checks, haematology checks), in line with ONKONO’s deterministic-first architecture.
Field Key
Label (EN)
Label (PL)
Type
Values / Rules (Logic →
Rule)
Logic
(Show Output Mapping
When)
True if any
occ.exposure[i].hazard_code
∈ {asbestos, silica, diesel,
Derived
Auto
Observation:
mineral_oil, metals_welding,
boolean
after
onkn.occ.flag.lung_highrisk
pahs, firefighter} AND
(hidden)
submit (boolean).
(years_total ≥ 10 OR
current_exposure = Yes).
Otherwise False.
derived.occ.lung_highriskOccupational lung
Narażenie zawodowe
cancer exposure flag istotne dla raka płucaderived.occ.mesothelioma_flagAsbestos-related
Narażenie azbestem
Derived True if occ.hazard.asbestos
pleura/mesothelioma istotne dla
boolean selected AND years_total ≥ Auto
flag
międzybłoniaka/otrzewnej (hidden) 1. Else False.derived.occ.bladder_highriskOccupational
bladder cancer
exposure flagTrue if any hazard in {diesel,
Derived
Narażenie zawodowe
mineral_oil, rubber_chem,
boolean
Auto
istotne dla raka pęcherza
painter, hairdresser, pahs}
(hidden)
with years_total ≥ 5.Observation:
onkn.occ.flag.bladder_highrisk.
derived.occ.skin_uv_highriskHigh long-term
occupational
UV/skin exposureWysokie długotrwałe
narażenie zawodowe na
UV/skóręDerived True if occ.hazard.solar_uv
boolean selected AND years_total ≥
(hidden) 10.AutoObservation:
onkn.occ.flag.skin_uv_highrisk.
derived.occ.skin_chem_highriskSkin contact with
oils/tarsNarażenie skóry na
oleje/smołyTrue if any hazard in
Derived
{mineral_oil, pahs,
boolean
rubber_chem} AND
(hidden)
years_total ≥ 5.AutoObservation:
onkn.occ.flag.skin_chem_highrisk.
derived.occ.blood_cancer_flagHaematologic
malignancy-related
exposureNarażenie związane z
białaczkami/chłoniakamiTrue if any hazard in
Derived {benzene_solvents,
boolean formaldehyde, ionizing,
(hidden) pesticides} AND years_total
≥ 2.AutoObservation:
onkn.occ.flag.blood_cancer.
derived.occ.nasal_sinus_flagNarażenie zawodowe
Nasal / sinus cancer
istotne dla raka
occupational flag
nosa/zatokTrue if any hazard in
Derived {wood_dust, leather_dust,
boolean formaldehyde,
(hidden) metals_welding} AND
years_total ≥ 5.AutoObservation:
onkn.occ.flag.nasal_sinus.
Observation:
onkn.occ.flag.mesothelioma.
Night shift work
derived.occ.breast_shiftwork_flag (breast cancer
vigilance)Praca zmianowa nocna
(czujność w kierunku
raka piersi)Derived True if occ.hazard.night_shift
boolean selected AND years_total ≥ Auto
(hidden) 5.Observation:
onkn.occ.flag.breast_shiftwork.
Any important
occupational
carcinogen flagJakiekolwiek istotne
narażenie zawodowe na
kancerogenyTrue if any of the above
specific flags is True OR
Derived
total sum of all years_total
boolean
Auto
where
(hidden)
occ.exposure[i].hazard_code
≠ occ.hazard.other is ≥10.Observation:
onkn.occ.flag.any_highrisk.
derived.occ.any_highriskImplementation notes:
1. JSON structure & naming
•
Follow existing ONKONO pattern: keep keys flat, dot-separated, e.g.
o occ.exposure_any, occ.hazards.subs, occ.exposure[0].years_total, etc.
• In assessment-questions.*.json you can model the hazard checklist as one question with an options array where each
option has:
o value: "asbestos", "silica", ...
o code: "occ.hazard.asbestos" etc.
o label.en, label.pl for text.
• The repeated occ.exposure[i] block can be represented as a dynamic “subquestion group” attached to the checklist;
on submit, normalize to an array in the payload (similar to how you handle symptom[i]).
2. FHIR / data model
•
Persist raw answers as FHIR QuestionnaireResponse (if you ever decide to store them); derived flags as
Observation resources with category = social-history or environment.
•
Use local codes onkn.occ.* for:
o Hazard categories (onkn.occ.hazard_code)
o Duration & intensity (onkn.occ.years_total, onkn.occ.hours_per_week)
o Eligibility flags (onkn.occ.flag.*).
• Units: strictly UCUM; a for years, h/wk for hours per week.
3. Rules engine integration
•
In preventive-plan-config.*.json, you can reference the derived flags to gate actions, e.g.:
o if derived.occ.lung_highrisk == true AND smoking_status in {Former, Current} THEN include
"lung_imaging_discussion"
o if derived.occ.mesothelioma_flag == true THEN include "asbestos_clinic_discussion"
• Keep thresholds in config (not hard-coded), so you can later tune years cut-offs per guideline updates.
4. UX & accessibility
•
•
•
Place this block in Advanced by default, but make occ.exposure_any succinct so it doesn’t overwhelm users; the
checklist can be collapsed behind a “Show details about work exposures” accordion.
On mobile, render options as 2-column chips, like other multi-selects already specified.
Use short tooltips for technical terms:
o “Asbestos = old insulation material once used in buildings and ships.”
o “Silica dust = very fine dust from cutting stone, concrete, bricks.”
5. Alignment with ONKONO principles
• No numeric “occupational risk score” should be displayed; only neutral banners like:
o “Your work history includes long-term exposure to diesel exhaust and metal fumes. This may influence
which lung checks your doctor recommends.”
•
This dovetails with ONKONO’s design to produce an actionable doctor discussion guide, not predictive risk metrics.
Environmental & Residential Exposures relevant to cancer risk
Environmental & Residential Exposures – Core
Field Key
Questi Question
on (EN) (PL)
Over
many
years,
have
Czy przez
any of wiele lat
these
dotyczyły
conditio Pana/Pani
env.summ ns
warunki
ary
applied opisane
to the
poniżej w
place
miejscu
where zamieszka
you live nia?
(or
have
lived)?
Type
Logi
c
Options /
(Sho Requir Validation
Allowed Values w
ed
(Mobile)
Whe
n)
Options (check
all):• Long-term
heavy traffic /
city air – living in
a big city or <1
block from a very
busy road przez
≥10 lat łącznie.•
Near heavy
industry/power
Checklis plant/waste site
t (chips, – large plant,
Alwa
multisele power station,
ys
ct) +
refinery, mine,
None
spalarnia/składo
wisko odpadów
w zasięgu
wzroku lub
dojazdu pieszo
≥10 lat.• Home
heated/cooked
with solid fuel
indoors – coal,
wood, biomass in
pomieszczeniu w
UX Notes
Output Mapping
Short
helper
under list:
“To pytania
o
długotrwałe
Yes
warunki
(select
środowisko
≥1
Exclusive
we, które
Each checked item spawns an env.* exposure group in
option “None”: if
mogą
Advanced. Raw answers as FHIR QuestionnaireResponse;
or
selected, clear nieznaczni
local codes e.g.
“None other chips.
e wpływać
onkn.env.summary.[air/industry/solidfuel/radon/asbestos/w
of the Keyboard-acces na plan
ell/pesticide/uv].
above / sible chips.
badań.
Not
Zaznaczeni
sure”)
e nie
oznacza,
że
zachoruje
Pan/Pani
na
nowotwór.”Field Key
Questi Question
on (EN) (PL)
Type
Logi
c
Options /
(Sho Requir Validation
Allowed Values w
ed
(Mobile)
Whe
n)
UX NotesOutput MappingRequire
dValidatio
UX Notes
n (Mobile)Output Mapping
Hint:
“Można
wpisać
przybliżoną
Range 0–
liczbę (np.
80;
10, 15, 20
decimal
lat). Jeśli
allowed;
nie pamięta
numeric
Pan/Pani
keypad.
dokładnie,
proszę
oszacować.
”FHIR Observation,
category=social-history/environment
; code
onkn.env.air.high_pollution_years,
unit UCUM a (years).
większości dni
przez ≥5 lat.•
Home in
high-radon area
or with high
radon test –
oficjalnie wysoki
region radonowy
lub wynik
badania
„podwyższony”.•
Home with
asbestos
materials – np.
stary dach
eternitowy,
izolacje, otuliny
rur zawierające
azbest.•
Long-term use
of private well
water as main
drinking water
source przez ≥5
lat.• Regular
mixing/spraying
of pesticides at
home/garden –
≥1×/miesiąc
przez ≥1 rok.•
Frequent indoor
tanning
(sunbed/solariu
m) – ≥10 sesji w
życiu lub stałe
korzystanie.•
None of the
above / Not
sure – Żadne z
powyższych / Nie
wiem.
A) Outdoor & Traffic-Related Air Pollution
Field Key
Question
Question (PL)
(EN)
Type
Roughly
how many Przez ile lat łącznie
years in
mieszkał(a)
total have Pan/Pani w
you lived miejscu z bardzo
env.air.high_pollution_year
Numbe
in a place dużym ruchem
s
r
with very ulicznym lub
heavy
widocznym
traffic or
zanieczyszczenie
visible air m powietrza?
pollution?
env.air.current_high
Do you
currently
live in a
high-traffi
c or
industrial
area like
this?
Czy obecnie
mieszka Pan/Pani
w takiej okolicy
Radio
(duży ruch uliczny /
zakład
przemysłowy)?
Options
/
Logic (Show
Allowe
When)
d
Values
0–80
(step
0.5,
years)
Show when
env.summary
includes
“Long-term
heavy traffic /
No
city air” OR
“Near heavy
industry/powe
r plant/waste
site”.
Show when
env.summary
includes
“Long-term
Yes /
heavy traffic /
No / Not
No
city air” OR
sure
“Near heavy
industry/powe
r plant/waste
site”.
One
option
must be
selected if
row is
opened.
Used to
distinguish
Observation booleanish enum
dawny vs.
onkn.env.air.current_high
aktualny
(yes/no/unknown).
wpływ
środowiska.
B) Indoor Air – Solid Fuels (Coal/Wood/Biomass)
Field KeyQuestion
Question (PL)
(EN)
env.indoor.solidfuel_everIn any
Czy w
home you którymkolwiek z
lived in,
domów, w
were coal, których
wood or
Pan/Pani
Radio
other solid mieszkał(a),
fuels used używano w
indoors for pomieszczeniac
heating or h węgla, drewna
Type
Options /
Validati
Require
Allowed Logic (Show When)
on
UX Notes
d
Values
(Mobile)
Never /
Yes –
mainly in Show when
childhood / env.summary
Yes –
includes “Home
mainly in heated/cooked with
adulthood solid fuel indoors”.
/ Yes – in
both
Yes
(when
shown)
Output Mapping
Clarify in
helper: “Chodzi
o piece, kozy,
One
kuchnie
Observation enum
option
węglowe itp. w onkn.env.solidfuel.exposure_pa
required. domu/mieszka ttern.
niu, a nie o
ognisko na
zewnątrz.”Question
Question (PL)
(EN)
Field Key
cooking
on most
days?
Type
lub innego
paliwa stałego
do ogrzewania
lub gotowania w
większości dni?
Options /
Validati
Require
Allowed Logic (Show When)
on
UX Notes
d
Values
(Mobile)
Output Mapping
childhood
and
adulthood
/ Not sure
Roughly
Przez ile lat
how many
łącznie
years total
mieszkał(a)
did you
Pan/Pani w
Show when
live in a
domu, w którym Numb 0–80 (step env.indoor.solidfuel_
env.indoor.solidfuel_years home
No
na co dzień
er
0.5, years) ever ∉ {Never, Not
using solid
używano paliwa
sure}.
fuel
stałego w
indoors on
pomieszczeniac
most
h?
days?
Closed
stove with
chimney/fl
How was
Jak zwykle
ue / Open
the
odprowadzano
fireplace /
env.indoor.solidfuel_ventil stove/heat
dym/spaliny z
Select Open
ation
er usually
pieca/kozy/kuch
stove with
ventilated
ni?
no
?
dedicated
flue / Not
sure
Show when
env.indoor.solidfuel_
No
ever ∉ {Never, Not
sure}.
“Jeżeli trudno
policzyć
0–80;
dokładnie,
decimal
proszę wpisać
allowed.
przybliżoną
sumę lat.”Observation
onkn.env.solidfuel.years, unit a.
Simple text
helper with
pictograms
possible
(kominek, piec
z kominem,
kuchenka bez
komina).Observation enum
onkn.env.solidfuel.ventilation_t
ype.
One
option if
row
shown.
C) Radon (Home)
Field KeyQuestion
(EN)
env.radon.testedHas the
Czy
radon level
kiedykolwiek
ever been
badano poziom
measured
radonu w
in your
Pana/Pani
current or
obecnym lub
any
wcześniejszym
previous
domu?
home?
Question (PL)
If tested,
Jeśli badano,
what was jaki był
env.radon.level_cat the highest najwyższy
radon level podany poziom
reported? radonu?
Options /
Type Allowed
Values
Logic (Show
When)
Required
Validation
UX Notes
(Mobile)
Output Mapping
Tiny “i”: krótko
wyjaśnić, że
radon to
Observation enum
naturalny gaz w
onkn.env.radon.tested.
glebie, który
czasem bada się
w budynkach.
Show when
env.summary
Yes / No / Not includes “Home
Radio
No
sure
in high-radon
area or with high
radon test”.One must
be
selected if
row
opened.
• “Low /
around
guideline
value (np.
<100 Bq/m3)”•
“Moderately
elevated (np.
Show when
Yes
100–299
Select
env.radon.tested (when
Bq/m3)”•
= Yes
shown)
“Clearly above
recommended
level (np. ≥300
Bq/m3)”•
“Number not
given / don’t
remember”Helper: “Jeśli na
Observation
wyniku były tylko
Must pick
onkn.env.radon.level_category
słowa typu
one of the
(enum). Optional numeric
«podwyższony»,
categories.
approximation extension if you
można wybrać
ever map Bq/m3.
ostatnią opcję.”
Jeśli
stwierdzono
If a high
podwyższony
radon level
poziom radonu,
Yes –
was found,
czy wykonano
completed /
was any
jakieś działania
Planned or in Show when
mitigation
env.radon.mitigation
naprawcze (np. Radio progress / No / env.radon.tested No
done (e.g.
dodatkowa
Not applicable = Yes
ventilation,
wentylacja,
(level was low)
sealing,
uszczelnienia,
/ Not sure
radon
system
system)?
odprowadzający
radon)?
—
Used purely to
drive wording in
explanation
Observation enum
(“jeśli poziom
onkn.env.radon.mitigation_status.
pozostaje
wysoki...”).
D) Asbestos & Building Materials
Field Key
Question (EN)
Question (PL)
Typ
e
Options /
Allowed
Values
Logic (Show When)
Czy wie
Are you aware of
No / Yes –
Pan/Pani o
asbestos-containi
still present
obecności
ng materials in
/ Yes –
materiałów
Show when
your current or
removed by
env.asbestos.home_sta
zawierających Radi
env.summary includes
past home (e.g.
professiona
tus
azbest w
o
“Home with asbestos
old corrugated
ls / Yes –
swoim
materials”.
roofing,
removed
obecnym lub
insulation, pipe
without
wcześniejszym
lagging)?
professiona
domu (np.
Validatio
Require
n
UX Notes
d
(Mobile)
Yes
(when
shown)
Helper: “Nie
trzeba
zgadywać
rodzaju
One
materiału –
must be
jeśli nie ma
selected.
pewności,
można
wybrać «Nie
wiem».”
Output Mapping
FHIR Condition or
Observation flag
onkn.env.asbestos.home_st
atus.Field Key
Question (EN)
Question (PL)
Typ
e
stary dach z
eternitu,
izolacje, otuliny
rur)?
Options /
Allowed
Values
Logic (Show When)
Validatio
Require
n
UX Notes
d
(Mobile)
Output Mapping
l help / Not
sure
Czy Pan/Pani
Have you or
lub ktoś z
someone in your domowników
No / Yes –
household ever
kiedykolwiek
once / Yes
env.asbestos.disturban drilled, cut, or
wiercił, ciął lub Radi
– several
ce
removed these
usuwał te
o
times / Not
materials without materiały bez
sure
specialized
specjalistyczny
protection?
ch
zabezpieczeń?
Show when
env.asbestos.home_sta
tus ∈ {Yes – still
present, Yes –
No
removed by
professionals, Yes –
removed without
professional help}
Used as a
qualitative
signal – bez
liczenia
dawek – do
sformułowan Observation enum
ia delikatnej onkn.env.asbestos.disturban
rekomendac ce.
ji (“warto
wspomnieć
lekarzowi o
kontakcie z
azbestem”).
—
E) Drinking Water (Tap / Private Well)
Field Key
Question
(EN)
Question (PL)
Typ
e
Option
s/
Allowe Logic (Show When)
d
Values
Municip
al tap
water /
For most of Jakie było
Private
the last 10
główne źródło
well
years, what wody do picia w
(own or
env.water.main_source_1 was your
Pana/Pani
Sele
shared) Always
0y
main source domu przez
ct
/ Mostly
of drinking
większość
bottled
water at
ostatnich 10
water /
home?
lat?
Other /
Not
sure
Czy
Have you
kiedykolwiek
ever been
poinformowano
told that
Pana/Panią, że
water from
woda z
your own
Pana/Pani
well had
env.water.well_contam_n
studni miała
Radi
problems
otice
problemy, np.
o
such as high
wysoki poziom
nitrates,
azotanów,
arsenic,
arsenu,
industrial
zanieczyszczen
chemicals,
ia przemysłowe
or bacteria?
lub bakterie?
Have you
Czy
ever
kiedykolwiek
received an otrzymał(a)
official notice Pan/Pani
not to drink oficjalną
tap water at informację, by
env.water.official_advisor
Radi
home for
nie pić wody z
y_30d
o
more than
kranu w domu
30 days in a przez ponad 30
row (e.g. due dni z rzędu (np.
to
z powodu
contaminatio zanieczyszczen
n)?
ia)?
Validati
Requir
on
UX Notes
ed
(Mobile)
Yes
No /
Yes –
proble
m
resolve
d / Yes
–
proble Show when
m
env.water.main_sourc No
ongoin e_10y = Private well
g / not
sure if
resolve
d / Not
sure /
never
tested
No /
Yes /
Not
sure
Show when
env.water.main_sourc
No
e_10y = Municipal tap
water
Output Mapping
Must
pick
one.Helper:
“Chodzi o
wodę do picia
/
Observation enum
przygotowyw onkn.env.water.main_source_10y.
ania napojów,
nie o wodę do
mycia.”
—Helper:
zaznaczyć, że
chodzi o
wyniki badań
lub informacje
z
Observation enum
sanepidu/urzę
onkn.env.water.well_contamination
du;
_history.
podkreślić, że
jednorazowa
nieprawidłow
ość ≠ pewne
ryzyko
nowotworu.
—Short helper:
“Chodzi o
dłuższe
komunikaty –
Observation enum
nie o
onkn.env.water.long_advisory.
pojedyncze
wyłączenia z
powodu
awarii.”
F) Pesticides & Strong Home Chemicals
Field Key
Question
Question (PL)
(EN)
Type
Options
/
Logic (Show When)
Allowed
Values
In a
typical
W typowym roku, ile
year, how
razy sam(a)
many
przygotowuje lub
times do
0–365
rozpyla Pan/Pani środki
env.pesticide.use_freq_ you
Numb (integer,
owadobójcze/chwastob
year
personally
er
times/ye
ójcze (pestycydy) w
mix or
ar)
domu, na balkonie, w
spray
ogrodzie lub na
pesticides,
działce?
insecticide
s, or weed
Show when
env.summary includes
“Regular
mixing/spraying of
pesticides at
home/garden”.
Validati
Requir
on
UX Notes
ed
(Mobile)
Yes
Integer
(when
0–365.
shown)
Output Mapping
Provide
quick chips
(0, 1–5, 6–
11, ≥12)
that prefill
Observation
numbers
onkn.env.pesticide.uses_per_
for mobile;
year, unit 1/a.
wyjaśnić,
że chodzi o
sytuacje,
gdy
sam(a)Field Key
Question
Question (PL)
(EN)
Type
Options
/
Logic (Show When)
Allowed
Values
Validati
Requir
on
UX Notes
ed
(Mobile)
killers at
home, on
the
balcony,
in the
garden or
allotment?
For
roughly
how many
years
have you
env.pesticide.years_us used
e
these
products
at this
kind of
frequency
?
Output Mapping
przygotow
uje
Pan/Pani
roztwór lub
oprysk.
Przez ile lat mniej
więcej używa Pan/Pani
takich środków z
podobną częstością?
When
using
them, how
often do
Jak często podczas
you
stosowania tych
usually
środków zakłada
wear
Pan/Pani rękawice i
env.pesticide.protection gloves
(przy oprysku)
and (if
maseczkę oraz stosuje
spraying)
się do instrukcji na
a mask,
etykiecie?
and follow
the label
instruction
s?
Numb 0–60
er
(years)
Show when
env.pesticide.use_freq_ No
year > 0
Almost
always /
Sometim
es /
Show when
Almost
Select
env.pesticide.use_freq_ No
never /
year > 0
Not sure
/ Not
applicabl
e
0–60;
step 1.“Można
zsumować
różne
okresy (np. Observation
5 lat na
onkn.env.pesticide.years, unit
działce + 3 a.
lata przy
domu =
8).”
One
option.Used tylko
do
jakościowe
go opisu –
nie
pokazujem
y skali
Observation enum
ryzyka,
onkn.env.pesticide.protection
jedynie w
_level.
tekście
planu
pojawi się
delikatna
sugestia
lepszej
ochrony.
G) UV Exposure & Indoor Tanning (Environment/Leisure)
(Here we only capture environmental / leisure UV exposure. Occupational UV can live under a separate “Work exposures”
block)
Field Key
Question (EN)
Question (PL)
Type
Options /
Allowed
Values
Przed 18 r.ż., ile
Before age 18,
razy mniej więcej
about how many
miał(a) Pan/Pani
times did you have
oparzenie
a sunburn with
Numbe 0–20
env.uv.sunburn_child
słoneczne z
redness and
r
(integer)
zaczerwienienie
soreness lasting
m i bolesnością
more than one
skóry trwającą
day?
ponad 1 dzień?
After age 18,
env.uv.sunburn_adul about how many
t
such sunburns
have you had?
env.uv.sunbed_use
How would you
describe your use
of indoor tanning
beds
(sunbed/solarium)
?
Po 18 r.ż., ile
razy miał(a)
Pan/Pani takie
oparzenie
słoneczne?
Jak opisał(a)by
Pan/Pani
korzystanie z
solarium (łóżka
opalającego)?
Numbe 0–50
r
(integer)
Radio
Never / A
few times in
life (<10
sessions) /
Occasionall
y (10–50
sessions in
life) /
Frequently
(>50
sessions in
life) / Not
sure
Logic (Show
When)
Require
d
Validatio
UX Notes
n (Mobile)
Output Mapping
Show when
env.summary
includes
“Frequent indoor
tanning
No
(sunbed/solarium)
” OR user opens
Advanced
Environmental
block.0–20;
integer;
allow 0.Helper:
podać
przykład
(„np.
wakacje, po
których
skóra była
czerwona i
bolesna
przez kilka
dni”).
Same as above.0–50;
integer.Emphasize
Observation
“przybliżona
onkn.env.uv.sunburn_adult
liczba jest w
.
porządku”.
One
option
required.Short helper:
bez
oceniania –
“Ta
informacja
pomaga
Observation enum
dobrać
onkn.env.uv.sunbed_use.
zalecenia
dotyczące
skóry (np.
częstotliwoś
ć kontroli
znamion).”
No
Show when
env.summary
includes
“Frequent indoor Yes
tanning
(when
(sunbed/solarium) shown)
” OR Advanced
Environmental
expanded.
Observation
onkn.env.uv.sunburn_child,
unit dimensionless (count).
Derived Environmental Flags (Hidden; for Rules Engine Only)
Label (PL)
Type
Values
Logic (Inputs → Rule)
/ Rules
Field KeyLabel (EN)
derived.env.air_longterm_highDługotrwałe
Long-term high narażenie na
outdoor air
zanieczyszczone
pollution
powietrze
zewnętrzne
derived.env.solidfuel_longtermDługotrwałe
Long-term
narażenie na dym z Derived True /
indoor solid fuel
paliw stałych w
boolean False
exposure
domu
Derived True /
boolean False
Output Mapping
Observation
true if env.air.high_pollution_years ≥
onkn.env.flag.air_longterm_high
10.
(boolean).
true if env.indoor.solidfuel_years ≥
10.
Observation
onkn.env.flag.solidfuel_longterm.Label (PL)
Type
Values
Logic (Inputs → Rule)
/ Rules
Field KeyLabel (EN)derived.env.radon_highKiedykolwiek
Ever high radon
wysoki poziom
at home
radonu w domuderived.env.asbestos_unprotectedPossible
unprotected
asbestos
disturbanceMożliwa praca przy
Derived True /
azbeście bez
boolean False
zabezpieczeniatrue if env.asbestos.disturbance ∈
{Yes – once, Yes – several times}.
derived.env.well_contam_flagHistory of
private well
contaminationHistoria
zanieczyszczenia
wody ze studniDerived True /
boolean Falsetrue if env.water.well_contam_notice
∈ {Yes – problem resolved, Yes –
Observation
problem ongoing / not sure if
onkn.env.flag.well_contamination.
resolved}.
derived.env.pesticide_intensiveIntensywne
Intensive
stosowanie
pesticide use at
pestycydów w
home/garden
domu/ogrodzieDerived True /
boolean Falsetrue if env.pesticide.use_freq_year ≥
12 AND env.pesticide.years_use ≥ 5 Observation
AND env.pesticide.protection ≠
onkn.env.flag.pesticide_intensive.
Almost always.
derived.env.uv_highHigh UV
exposure (sun
or sunbed)Wysokie narażenie
Derived True /
na UV
boolean False
(słońce/solarium)true if env.uv.sunburn_child ≥ 3 OR
env.uv.sunburn_adult ≥ 5 OR
Observation onkn.env.flag.uv_high.
env.uv.sunbed_use ∈ {Occasionally,
Frequently}.
derived.env.any_high_countNumber of
high-priority
environmental
exposuresLiczba istotnych
ekspozycji
środowiskowychCount of true flags among:
air_longterm_high,
solidfuel_longterm, radon_high,
asbestos_unprotected,
well_contam_flag,
pesticide_intensive, uv_high.
Derived True /
boolean False
Derived
0–7
number
Output Mapping
true if env.radon.level_cat ∈
{Moderately elevated, Clearly above
Observation
recommended} OR (env.summary
onkn.env.flag.radon_high.
includes radon AND
env.radon.tested ≠ No).
Observation
onkn.env.flag.asbestos_unprotected.
Observation
onkn.env.flag.high_exposure_count
(unit: dimensionless).
Implementation Notes:
•
•
•
•
•
Placement & scope
o Core env.summary sits in Core flow; detailed env.* questions live in Advanced, revealed only if relevant
chips are selected.
Data minimisation & tone (ONKONO constraints)
o No risk scores, no percentages. Derived flags only drive which topics appear in the Action Plan and how
strongly they are worded (“warto wspomnieć lekarzowi...”, “można rozważyć badanie na radon / poprawę
wentylacji”).
o Microcopy must consistently stress: “information to support discussion with a doctor / not a diagnosis”.
Rules engine use (examples)
o derived.env.radon_high = true → add action ID like ACT_ENV_RADON_COUNSELLING (talk to GP / local
environmental health about radon; consider mitigation; possible lung assessment in combo with smoking
pack-years).
o derived.env.solidfuel_longterm = true AND chronic cough/resp symptoms present → nudge for lung
evaluation in the “talk to doctor” section.
o derived.env.uv_high = true → raise priority of skin exam / dermoscopy recommendation in the plan.
o derived.env.pesticide_intensive = true → add soft suggestion about safer handling + mention in general
cancer-prevention consult.
Interoperability & coding
o Store raw answers in FHIR QuestionnaireResponse as usual.
o Emit derived flags as Observation with category = social-history or environment. Use local codes onkn.env.*
and UCUM units (a, 1/a, dimensionless).
o Do not attempt to back-calculate quantitative cancer risks from these fields.
UX & mobile
o Use numeric steppers for counts/years, with “approximate OK” helper text.
o Many fields are optional; only the core env.summary and a few follow-ups are required to avoid overload.
o Keep Polish/English strings in the same i18n mechanism you’re already using (pattern from smoking/diet
specs).