import { readJsonFile } from '@/src/lib/storage/jsonStore';
import { EvaluationResult, Obligation } from '@/src/lib/types';

function groupByJurisdiction(obligations: Obligation[], evaluations: EvaluationResult['appliedObligations']) {
  const byId = new Map(obligations.map((o) => [o.id, o] as const));
  const applied = evaluations.filter((e) => e.applied);
  const groups: Record<string, { obligation: Obligation; eval: typeof applied[number] }[]> = {};
  for (const e of applied) {
    const ob = byId.get(e.obligationId);
    if (!ob) continue;
    const key = ob.jurisdiction === 'state' ? `state:${ob.state}` : ob.jurisdiction === 'city' ? `city:${ob.city}` : 'federal';
    groups[key] = groups[key] || [];
    groups[key].push({ obligation: ob, eval: e });
  }
  return groups;
}

export default async function ResultsPage({ params }: { params: Promise<{ evaluationId: string }> }) {
  const { evaluationId } = await params;
  const evaluations = await readJsonFile<EvaluationResult[]>('evaluations.json', []);
  const obligations = await readJsonFile<Obligation[]>('obligations.json', []);
  const evaluation = evaluations.find((e) => e.id === evaluationId);

  if (!evaluation) {
    return <div className="p-6">No evaluation found.</div>;
  }

  const groups = groupByJurisdiction(obligations, evaluation.appliedObligations);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-bold mb-4">Compliance Obligations</h1>

      {Object.keys(groups).length === 0 && <div>No obligations matched.</div>}

      {Object.entries(groups).map(([groupKey, items]) => (
        <div key={groupKey} className="mb-8">
          <h2 className="text-xl font-semibold mb-3 capitalize">{groupKey.replace(':', ': ')}</h2>
          <div className="grid gap-4">
            {items.map(({ obligation, eval: ev }) => (
              <div key={obligation.id} className="border rounded p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{obligation.title}</h3>
                    {obligation.summary && <p className="text-sm text-gray-600">{obligation.summary}</p>}
                  </div>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">{obligation.topics.join(', ')}</span>
                </div>
                {obligation.actions?.length > 0 && (
                  <div className="mt-3">
                    <div className="font-medium">Actions</div>
                    <ul className="list-disc ml-6 text-sm">
                      {obligation.actions.map((a, i) => (
                        <li key={i}>{a.summary}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {obligation.frequency && (
                  <div className="mt-2 text-sm"><span className="font-medium">Frequency:</span> {obligation.frequency}</div>
                )}
                {obligation.penalties && (
                  <div className="mt-1 text-sm"><span className="font-medium">Penalties:</span> {obligation.penalties}</div>
                )}
                {obligation.citations?.length > 0 && (
                  <div className="mt-2 text-sm">
                    <div className="font-medium">Citations</div>
                    <ul className="list-disc ml-6">
                      {obligation.citations.map((c, i) => (
                        <li key={i}><a className="text-blue-600 underline" href={c.url} target="_blank" rel="noreferrer">{c.text}</a></li>
                      ))}
                    </ul>
                  </div>
                )}
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium">Why this applies</summary>
                  <ul className="list-disc ml-6 text-sm mt-2">
                    {ev.explanation.matchedPredicates.map((m, i) => (
                      <li key={i}>
                        <span className="font-medium">{m.factPath}</span> {m.operator} {m.expected !== undefined ? JSON.stringify(m.expected) : ''} → actual {JSON.stringify(m.actual)} {m.matched ? '✓' : '✕'}
                      </li>
                    ))}
                  </ul>
                </details>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
