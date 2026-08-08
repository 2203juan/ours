/**
 * Placeholder that mirrors the real CategorySection/PlanItem layout so the
 * list doesn't reflow when data arrives.
 */

// Varied widths keep the placeholder from looking mechanical.
const SECTIONS = [
  { header: 'w-32', rows: ['w-40', 'w-28', 'w-36'] },
  { header: 'w-24', rows: ['w-32', 'w-44'] },
]

export function PlanListSkeleton() {
  return (
    <div className="pt-3 pb-32" aria-busy="true" aria-label="Loading plans">
      {SECTIONS.map((section, i) => (
        <div
          key={i}
          className="mx-4 mb-3 rounded-3xl bg-white border border-cream-200 overflow-hidden shadow-soft"
        >
          {/* Section header */}
          <div className="flex items-center gap-2.5 px-4 py-3.5">
            <div className={`h-3.5 rounded bg-cream-200 animate-pulse ${section.header}`} />
            <div className="h-4 w-6 rounded-full bg-cream-100 animate-pulse" />
          </div>

          {/* Rows */}
          <div className="border-t border-cream-100">
            {section.rows.map((width, j) => (
              <div
                key={j}
                className="flex items-center gap-3 px-4 py-3 border-b border-cream-100 last:border-b-0"
              >
                <div className="h-6 w-6 rounded-full bg-cream-200 animate-pulse shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className={`h-3.5 rounded bg-cream-200 animate-pulse ${width}`} />
                  <div className="h-2.5 w-20 rounded bg-cream-100 animate-pulse" />
                </div>
                <div className="h-6 w-6 rounded-full bg-cream-100 animate-pulse shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
