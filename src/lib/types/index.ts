export type Jurisdiction = 'federal' | 'state' | 'city';

export type Topic = 'labor' | 'tax' | 'safety' | 'privacy' | 'environment' | 'licensing' | 'other';

export type EntityType = 'llc' | 's_corp' | 'c_corp' | 'sole_prop' | 'partnership' | 'nonprofit';

export interface BusinessProfile {
  id: string;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  name?: string;
  location: {
    state: string;
    city?: string;
    zip?: string;
  };
  industry: {
    naicsCode?: string;
    description?: string;
  };
  employeeCount: number;
  entityType: EntityType;
  activities: {
    servesFood?: boolean;
    sellsAlcohol?: boolean;
    handlesPersonalData?: boolean;
    employsMinors?: boolean;
    providesHealthcare?: boolean;
    operatesVehicles?: boolean;
    handlesHazardousMaterials?: boolean;
    eCommerce?: boolean;
  };
}

export interface Citation {
  url: string;
  text: string;
}

export interface ObligationAction {
  summary: string;
  details?: string;
}

export type TriggerPredicateOperator =
  | 'equals'
  | 'not_equals'
  | 'in'
  | 'not_in'
  | 'gte'
  | 'lte'
  | 'gt'
  | 'lt'
  | 'exists'
  | 'not_exists';

export interface TriggerPredicate {
  fact: string; // dot-path into BusinessProfile, e.g., activities.servesFood
  operator: TriggerPredicateOperator;
  value?: unknown;
}

export interface Obligation {
  id: string;
  title: string;
  summary?: string;
  jurisdiction: Jurisdiction;
  state?: string; // for state rules
  city?: string; // for local rules
  topics: Topic[];
  triggers: TriggerPredicate[]; // ALL must match
  actions: ObligationAction[];
  frequency?: string; // e.g., "annual", "ongoing"
  penalties?: string;
  citations: Citation[];
  effective_from?: string; // ISO date
  effective_to?: string; // ISO date
  last_reviewed?: string; // ISO date
  version?: string;
}

export interface TriggerMatchExplanation {
  factPath: string;
  operator: TriggerPredicateOperator;
  expected?: unknown;
  actual?: unknown;
  matched: boolean;
}

export interface ObligationEvaluation {
  obligationId: string;
  applied: boolean;
  explanation: {
    title: string;
    jurisdiction: Jurisdiction;
    matchedPredicates: TriggerMatchExplanation[];
  };
}

export interface EvaluationResult {
  id: string;
  businessId: string;
  evaluatedAt: string; // ISO date
  appliedObligations: ObligationEvaluation[];
}
