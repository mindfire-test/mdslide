import React from 'react';

export default function SkeletonCard(): React.ReactElement {
  return (
    <div className="bg-app-surface border border-app-border rounded-lg p-[22px] flex flex-col gap-0">
      <div className="flex items-center gap-3.5 mb-3">
        <div className="w-12 h-12 rounded-full shrink-0 shimmer-bg" />
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="h-3 rounded shimmer-bg" style={{ width: '60%' }} />
          <div className="h-3 rounded shimmer-bg" style={{ width: '40%' }} />
        </div>
      </div>
      <div className="h-3 rounded shimmer-bg" style={{ width: '90%', marginTop: '12px' }} />
      <div className="h-3 rounded shimmer-bg" style={{ width: '70%', marginTop: '6px' }} />
      <div className="flex gap-2 mt-4 pt-3 border-t border-app-border">
        <div className="h-5 w-[100px] rounded shimmer-bg" />
        <div className="h-5 rounded shimmer-bg" style={{ width: '80px' }} />
      </div>
    </div>
  );
}
