import { describe, it, expect } from 'vitest';
import { evaluateObligation } from './evaluator';
import type { Obligation, BusinessProfile } from '../types';

const baseBiz: BusinessProfile = {
  id: 'b1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  location: { state: 'CA', city: 'San Jose', zip: '95110' },
  industry: { naicsCode: '722511', description: 'Restaurants' },
  employeeCount: 5,
  entityType: 'llc',
  activities: { servesFood: true, sellsAlcohol: false, handlesPersonalData: true, employsMinors: false, providesHealthcare: false, operatesVehicles: false, handlesHazardousMaterials: false, eCommerce: false },
};

const flsa: Obligation = {
  id: 'flsa',
  title: 'FLSA Poster',
  jurisdiction: 'federal',
  topics: ['labor'],
  triggers: [ { fact: 'employeeCount', operator: 'gte', value: 1 } ],
  actions: [ { summary: 'Post poster' } ],
  citations: [],
};

const hazcom: Obligation = {
  id: 'hazcom',
  title: 'HazCom',
  jurisdiction: 'federal',
  topics: ['safety'],
  triggers: [ { fact: 'activities.handlesHazardousMaterials', operator: 'equals', value: true } ],
  actions: [ { summary: 'Program' } ],
  citations: [],
};

const caWage: Obligation = {
  id: 'ca_wage',
  title: 'CA Wage Notice',
  jurisdiction: 'state',
  state: 'CA',
  topics: ['labor'],
  triggers: [ { fact: 'location.state', operator: 'equals', value: 'CA' }, { fact: 'employeeCount', operator: 'gte', value: 1 } ],
  actions: [ { summary: 'Provide notice' } ],
  citations: [],
};

describe('evaluateObligation', () => {
  it('applies when numeric comparison passes', () => {
    const res = evaluateObligation(flsa, baseBiz);
    expect(res.applied).toBe(true);
  });
  it('does not apply when boolean mismatch', () => {
    const res = evaluateObligation(hazcom, baseBiz);
    expect(res.applied).toBe(false);
  });
  it('applies when multiple predicates all match', () => {
    const res = evaluateObligation(caWage, baseBiz);
    expect(res.applied).toBe(true);
  });
});
