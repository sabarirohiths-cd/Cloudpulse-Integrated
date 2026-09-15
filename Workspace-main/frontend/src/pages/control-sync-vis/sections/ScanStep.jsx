import React from 'react';
import { RefreshCw, Activity } from 'lucide-react';
import { AwsRegionSelect } from './AwsRegionSelect';

export function ScanStep({ topFilters, syncRegions, setSyncRegions, syncing, handleSync, onNext, existingRegions = [], totalResources = 0, lastSyncDate = 'Never' }) {
  const isAll = syncRegions.length === 0 || syncRegions.includes('all');
  const regionCountDisplay = isAll ? 'All Regions' : `${syncRegions.length} Region${syncRegions.length > 1 ? 's' : ''}`;

  return (
    <div className="animate-in fade-in duration-300 max-w-[1100px]">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white whitespace-nowrap">Resource Discovery</h2>
          <div className="h-7 w-px bg-zinc-800 shrink-0" />
          <p className="text-[11px] text-zinc-400 leading-snug max-w-[280px]">
            Scan your {topFilters.provider} environment to discover new resources and ensure your dashboard is up to date.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={handleSync}
            disabled={syncing || !topFilters.account}
            className="flex items-center gap-2 px-5 py-2 text-[12px] font-bold bg-white text-black rounded-full hover:bg-zinc-200 disabled:opacity-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Start Discovery Sync'}
          </button>
        </div>
      </div>

      <div className="flex items-start gap-6 w-full">
        {/* Left Window: Region Selection */}
        <div className="bg-[#111114] border border-[#1f1f24] rounded-xl p-6 flex flex-col shadow-lg h-[calc(100vh-180px)] min-h-[350px] flex-1">
          <div className="flex items-center justify-between mb-4">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Select Regions to Scan</label>
            {existingRegions.length > 0 && (
              <button
                onClick={() => setSyncRegions(existingRegions)}
                className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
              >
                Fill Existing Regions
              </button>
            )}
          </div>
          <div className="flex-1 min-h-0">
            <AwsRegionSelect value={syncRegions} onChange={setSyncRegions} disabled={syncing} />
          </div>
        </div>

        {/* Right Window: Overview */}
        <div className="bg-[#111114] border border-[#1f1f24] rounded-xl p-6 flex flex-col shadow-lg h-fit w-[380px] shrink-0">

          {/* Discovery Overview */}
          <div className="flex-1 mb-6">
            <h3 className="text-[13px] font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              Discovery Overview
            </h3>

            <div className="space-y-3">
              <div className="bg-black/40 border border-zinc-800/80 rounded-lg p-3">
                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Target Scope</div>
                <div className="text-[12px] text-zinc-300 font-medium">Ready to scan <span className="text-emerald-400 font-bold">{regionCountDisplay}</span></div>
              </div>

              <div className="bg-black/40 border border-zinc-800/80 rounded-lg p-3">
                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Current State</div>
                <div className="text-[12px] text-zinc-300 font-medium mb-1">Managing <span className="text-blue-400 font-bold">{totalResources} resources</span> in {topFilters.account || 'this account'}</div>
                <div className="text-[11px] text-zinc-500">Last Synced: {lastSyncDate}</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
