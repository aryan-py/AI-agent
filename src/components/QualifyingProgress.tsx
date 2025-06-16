
import React from "react";

/** 
 * Shows visual progress bar for qualifying questions answered
 */
const QualifyingProgress = ({ answered, total }: { answered: number; total: number }) => (
  <div className="flex items-center space-x-2">
    <div className="w-40 bg-gray-200 rounded h-2 overflow-hidden">
      <div
        className="bg-emerald-600 h-2 transition-all"
        style={{ width: `${(answered / total) * 100}%` }}
      />
    </div>
    <span className="text-xs text-gray-500">
      {answered} / {total} questions answered
    </span>
  </div>
);

export default QualifyingProgress;
