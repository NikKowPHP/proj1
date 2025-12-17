/**
 * FHIR R4 Type Definitions for ONKONO
 * Aligned with HL7 FHIR Specification
 */

export type ResourceType = 
  | "Bundle" | "Patient" | "QuestionnaireResponse" | "Condition" 
  | "Observation" | "Procedure" | "Immunization" | "MedicationStatement" 
  | "FamilyMemberHistory" | "Consent";

export interface FhirResource {
  resourceType: ResourceType;
  id?: string;
  meta?: { profile?: string[] };
}

export interface FhirCoding {
  system: string;
  code: string;
  display?: string;
}

export interface FhirCodeableConcept {
  coding: FhirCoding[];
  text?: string;
}

export interface FhirReference {
  reference: string;
  display?: string;
}

export interface FhirQuantity {
  value: number;
  unit: string;
  system: "http://unitsofmeasure.org";
  code: string;
}

// --- Specific Resources ---

export interface FhirBundle extends FhirResource {
  resourceType: "Bundle";
  type: "collection";
  entry: { resource: FhirResource }[];
}

export interface FhirPatient extends FhirResource {
  resourceType: "Patient";
  birthDate?: string;
  gender?: "male" | "female" | "other" | "unknown";
}

export interface FhirQuestionnaireResponse extends FhirResource {
  resourceType: "QuestionnaireResponse";
  status: "completed";
  authored: string;
  item: {
    linkId: string;
    answer: { valueString?: string; valueInteger?: number; valueBoolean?: boolean; valueDate?: string }[];
  }[];
}

export interface FhirCondition extends FhirResource {
  resourceType: "Condition";
  clinicalStatus?: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical"; code: string }] };
  verificationStatus?: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-ver-status"; code: string }] };
  code: FhirCodeableConcept;
  subject: FhirReference;
  onsetDateTime?: string; // YYYY or YYYY-MM-DD
  onsetAge?: FhirQuantity;
}

export interface FhirObservation extends FhirResource {
  resourceType: "Observation";
  status: "final" | "preliminary";
  category?: FhirCodeableConcept[];
  code: FhirCodeableConcept;
  subject: FhirReference;
  valueQuantity?: FhirQuantity;
  valueCodeableConcept?: FhirCodeableConcept;
  valueBoolean?: boolean;
  valueString?: string;
  effectiveDateTime?: string;
}

export interface FhirProcedure extends FhirResource {
  resourceType: "Procedure";
  status: "completed";
  code: FhirCodeableConcept;
  subject: FhirReference;
  performedDateTime?: string;
  reasonCode?: FhirCodeableConcept[];
}

export interface FhirImmunization extends FhirResource {
  resourceType: "Immunization";
  status: "completed";
  vaccineCode: FhirCodeableConcept;
  patient: FhirReference;
  occurrenceDateTime?: string;
  protocolApplied?: { doseNumberPositiveInt: number }[];
}

export interface FhirMedicationStatement extends FhirResource {
  resourceType: "MedicationStatement";
  status: "active" | "completed";
  medicationCodeableConcept: FhirCodeableConcept;
  subject: FhirReference;
  effectivePeriod?: { start?: string; end?: string };
}

export interface FhirFamilyMemberHistory extends FhirResource {
  resourceType: "FamilyMemberHistory";
  status: "completed";
  patient: FhirReference;
  relationship: FhirCodeableConcept;
  sex?: FhirCodeableConcept;
  condition?: {
    code: FhirCodeableConcept;
    onsetAge?: FhirQuantity;
  }[];
}
