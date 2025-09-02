'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface FormState {
  name?: string;
  location: { state: string; city?: string; zip?: string };
  industry: { naicsCode?: string; description?: string };
  employeeCount: number | '';
  entityType: 'llc' | 's_corp' | 'c_corp' | 'sole_prop' | 'partnership' | 'nonprofit' | '';
  activities: Record<string, boolean>;
}

export default function IntakePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const STATES: { code: string; name: string }[] = [
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'DC', name: 'District of Columbia' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' },
  ];
  const [form, setForm] = useState<FormState>({
    name: '',
    location: { state: '', city: '', zip: '' },
    industry: { naicsCode: '', description: '' },
    employeeCount: '',
    entityType: '',
    activities: {
      servesFood: false,
      sellsAlcohol: false,
      handlesPersonalData: false,
      employsMinors: false,
      providesHealthcare: false,
      operatesVehicles: false,
      handlesHazardousMaterials: false,
      eCommerce: false,
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const canNext = () => {
    if (step === 1) return !!form.location.state;
    if (step === 2) return !!(form.industry.naicsCode || form.industry.description);
    if (step === 3) return !!form.employeeCount && !!form.entityType;
    return true;
  };

  const submit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          location: form.location,
          industry: form.industry,
          employeeCount: Number(form.employeeCount || 0),
          entityType: form.entityType,
          activities: form.activities,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('latest_evaluation', JSON.stringify(json));
      }
      router.push(`/results/local`);
    } catch {
      alert('Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold mb-4">Business Intake</h1>

      {step === 1 && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium">State</label>
            <select
              className="mt-1 w-full border rounded p-2"
              value={form.location.state}
              onChange={(e) => setForm({ ...form, location: { ...form.location, state: e.target.value } })}
            >
              <option value="">Select a state...</option>
              {STATES.map((s) => (
                <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">City</label>
              <input className="mt-1 w-full border rounded p-2" value={form.location.city} onChange={(e) => setForm({ ...form, location: { ...form.location, city: e.target.value } })} />
            </div>
            <div>
              <label className="block text-sm font-medium">ZIP</label>
              <input className="mt-1 w-full border rounded p-2" value={form.location.zip} onChange={(e) => setForm({ ...form, location: { ...form.location, zip: e.target.value } })} />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Industry (NAICS)</label>
            <input className="mt-1 w-full border rounded p-2" value={form.industry.naicsCode} onChange={(e) => setForm({ ...form, industry: { ...form.industry, naicsCode: e.target.value } })} placeholder="e.g., 722511" />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <input className="mt-1 w-full border rounded p-2" value={form.industry.description} onChange={(e) => setForm({ ...form, industry: { ...form.industry, description: e.target.value } })} placeholder="e.g., Full-service restaurants" />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Employee Count</label>
            <input type="number" className="mt-1 w-full border rounded p-2" value={form.employeeCount} onChange={(e) => setForm({ ...form, employeeCount: e.target.value === '' ? '' : Number(e.target.value) })} />
          </div>
          <div>
            <label className="block text-sm font-medium">Entity Type</label>
            <select className="mt-1 w-full border rounded p-2" value={form.entityType} onChange={(e) => setForm({ ...form, entityType: e.target.value as FormState['entityType'] })}>
              <option value="">Select...</option>
              <option value="llc">LLC</option>
              <option value="s_corp">S-Corp</option>
              <option value="c_corp">C-Corp</option>
              <option value="sole_prop">Sole Proprietorship</option>
              <option value="partnership">Partnership</option>
              <option value="nonprofit">Nonprofit</option>
            </select>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(form.activities).map(([key, value]) => (
            <label key={key} className="flex items-center gap-2 border rounded p-2">
              <input type="checkbox" checked={value} onChange={(e) => setForm({ ...form, activities: { ...form.activities, [key]: e.target.checked } })} />
              <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
            </label>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <button className="px-4 py-2 border rounded" disabled={step === 1} onClick={() => setStep((s) => Math.max(1, s - 1))}>Back</button>
        {step < 4 ? (
          <button className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50" disabled={!canNext()} onClick={() => setStep((s) => s + 1)}>Next</button>
        ) : (
          <button className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50" disabled={loading} onClick={submit}>{loading ? 'Submitting...' : 'Submit'}</button>
        )}
      </div>
    </div>
  );
}
