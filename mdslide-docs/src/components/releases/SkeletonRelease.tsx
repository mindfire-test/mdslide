import React from 'react';

export default function SkeletonRelease(): React.ReactElement {
  return (
    <div className="bg-app-surface border border-app-border rounded-xl overflow-hidden p-7 flex flex-col gap-4">
      <div className="flex flex-col gap-2.5">
        <div className="h-5.5 w-20 rounded-md shimmer-bg" />
        <div className="h-6 w-[260px] rounded-md max-w-full shimmer-bg" />
        <div className="h-3.5 w-[340px] rounded max-w-full shimmer-bg" />
      </div>
      <div className="flex flex-col gap-2">
        {[90, 70, 80, 55].map((w, i) => (
          <div key={i} className="h-3 rounded shimmer-bg" style={{ width: `${w}%` }} />
        ))}
      </div>
      <div className="flex gap-2.5 flex-wrap">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-11 rounded-md flex-1 min-w-[180px] shimmer-bg" />
        ))}
      </div>
    </div>
  );
}
