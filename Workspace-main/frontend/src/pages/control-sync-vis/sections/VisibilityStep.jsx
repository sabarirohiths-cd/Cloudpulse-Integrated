import React, { useMemo } from 'react';
import { Search, CheckSquare, EyeOff, Database, Server, MapPin } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';
import { FilterBar } from '../../../components/ui/FilterBar';
import { EmptyState } from '../../../components/ui/EmptyState';
import { SettingsRow } from './SettingsRow';
import { ResourceIcon } from '../../../components/ui/ResourceIcon';

export function VisibilityStep({ 
  filter, setFilter, groupOptions, regionOptions,
  searchQuery, setSearchQuery, displayCount, visibleResources,
  handleToggleAll, treeData, loading, offset, hasMore, loadMore, 
  toggleRow, handleLocalToggle, setDetailResource, 
  onNext, onPrev 
}) {
  const serviceCounts = useMemo(() => {
    const counts = {};
    visibleResources.forEach(r => {
      counts[r.service_type] = (counts[r.service_type] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [visibleResources]);

  const regionCounts = useMemo(() => {
    const counts = {};
    visibleResources.forEach(r => {
      const reg = r.region || 'Unknown Region';
      counts[reg] = (counts[reg] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count);
  }, [visibleResources]);

  return (
    <div className="animate-in fade-in duration-300 max-w-[1100px]">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white whitespace-nowrap">Resource Selection</h2>
          <div className="h-7 w-px bg-zinc-800 shrink-0" />
          <p className="text-[11px] text-zinc-400 leading-snug max-w-[280px]">
            Select which resources should be included in your dashboard for monitoring and control.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={onNext}
            className="flex items-center gap-2 px-5 py-2 text-[12px] font-bold bg-white text-black rounded-full hover:bg-zinc-200 transition-colors shadow-sm"
          >
            Preview & Save →
          </button>
        </div>
      </div>

      <div className="flex items-start gap-6 w-full">
        
        {/* Left Window: Catalog & Selection */}
        <div className="bg-[#111114] border border-[#1f1f24] rounded-xl flex flex-col shadow-lg h-[calc(100vh-180px)] min-h-[350px] flex-1 overflow-hidden">
          
          {/* Header with Search and Group filter */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/80 bg-[#161b22] gap-4">
            <FilterBar
              showLabel={false}
              className="flex items-center gap-2"
              filters={[
                { label: "Group:", value: filter.group, onChange: v => setFilter({ ...filter, group: v }), options: groupOptions, width: "w-[100px]" },
                { label: "Region:", value: filter.region, onChange: v => setFilter({ ...filter, region: v }), options: regionOptions, width: "w-[110px]" }
              ]}
            />
            <div className="flex items-center gap-2">
              <div className="relative w-40">
                <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search resources..."
                  className="w-full pl-9 pr-3 py-1.5 bg-[#111114] border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500 transition-colors shadow-inner"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/50 bg-[#111114]">
            <div className="text-[11px] font-medium text-zinc-400">
              {displayCount} Resource{displayCount !== 1 && 's'} Found
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleAll(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded hover:bg-zinc-800 transition-colors text-zinc-300 hover:text-white uppercase tracking-wider"
              >
                Select All
              </button>
              <div className="w-px h-3 bg-zinc-800" />
              <button
                onClick={() => handleToggleAll(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded hover:bg-zinc-800 transition-colors text-zinc-300 hover:text-white uppercase tracking-wider"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 relative bg-[#111114]">
            {(treeData.length === 0 && (loading || (offset === 0 && hasMore))) ? (
              <div className="p-2 space-y-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border-b border-zinc-800/20">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-xl bg-zinc-800/50 animate-pulse" />
                      <div className="space-y-2">
                        <div className="w-48 h-3.5 bg-zinc-800/50 rounded-md animate-pulse" />
                        <div className="w-32 h-2.5 bg-zinc-800/30 rounded-md animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : treeData.length > 0 ? (
              <Virtuoso
                style={{ height: '100%' }}
                data={treeData}
                endReached={loadMore}
                itemContent={(index, r) => (
                  <SettingsRow
                    key={r.resource_id}
                    r={r}
                    isGroupView={true}
                    toggleRow={toggleRow}
                    handleToggle={handleLocalToggle}
                    setDetailResource={setDetailResource}
                  />
                )}
              />
            ) : (
              <EmptyState icon={Database} message="No resources found matching filters." height="h-full" />
            )}
          </div>
        </div>

        {/* Right Window: Selection Summary & Actions */}
        <div className="bg-[#111114] border border-[#1f1f24] rounded-xl p-6 flex flex-col justify-between shadow-lg h-[calc(100vh-180px)] min-h-[350px] w-[380px] shrink-0">
          
          <div className="flex-1 flex flex-col min-h-0 mb-6">
            <h3 className="text-[13px] font-bold text-white mb-4 flex items-center gap-2 shrink-0">
              <CheckSquare className="h-4 w-4 text-indigo-400" />
              Visibility Scope
            </h3>
            
            <div className="space-y-3 shrink-0 mb-6">
              <div className="bg-black/40 border border-zinc-800/80 rounded-lg p-4 text-center">
                <div className="text-[28px] font-light text-indigo-400 mb-1 leading-none">{visibleResources.length}</div>
                <div className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">Resources Included</div>
              </div>
            </div>

            {/* Live Breakdowns */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-6 scrollbar-thin scrollbar-thumb-zinc-700">
              {/* Service Breakdown */}
              {serviceCounts.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                     <Server className="h-3.5 w-3.5 text-purple-400" /> Services
                  </h3>
                  <div className="space-y-2">
                    {serviceCounts.map(sc => (
                      <div key={sc.type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ResourceIcon type={sc.type} className="h-3.5 w-3.5 opacity-80" />
                          <span className="text-[11px] font-semibold text-zinc-300">{sc.type}</span>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-400">{sc.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Region Breakdown */}
              {regionCounts.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                     <MapPin className="h-3.5 w-3.5 text-blue-400" /> Regions
                  </h3>
                  <div className="space-y-1.5">
                    {regionCounts.map(rc => (
                      <div key={rc.region} className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-zinc-400">{rc.region}</span>
                        <span className="text-[11px] font-bold text-zinc-300">{rc.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
