import React, { useState } from 'react';
import { getIcon } from '../../../utils/iconMap';
import { Search, Server, ChevronRight, ChevronDown, X, Layers } from 'lucide-react';

const TreeNode = ({ label, id, type, icon, children, onNodeClick, isSelected = false, defaultExpanded = true, rightElement }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const hasChildren = children && children.length > 0;

  const handleClick = (e) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
    if (onNodeClick) {
      onNodeClick(id);
    }
  };

  return (
    <div className="select-none mb-0.5">
      <div
        onClick={handleClick}
        className={`flex items-center gap-1.5 py-1 px-1.5 rounded-md cursor-pointer transition-all duration-200 ${
            isSelected 
              ? 'bg-sky-500/20 ring-1 ring-sky-500/50 text-sky-100 shadow-[0_0_12px_rgba(14,165,233,0.15)]' 
              : 'hover:bg-white/5 text-zinc-400 hover:text-zinc-200'
        }`}
        title={`Click to focus on ${label || id}`}
      >
        <div className="w-3 h-3 flex items-center justify-center flex-shrink-0 text-zinc-500 transition-transform">
          {hasChildren ? (
            isExpanded ? <ChevronDown size={12} className="hover:text-white" /> : <ChevronRight size={12} className="hover:text-white" />
          ) : (
            <div className="w-1 h-1 rounded-full bg-zinc-700" />
          )}
        </div>

        <div className="flex items-center justify-center flex-shrink-0 w-4 h-4 bg-black/20 rounded p-0.5 border border-white/5 shadow-inner">
          {icon || getIcon(type, 12, '')}
        </div>

        <div className="flex flex-col flex-1 overflow-hidden justify-center gap-0">
          <span className="text-[11px] font-medium truncate leading-tight text-zinc-200">
            {label}
          </span>
          {type && (
            <span className="text-[8px] font-bold uppercase tracking-widest text-sky-500/80 mt-[1px]">
                {type}
            </span>
          )}
        </div>
        
        {rightElement && (
            <div className="flex-shrink-0 ml-2">
                {rightElement}
            </div>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="ml-3 pl-2 border-l border-white/5 mt-0.5 flex flex-col gap-0.5">
          {children.map((child, index) => (
            <React.Fragment key={`${child.id}-${index}`}>
              {child.node}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default function ComputeResourcesSidebar({ data, onNodeSelect, selectedNodeId, flowData, onNodeFocus, onClearTrace, onCloseSidebar }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRoots, setExpandedRoots] = useState({});
  
  if (!data || !Array.isArray(data)) {
    return (
      <div className="p-4 w-full h-full text-zinc-300 flex flex-col bg-[#0f1115]">
        <h3 className="font-semibold text-white mb-4 uppercase tracking-widest text-[11px] border-b border-white/10 pb-3 flex items-center gap-2">
          <Layers size={14} className="text-sky-400" /> Global Resources
        </h3>
        <div className="text-sm italic text-zinc-500 bg-black/40 p-4 rounded-lg border border-white/5 shadow-inner text-center">
          No resources available. Run a scan to populate the list.
        </div>
      </div>
    );
  }

  const filteredResources = data.filter(res => {
    const term = searchTerm.toLowerCase();
    return (
      (res.name && res.name.toLowerCase().includes(term)) ||
      (res.id && res.id.toLowerCase().includes(term))
    );
  });

  // Grouped Trace List
  const buildTraceTreeElements = (selectedId) => {
    if (!flowData || !flowData.nodes || flowData.nodes.length === 0 || flowData.compute_id !== selectedId) return null;

    // Filter out the selected instance itself
    const nodes = flowData.nodes.filter(n => n.id !== selectedId);
    
    // Group by Resource Type
    const groupedByType = nodes.reduce((acc, node) => {
        const type = node.type || 'Unknown';
        if (!acc[type]) acc[type] = [];
        acc[type].push(node);
        return acc;
    }, {});

    // Sort types alphabetically
    const sortedTypes = Object.keys(groupedByType).sort();
    
    return (
        <div className="mt-1 mb-2 flex flex-col gap-0.5 pb-1 ml-3 border-l-2 border-sky-900/30 pl-2 relative">
            {/* Subtle glow behind the tree line */}
            <div className="absolute left-[-2px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-sky-500/20 to-transparent blur-[1px]"></div>
            
            {sortedTypes.map(type => {
                const groupNodes = groupedByType[type].sort((a, b) => (a.label || a.id).localeCompare(b.label || b.id));
                const groupLabel = `${type.replace(/_/g, ' ')} (${groupNodes.length})`;
                return (
                    <TreeNode 
                        key={type}
                        label={groupLabel}
                        id={`group-${type}`}
                        type={type}
                        defaultExpanded={true}
                        children={groupNodes.map(node => ({
                            id: node.id,
                            node: (
                                <TreeNode
                                    key={node.id}
                                    label={node.label || node.id}
                                    id={node.id}
                                    type={node.type}
                                    defaultExpanded={false}
                                    onNodeClick={() => onNodeFocus && onNodeFocus(node.id)}
                                />
                            )
                        }))}
                    />
                );
            })}
        </div>
    );
  };

  return (
    <div className="p-3 w-full h-full flex flex-col bg-gradient-to-b from-[#0f1115] to-[#13161c]">
      <div className="mb-3 shrink-0">
        <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
          <h3 className="font-semibold text-white uppercase tracking-widest text-[10px] flex-shrink-0 flex items-center gap-1.5">
            <Layers size={12} className="text-sky-400" /> Global Resources
          </h3>
          {onCloseSidebar && (
            <button 
              onClick={onCloseSidebar}
              className="w-4 h-4 flex items-center justify-center rounded bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-all shadow-sm ml-2"
              title="Close Sidebar"
            >
              <X size={10} />
            </button>
          )}
        </div>
        <div className="relative group">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-sky-400 transition-colors" />
          <input
            type="text"
            placeholder="Search by ID or Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/20 border border-white/5 rounded-md py-1 pl-7 pr-2 text-[11px] text-white focus:outline-none focus:bg-black/40 focus:border-sky-500/50 transition-all shadow-inner placeholder:text-zinc-600"
          />
        </div>
      </div>
      
      <div className="overflow-y-auto flex-1 pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 hover:[&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full transition-colors">
        <div className="flex flex-col gap-2">
          {filteredResources.length === 0 ? (
            <div className="text-[13px] text-zinc-500 p-4 text-center bg-white/5 rounded-lg border border-white/5">
              No resources match your search.
            </div>
          ) : (
            (() => {
              const renderInstance = (res) => {
                const isSelected = selectedNodeId === res.id;
                const isRunning = res.state === 'running';
                const hasTracesData = flowData && flowData.compute_id === res.id;
                const childCount = hasTracesData ? flowData.nodes.filter(n => n.id !== res.id).length : -1;
                
                return {
                  id: res.id,
                  node: (
                    <div key={res.id} className="flex flex-col mb-1">
                    <div
                        onClick={() => {
                            if (selectedNodeId !== res.id) {
                                onNodeSelect(res);
                            }
                        }}
                        className={`flex items-center justify-between py-1.5 px-2 rounded-md cursor-pointer transition-all duration-300 ${
                        isSelected
                            ? 'bg-gradient-to-r from-sky-500/10 to-transparent border border-sky-500/30 text-white shadow-[0_0_15px_rgba(14,165,233,0.05)] ring-1 ring-sky-500/20'
                            : 'bg-black/20 border border-white/5 text-zinc-400 hover:bg-white/5 hover:border-white/10 hover:shadow-sm'
                        }`}
                    >
                        <div className="flex items-center gap-2 overflow-hidden">
                        <button 
                            className={`flex items-center justify-center w-5 h-5 rounded-full transition-all ${
                                isSelected && expandedRoots[res.id] ? 'bg-white/10 text-white' : 'text-zinc-500 hover:bg-white/5 hover:text-white'
                            }`}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (selectedNodeId !== res.id) {
                                    onNodeSelect(res);
                                    setExpandedRoots(prev => ({ ...prev, [res.id]: true }));
                                } else {
                                    setExpandedRoots(prev => ({ ...prev, [res.id]: !prev[res.id] }));
                                }
                            }}
                        >
                            {childCount !== 0 && (
                                expandedRoots[res.id] ? <ChevronDown size={12} /> : <ChevronRight size={12} />
                            )}
                        </button>
                  <div className="flex items-center justify-center w-6 h-6 rounded bg-black/40 border border-white/5 shadow-inner p-0.5 shrink-0">
                    {getIcon(res.type || 'EC2 Instance', 14, '')}
                  </div>
                  <div className="flex flex-col overflow-hidden justify-center py-0.5">
                    <span className={`text-[11px] font-semibold truncate ${isSelected ? 'text-sky-100' : 'text-zinc-200'}`}>
                      {res.name || res.id}
                    </span>
                    {res.name && (
                      <span className="text-[9px] text-zinc-500 font-mono truncate mt-[1px]">
                        {res.id}
                      </span>
                    )}
                    {res.managed_by && (
                      <span className="text-[8px] font-bold tracking-widest text-fuchsia-400/80 mt-0.5 truncate uppercase">
                        {res.managed_by}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-center pl-2 shrink-0 gap-3 border-l border-white/5 h-6">
                  <div className="relative flex items-center justify-center">
                    <div 
                      className={`h-2 w-2 rounded-full z-10 ${isRunning ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'}`}
                      title={`State: ${res.state}`}
                    />
                    {isRunning && (
                      <div className="absolute w-2 h-2 rounded-full bg-emerald-500/40 animate-ping" />
                    )}
                  </div>
                </div>
              </div>
              
              {isSelected && expandedRoots[res.id] && buildTraceTreeElements(res.id)}
            </div>
                  )
                };
              };

              const renderRecursive = (items) => {
                const clusters = items.filter(i => i.type === 'EKSCluster' || i.type === 'EKSNodeGroup');
                const flatInstances = items.filter(i => i.type !== 'EKSCluster' && i.type !== 'EKSNodeGroup');
                
                const groupedInstances = flatInstances.reduce((acc, res) => {
                  const groupName = res.managed_by || 'Standalone Resources';
                  if (!acc[groupName]) acc[groupName] = [];
                  acc[groupName].push(res);
                  return acc;
                }, {});
                
                const clusterNodes = clusters.map(c => {
                    let folderType = 'Unknown';
                    if (c.type === 'EKSCluster') folderType = 'ekscluster';
                    else if (c.type === 'EKSNodeGroup') folderType = 'eksnodegroup';
                    
                    return (
                      <TreeNode 
                        key={c.id}
                        label={`${c.name} (${c.children ? c.children.length : 0})`}
                        id={`top-group-${c.id}`}
                        type={folderType}
                        defaultExpanded={false}
                        children={c.children ? renderRecursive(c.children) : []}
                      />
                    );
                });
                
                const legacyNodes = Object.keys(groupedInstances).sort((a,b) => {
                    if (a === 'Standalone Resources') return -1;
                    if (b === 'Standalone Resources') return 1;
                    return a.localeCompare(b);
                }).map(groupName => {
                    const childNodes = groupedInstances[groupName].map(renderInstance);
                    let folderType = 'Unknown';
                    const glower = groupName.toLowerCase();
                    if (glower.startsWith('asg') || glower.includes('autoscaling')) folderType = 'autoscalinggroup';
                    else if (glower.includes('eks')) folderType = 'ekscluster';
                    else if (glower.includes('ecs')) folderType = 'ecscluster';
                    else if (glower.includes('standalone')) folderType = 'instance';
                    
                    return (
                      <TreeNode 
                        key={groupName}
                        label={`${groupName} (${groupedInstances[groupName].length})`}
                        id={`top-group-${groupName}`}
                        type={folderType}
                        defaultExpanded={false}
                        children={childNodes}
                      />
                    );
                });
                
                return [
                  ...clusterNodes.map((cn, i) => ({ id: `cn-${cn.key}`, node: cn })),
                  ...legacyNodes.map((ln, i) => ({ id: `ln-${ln.key}`, node: ln }))
                ];
              };

              return renderRecursive(filteredResources).map(r => r.node);
            })()
          )}
        </div>
      </div>
    </div>
  );
}

