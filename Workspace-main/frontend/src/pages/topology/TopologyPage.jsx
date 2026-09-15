import React from 'react';

export default function TopologyPage() {
  return (
    <div className="w-[calc(100%+3rem)] h-[calc(100vh)] -m-6 overflow-hidden flex flex-col">
      <iframe
        src="/topology-app/"
        title="Topology Viewer"
        className="w-full flex-1 border-0"
      />
    </div>
  );
}
