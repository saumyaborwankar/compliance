'use client';
import { useEffect, useState } from 'react';
import type { Obligation } from '@/src/lib/types';

export default function AdminObligationsPage() {
  const [items, setItems] = useState<Obligation[]>([]);
  const [editing, setEditing] = useState<Obligation | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await fetch('/api/obligations');
    const data = await res.json();
    setItems(data);
  };

  useEffect(() => { load(); }, []);

  const startNew = () => {
    setEditing({
      id: '',
      title: '',
      summary: '',
      jurisdiction: 'federal',
      topics: [],
      triggers: [],
      actions: [],
      citations: [],
      version: '1.0.0',
      last_reviewed: new Date().toISOString().slice(0,10),
    } as Obligation);
  };

  const save = async () => {
    if (!editing) return;
    setLoading(true);
    const method = items.some((i) => i.id === editing.id) ? 'PUT' : 'POST';
    const res = await fetch('/api/obligations', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
    setLoading(false);
    if (!res.ok) { alert('Save failed'); return; }
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this obligation?')) return;
    await fetch('/api/obligations?id=' + encodeURIComponent(id), { method: 'DELETE' });
    load();
  };

  return (
    <div className="mx-auto max-w-6xl p-6 grid md:grid-cols-2 gap-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-semibold">Obligations</h1>
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={startNew}>New</button>
        </div>
        <ul className="divide-y border rounded">
          {items.map((o) => (
            <li key={o.id} className="p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{o.title}</div>
                <div className="text-xs text-gray-600">{o.jurisdiction}{o.state ? ` · ${o.state}` : ''}{o.city ? ` · ${o.city}` : ''}</div>
              </div>
              <div className="flex gap-2">
                <button className="px-2 py-1 border rounded" onClick={() => setEditing(o)}>Edit</button>
                <button className="px-2 py-1 border rounded text-red-600" onClick={() => remove(o.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        {editing && (
          <div className="border rounded p-4 space-y-3">
            <h2 className="font-semibold">{items.some(i => i.id === editing.id) ? 'Edit' : 'New'} Obligation</h2>
            <div>
              <label className="block text-sm">ID</label>
              <input className="mt-1 w-full border rounded p-2" value={editing.id} onChange={(e) => setEditing({ ...editing, id: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm">Title</label>
              <input className="mt-1 w-full border rounded p-2" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm">Summary</label>
              <textarea className="mt-1 w-full border rounded p-2" value={editing.summary || ''} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm">Jurisdiction</label>
                <select className="mt-1 w-full border rounded p-2" value={editing.jurisdiction} onChange={(e) => setEditing({ ...editing, jurisdiction: e.target.value as Obligation['jurisdiction'] })}>
                  <option value="federal">Federal</option>
                  <option value="state">State</option>
                  <option value="city">City</option>
                </select>
              </div>
              <div>
                <label className="block text-sm">State</label>
                <input className="mt-1 w-full border rounded p-2" value={editing.state || ''} onChange={(e) => setEditing({ ...editing, state: e.target.value || undefined })} />
              </div>
              <div>
                <label className="block text-sm">City</label>
                <input className="mt-1 w-full border rounded p-2" value={editing.city || ''} onChange={(e) => setEditing({ ...editing, city: e.target.value || undefined })} />
              </div>
            </div>
            <div>
              <label className="block text-sm">Topics (comma-separated)</label>
              <input className="mt-1 w-full border rounded p-2" value={(editing.topics || []).join(', ')} onChange={(e) => setEditing({ ...editing, topics: e.target.value.split(',').map(s => s.trim()).filter(Boolean) as Obligation['topics'] })} />
            </div>
            <div>
              <label className="block text-sm">Frequency</label>
              <input className="mt-1 w-full border rounded p-2" value={editing.frequency || ''} onChange={(e) => setEditing({ ...editing, frequency: e.target.value || undefined })} />
            </div>
            <div>
              <label className="block text-sm">Penalties</label>
              <input className="mt-1 w-full border rounded p-2" value={editing.penalties || ''} onChange={(e) => setEditing({ ...editing, penalties: e.target.value || undefined })} />
            </div>
            <div>
              <label className="block text-sm">Citations (format: URL|Text per line)</label>
              <textarea className="mt-1 w-full border rounded p-2" value={(editing.citations || []).map(c => `${c.url}|${c.text}`).join('\n')} onChange={(e) => setEditing({ ...editing, citations: e.target.value.split('\n').filter(Boolean).map(line => { const [url, text] = line.split('|'); return { url: url?.trim() || '', text: text?.trim() || '' }; }) })} />
            </div>
            <div>
              <label className="block text-sm">Triggers (JSON array)</label>
              <textarea className="mt-1 w-full border rounded p-2 font-mono text-xs" rows={6} value={JSON.stringify(editing.triggers, null, 2)} onChange={(e) => {
                try { setEditing({ ...editing, triggers: JSON.parse(e.target.value) }); } catch {}
              }} />
            </div>
            <div>
              <label className="block text-sm">Actions (JSON array)</label>
              <textarea className="mt-1 w-full border rounded p-2 font-mono text-xs" rows={4} value={JSON.stringify(editing.actions, null, 2)} onChange={(e) => {
                try { setEditing({ ...editing, actions: JSON.parse(e.target.value) }); } catch {}
              }} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm">Effective From</label>
                <input type="date" className="mt-1 w-full border rounded p-2" value={editing.effective_from || ''} onChange={(e) => setEditing({ ...editing, effective_from: e.target.value || undefined })} />
              </div>
              <div>
                <label className="block text-sm">Effective To</label>
                <input type="date" className="mt-1 w-full border rounded p-2" value={editing.effective_to || ''} onChange={(e) => setEditing({ ...editing, effective_to: e.target.value || undefined })} />
              </div>
              <div>
                <label className="block text-sm">Last Reviewed</label>
                <input type="date" className="mt-1 w-full border rounded p-2" value={editing.last_reviewed || ''} onChange={(e) => setEditing({ ...editing, last_reviewed: e.target.value || undefined })} />
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-50" disabled={loading} onClick={save}>{loading ? 'Saving...' : 'Save'}</button>
              <button className="px-3 py-1 border rounded" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
