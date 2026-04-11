import { Suspense } from "react";
import YTSearchInner from "./_components/YTSearchInner";

export const metadata = {
  title: "YouTube Search — RemiX",
};

export default function YTSearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <YTSearchInner />
    </Suspense>
  );
}

function SearchFallback() {
  return (
    <div className="px-5 md:px-8 py-8">
      <div className="remix-shimmer h-12 max-w-xl rounded-xl mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl overflow-hidden" style={{ background: "rgba(18,18,32,0.6)" }}>
            <div className="remix-shimmer w-full aspect-video" />
            <div className="p-3 space-y-2">
              <div className="remix-shimmer h-3.5 w-5/6 rounded" />
              <div className="remix-shimmer h-3 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
