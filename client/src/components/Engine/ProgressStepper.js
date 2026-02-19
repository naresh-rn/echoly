import React from 'react';

const ProgressStepper = ({ progress, statusText }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400">
            Current Status
          </span>
          <h3 className="text-xs font-semibold text-zinc-900 uppercase">
            {statusText}
          </h3>
        </div>
        <span className="text-xs font-medium tabular-nums text-zinc-900">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Minimalist Black Bar */}
      <div className="h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-black transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressStepper;