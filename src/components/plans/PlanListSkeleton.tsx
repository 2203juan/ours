/**
 * Placeholder that mirrors the real PlanList/PlanItem layout so the list
 * doesn't reflow when data arrives. Keep it in step with PlanList — a skeleton
 * shaped like something else is worse than none.
 */

// Varied widths keep the placeholder from looking mechanical.
const ROW_WIDTHS = ['w-40', 'w-28', 'w-36', 'w-44', 'w-32', 'w-36']

export function PlanListSkeleton() {
  return (
    <div
      className="mx-4 mt-3 mb-32 rounded-3xl bg-white border border-cream-200
        overflow-hidden shadow-soft"
      aria-busy="true"
      aria-label="Loading plans"
    >
      {ROW_WIDTHS.map((width, i) => (
        <div
          key={i}
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
  )
}
