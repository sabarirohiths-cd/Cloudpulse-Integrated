import React from 'react';
import { Database, Save, AlertCircle, Eye } from 'lucide-react';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ResourceIcon } from '../../../components/ui/ResourceIcon';
import { formatIdentifier, formatName } from '../../../utils/ui-utils';

export function PreviewStep({ visibleResources, hasChanges, onPrev, onSave, isSaving }) {
  return (
    <div className="animate-in fade-in duration-300 max-w-[1100px]">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white whitespace-nowrap">Review & Save</h2>
          <div className="h-7 w-px bg-zinc-800 shrink-0" />
          <p className="text-[11px] text-zinc-400 leading-snug max-w-[280px]">
            These are the actionable resources that will be shown on the main Control page to end users.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={onSave}
            disabled={isSaving || !hasChanges}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[12px] font-bold rounded-full transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:shadow-none disabled:bg-zinc-700"
          >
            <Save className={`h-3.5 w-3.5 ${isSaving ? 'animate-pulse' : ''}`} />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {visibleResources.length === 0 ? (
        <div className="bg-[#111114] border border-[#1f1f24] rounded-xl shadow-xl flex flex-col h-[calc(100vh-180px)] min-h-[350px] items-center justify-center">
          <div className="text-center p-8 max-w-md mx-auto">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
              <Eye className="h-8 w-8 text-blue-400 opacity-50" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">No Visible Resources</h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              You have chosen to hide all resources. When saved, the main Control dashboard will be completely empty.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-[#111114] border border-[#1f1f24] rounded-xl shadow-xl overflow-hidden flex flex-col h-[calc(100vh-180px)] min-h-[350px]">
          {/* Header */}
          <div className="bg-[#161b22] border-b border-[#26262b] px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-md bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <Database className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-[13px] font-bold text-white tracking-wide">Selected Resources List</h3>
                <p className="text-[10px] text-zinc-400 font-medium">Ready for deployment</p>
              </div>
            </div>
            <div className="bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
              <span className="text-emerald-400 text-[11px] font-bold">{visibleResources.length} Resources</span>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-1 custom-scrollbar">
            {visibleResources.map(r => (
              <div key={r.resource_id} className="group flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#0a0a0f] to-[#111114] border border-[#26262b] hover:border-blue-500/40 transition-all duration-300 shadow-sm hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                
                {/* Left Side: Identity */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#1a1f26] flex items-center justify-center border border-zinc-800/80 shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-300">
                    <ResourceIcon type={r.service_type} className="h-4 w-4 text-zinc-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-[13px] font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                        {formatName(r.name, r.resource_id, r.cloud_provider) || formatIdentifier(r.resource_id, r.cloud_provider)}
                      </h4>
                      <span className="text-[9px] font-bold tracking-wider uppercase bg-[#1a1f26] text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-800 shrink-0 leading-none">
                        {r.service_type}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate font-mono">
                      {r.resource_id}
                    </div>
                  </div>
                </div>

                {/* Right Side: Meta & Status */}
                <div className="flex items-center gap-5 shrink-0 pl-5 border-l border-zinc-800/60">
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mb-0.5 leading-none">Region</span>
                    <span className="text-[11px] text-zinc-300 font-medium">{r.region || 'Global'}</span>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mb-0.5 leading-none">Status</span>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${r.status?.includes('ACTIVE') || r.status?.includes('RUNNING') ? 'bg-emerald-400 animate-pulse' : r.status?.includes('STOPPED') ? 'bg-amber-400' : 'bg-zinc-500'}`} />
                      <span className="text-[11px] font-bold text-white leading-none">{r.status || 'UNKNOWN'}</span>
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
