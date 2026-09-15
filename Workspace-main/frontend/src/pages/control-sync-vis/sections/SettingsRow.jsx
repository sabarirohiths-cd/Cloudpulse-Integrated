import React from 'react';
import { ChevronRight, ChevronDown, Check } from 'lucide-react';
import { ResourceIcon } from '../../../components/ui/ResourceIcon';

export function SettingsRow({ r, isGroupView, toggleRow, handleToggle, setDetailResource }) {
  const isExpandable = r._isExpandable;
  const isExpanded = r._isExpanded;
  const paddingLeft = r._level ? `${r._level * 24 + 16}px` : '16px';

  const getStatusColor = (status) => {
    const s = (status || 'UNKNOWN').toUpperCase();
    if (['RUNNING', 'AVAILABLE', 'ACTIVE'].includes(s)) return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]';
    if (['STOPPED', 'STOPPING'].includes(s)) return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]';
    if (['STARTING', 'PENDING'].includes(s)) return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]';
    return 'bg-zinc-700';
  };

  return (
    <div 
      className={`flex items-center justify-between py-1 pr-3 border-b border-white/[0.02] transition-colors group cursor-pointer ${r.is_visible ? 'bg-indigo-500/[0.02] hover:bg-indigo-500/[0.05]' : 'hover:bg-white/[0.02]'}`}
      style={{ paddingLeft }}
      onClick={() => handleToggle(r)}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        
        {isGroupView && (
          <div className="w-4 flex-shrink-0 flex items-center justify-center">
            {isExpandable ? (
              <button 
                onClick={(e) => { e.stopPropagation(); toggleRow(r.resource_id); }}
                className="p-0.5 hover:bg-white/10 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <div className="w-3.5" />
            )}
          </div>
        )}

        {/* Custom Checkbox */}
        <div className="flex-shrink-0 flex items-center justify-center">
          <div className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center transition-all duration-200 ${r.is_visible ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-600 bg-transparent group-hover:border-zinc-400'}`}>
            {r.is_visible && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
          </div>
        </div>

        <div className={`flex-shrink-0 p-1 rounded-lg transition-colors ${r.is_visible ? 'bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20' : 'bg-zinc-800/50 text-zinc-500 ring-1 ring-white/5'}`}>
          <ResourceIcon serviceType={r.service_type} className="w-3.5 h-3.5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(r.status)}`} title={r.status || 'UNKNOWN'} />
            <div 
              className={`text-[12px] font-semibold truncate transition-colors ${r.is_visible ? 'text-zinc-200' : 'text-zinc-500'}`}
            >
              {r.name}
            </div>
            <span className="text-[10px] text-zinc-500 font-mono truncate ml-1">
              {r.resource_id}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] font-medium text-zinc-400 uppercase tracking-wider">
              {r.service_type}
            </span>
            <div className="w-1 h-1 rounded-full bg-zinc-700" />
            <span className="text-[10px] font-medium text-zinc-400">
              {r.region}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pl-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); setDetailResource && setDetailResource(r); }}
          className="text-[10px] font-medium text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
        >
          Details
        </button>
      </div>
    </div>
  );
}
