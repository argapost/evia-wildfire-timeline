import { useState } from 'react';

export default function TimelineWorkspacePlaceholder() {
  const [hydratedAt] = useState(() => new Date().toISOString());

  return (
    <section className="workspace-placeholder" aria-live="polite">
      <h2>Interactive Island Ready</h2>
      <p>
        React hydration is active. Timeline, filters, detail panel, and map integration are intentionally deferred to
        the next phases.
      </p>
      <code>{hydratedAt}</code>
    </section>
  );
}
