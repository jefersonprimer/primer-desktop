import { useEffect, useState } from 'react';
import { getChangelogs, type Changelog } from '../../lib/tauri';

export default function ChangelogTab() {
  const [changelogs, setChangelogs] = useState<Changelog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChangelogs()
      .then(setChangelogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-neutral-400">Loading changes...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-[#1D1D1F] overflow-y-auto">
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="flex flex-col">
            <h2 className="text-base font-semibold text-white">Changelog</h2>
            <p className="text-sm text-neutral-400">Primer innovates every day. See what's new!</p>
          </div>
            
            {changelogs.map((log) => (
              <div key={log.id} className="mb-8">
                <div className="flex justify-between items-start mb-4 text-white">
                  <h3 className="text-lg font-semibold">{log.title}</h3>
                </div>
                <div 
                  className="text-neutral-300 leading-relaxed text-sm changelog-content"
                  dangerouslySetInnerHTML={{ __html: log.content }}
                />
              </div>
            ))}
            
            {changelogs.length === 0 && (
                <div className="text-neutral-500 text-center py-10 flex flex-col items-center gap-2">
                    <div className="text-4xl">📜</div>
                    <div>No release notes found.</div>
                </div>
            )}
        </div>
        <style>{`
          .changelog-content h3 {
            color: white;
            font-weight: 600;
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
            font-size: 1rem;
          }
          .changelog-content h3:first-child {
            margin-top: 0;
          }
          .changelog-content ul {
            list-style-type: disc;
            margin-left: 1.25rem;
            margin-bottom: 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          .changelog-content li {
            margin-bottom: 0.25rem;
          }
          .changelog-content strong {
            color: white;
            font-weight: 600;
          }
        `}</style>
    </div>
  );
}
