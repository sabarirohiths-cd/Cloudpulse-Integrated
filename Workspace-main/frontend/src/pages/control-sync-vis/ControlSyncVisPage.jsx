import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Database, Search, Shield, Eye, Settings, RefreshCw, Save } from 'lucide-react';
import { FilterBar } from '../../components/ui/FilterBar';
import { toast } from 'sonner';
import { listResources, toggleVisibility, getFilterOptions } from '../../api/control';
import { listConfigs } from '../../api/config';
import { useControlSync } from '../../services/syncManager';
import { buildResourceTree, buildResourceMap } from '../../services/resource-tree';
import { NotificationBell } from '../../components/layout/NotificationBell';
import { ControlResourceDetailModal } from '../control/sections/ControlResourceDetailModal';

// Steps
import { ScanStep } from './sections/ScanStep';
import { VisibilityStep } from './sections/VisibilityStep';
import { PreviewStep } from './sections/PreviewStep';

export default function ControlSyncVisPage() {
  const [activeStep, setActiveStep] = useState(() => localStorage.getItem('pulse_control_active_step') || 'scan'); // 'scan' | 'visibility' | 'preview'
  
  useEffect(() => {
    localStorage.setItem('pulse_control_active_step', activeStep);
  }, [activeStep]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailResource, setDetailResource] = useState(null);
  
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 50;

  // Global filters
  const [topFilters, setTopFilters] = useState({
    provider: localStorage.getItem('pulse_admin_provider') || 'AWS',
    account: localStorage.getItem('pulse_admin_account') || ''
  });

  const [filter, setFilter] = useState({
    group: 'All',
    region: 'All Regions'
  });

  const { syncing, startControlSync } = useControlSync(topFilters?.account);
  const [syncRegions, setSyncRegions] = useState(['all']);
  const [verifiedConfigs, setVerifiedConfigs] = useState([]);
  const [expandedRowIds, setExpandedRowIds] = useState(new Set());
  
  const [pendingChanges, setPendingChanges] = useState(() => {
    const acc = localStorage.getItem('pulse_admin_account');
    if (acc) {
      try {
        const stored = localStorage.getItem(`pulse_control_pending_${acc}`);
        return stored ? JSON.parse(stored) : {};
      } catch(e) {}
    }
    return {};
  });
  const pendingChangesRef = useRef(pendingChanges);
  
  // Load pending changes from localStorage when account changes
  useEffect(() => {
    if (topFilters.account) {
      try {
        const stored = localStorage.getItem(`pulse_control_pending_${topFilters.account}`);
        setPendingChanges(stored ? JSON.parse(stored) : {});
      } catch(e) { setPendingChanges({}); }
    }
  }, [topFilters.account]);

  // Save pending changes to localStorage and update ref whenever they change
  useEffect(() => {
    pendingChangesRef.current = pendingChanges;
    if (topFilters.account) {
      localStorage.setItem(`pulse_control_pending_${topFilters.account}`, JSON.stringify(pendingChanges));
    }
  }, [pendingChanges, topFilters.account]);
  
  const [isSaving, setIsSaving] = useState(false);

  const availableProviders = ['AWS', 'AZURE', 'GCP'];
  const filteredConfigs = verifiedConfigs.filter(c => (c.provider || '').toUpperCase() === topFilters.provider);
  const availableAccounts = filteredConfigs.map(c => c.account_name);

  useEffect(() => {
    if (topFilters.provider) localStorage.setItem('pulse_admin_provider', topFilters.provider);
    if (topFilters.account) localStorage.setItem('pulse_admin_account', topFilters.account);
  }, [topFilters.provider, topFilters.account]);

  useEffect(() => {
    const handleProviderChange = () => {
      const p = localStorage.getItem('pulse_admin_provider') || 'AWS';
      handleTopFilterChange('provider', p);
    };
    window.addEventListener('app:provider-change', handleProviderChange);
    return () => window.removeEventListener('app:provider-change', handleProviderChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifiedConfigs, topFilters.account]);

  useEffect(() => {
    loadConfigs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadConfigs = async () => {
    try {
      const res = await listConfigs();
      const configs = res.data.configs || [];
      const vConfigs = configs.filter(c => (c.active_modules ?? 'inventory,control').includes('control'));
      setVerifiedConfigs(vConfigs);

      if (vConfigs.length > 0) {
        const savedAccount = localStorage.getItem('pulse_admin_account');
        const savedMatch = vConfigs.find(c => c.account_name === savedAccount);

        let currentProvider = topFilters.provider;
        let currentAccount = topFilters.account;

        if (savedMatch) {
          currentProvider = savedMatch.provider ? savedMatch.provider.toUpperCase() : 'AWS';
          currentAccount = savedMatch.account_name;
          setTopFilters(prev => ({ ...prev, provider: currentProvider, account: currentAccount }));
        }

        const providerConfigs = vConfigs.filter(c => (c.provider || '').toUpperCase() === currentProvider);

        if (providerConfigs.length > 0) {
          const hasCurrentAccount = providerConfigs.find(c => c.account_name === currentAccount);
          if (!hasCurrentAccount) {
            setTopFilters(prev => ({ ...prev, account: providerConfigs[0].account_name }));
          }
        } else {
          setTopFilters(prev => ({ ...prev, account: '' }));
        }
      } else {
        setTopFilters(prev => ({ ...prev, account: '' }));
      }
    } catch (err) {
      console.error("Failed to load configs", err);
    }
  };



  const handleTopFilterChange = (key, value) => {
    if (key === 'provider') {
      if (topFilters.provider === value) return;
      
      const filtered = verifiedConfigs.filter(c => (c.provider || '').toUpperCase() === value);
      let newAccount = '';

      const stillValid = filtered.find(c => c.account_name === topFilters.account);
      if (!stillValid && filtered.length > 0) {
        newAccount = filtered[0].account_name;
      } else if (stillValid) {
        newAccount = topFilters.account;
      }

      setTopFilters(prev => ({ ...prev, provider: value, account: newAccount }));
      localStorage.setItem('pulse_admin_provider', value);
      localStorage.setItem('pulse_control_provider', value);
      window.dispatchEvent(new Event('app:provider-change'));
    } else {
      setTopFilters(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleSync = () => {
    const regionParam = syncRegions.includes('all') ? 'all' : syncRegions.join(',');
    startControlSync(topFilters.account, regionParam);
  };

  const toggleRow = (id) => {
    setExpandedRowIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const loadResources = async (reset = false) => {
    if (!topFilters.account) return;
    if (!reset && (loading || !hasMore)) return;
    
    setLoading(true);
    const currentOffset = reset ? 0 : offset;

    try {
      const data = await listResources(topFilters, LIMIT, currentOffset, true);
      const currentPending = pendingChangesRef.current;
      const mapped = (data || []).map(s => {
        const r = {
          ...s,
          name: s.resource_name || s.resource_id,
          cloud_provider: s.cloud_provider || 'aws',
          instance_spec: s.instance_spec || 'unknown',
          status: s.status || 'UNKNOWN',
          schedule: {
            is_automation_enabled: s.is_automation_enabled,
            start_time: s.start_time,
            stop_time: s.stop_time,
            timezone: s.timezone,
            pattern: s.schedule_pattern,
            owner: s.owner_email
          }
        };
        // Preserve any unsaved toggles the user made before this refresh
        if (currentPending[r.resource_id] !== undefined) {
          r.is_visible = currentPending[r.resource_id];
        }
        return r;
      });

      if (mapped.length < LIMIT) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      setResources(prev => {
        if (reset) return mapped;
        const existingIds = new Set(prev.map(r => r.resource_id));
        return [...prev, ...mapped.filter(r => !existingIds.has(r.resource_id))];
      });
      setOffset(currentOffset + mapped.length);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load resources for settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!topFilters.account) return;
    setHasMore(true);
    setOffset(0);
    loadResources(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topFilters.account, topFilters.provider]);

  useEffect(() => {
    const handleGlobalRefresh = () => {
      setHasMore(true);
      setOffset(0);
      loadResources(true);
      setActiveStep(prev => prev === 'scan' ? 'visibility' : prev);
    };
    window.addEventListener('app:refresh-data', handleGlobalRefresh);
    return () => window.removeEventListener('app:refresh-data', handleGlobalRefresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topFilters]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadResources(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, hasMore, offset, topFilters]);

  const getResourceAndChildrenIds = (resourceId, allResources) => {
    const { resourceMap } = buildResourceMap(allResources);
    const getIds = (node) => {
      let ids = [node.resource_id];
      for (const child of node.children) {
        ids = ids.concat(getIds(child));
      }
      return ids;
    };
    const targetNode = resourceMap.get(resourceId);
    return targetNode ? getIds(targetNode) : [resourceId];
  };

  // Local Toggle
  const handleLocalToggle = (resource) => {
    const newState = !resource.is_visible;
    const targetIds = getResourceAndChildrenIds(resource.resource_id, resources);
    
    setResources(prev => prev.map(r => 
      targetIds.includes(r.resource_id) ? { ...r, is_visible: newState } : r
    ));

    setPendingChanges(prev => {
      const next = { ...prev };
      targetIds.forEach(id => next[id] = newState);
      return next;
    });
  };

  const handleLocalToggleAll = (newVisibility) => {
    const allFilteredIds = resources
      .filter(r => filter.group === 'All' || getGroup(r.service_type) === filter.group)
      .filter(r =>
        (r.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.resource_id || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map(r => r.resource_id);

    if (allFilteredIds.length === 0) return;

    setResources(prev => prev.map(r => 
      allFilteredIds.includes(r.resource_id) ? { ...r, is_visible: newVisibility } : r
    ));

    setPendingChanges(prev => {
      const next = { ...prev };
      allFilteredIds.forEach(id => next[id] = newVisibility);
      return next;
    });
  };

  const getGroup = (type) => {
    const t = (type || '').toUpperCase();
    if (['RDS', 'AURORA'].includes(t)) return 'RDS';
    if (['EC2'].includes(t)) return 'EC2';
    return t;
  };

  const uniqueGroups = Array.from(new Set(resources.map(r => getGroup(r.service_type)))).sort();
  const groupOptions = [
    { label: 'All Groups', value: 'All' },
    ...uniqueGroups.map(g => ({ label: g, value: g }))
  ];

  const matchesFilter = (r) => {
    const groupMatch = filter.group === 'All' || getGroup(r.service_type) === filter.group;
    const regionMatch = filter.region === 'All Regions' || r.region === filter.region;
    const searchMatch = (r.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.resource_id || '').toLowerCase().includes(searchQuery.toLowerCase());
    return groupMatch && regionMatch && searchMatch;
  };

  const directlyMatchedIds = new Set(resources.filter(matchesFilter).map(r => r.resource_id));
  const familyMatchedIds = new Set(directlyMatchedIds);

  resources.forEach(r => {
    if (directlyMatchedIds.has(r.resource_id) && r.parent_resource_id) {
      familyMatchedIds.add(r.parent_resource_id);
    }
    if (r.parent_resource_id && directlyMatchedIds.has(r.parent_resource_id)) {
      familyMatchedIds.add(r.resource_id);
    }
  });

  const filteredResources = resources.filter(r => familyMatchedIds.has(r.resource_id));

  const displayCount = filteredResources.filter(r => {
    const isNonActionableParent = ['ACTIVE', 'UNKNOWN'].includes(r.status) && resources.some(child => child.parent_resource_id === r.resource_id);
    return !isNonActionableParent;
  }).length;

  const totalActionable = useMemo(() => {
    return resources.filter(r => {
      const isNonActionableParent = ['ACTIVE', 'UNKNOWN'].includes(r.status) && resources.some(child => child.parent_resource_id === r.resource_id);
      return !isNonActionableParent;
    }).length;
  }, [resources]);

  const treeData = useMemo(() => buildResourceTree(filteredResources, true, expandedRowIds), [filteredResources, expandedRowIds]);

  const visibleResources = useMemo(() => {
    return resources.filter(r => {
      if (!r.is_visible) return false;
      const isNonActionableParent = ['ACTIVE', 'UNKNOWN'].includes(r.status) && resources.some(child => child.parent_resource_id === r.resource_id);
      return !isNonActionableParent;
    });
  }, [resources]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const toShow = Object.keys(pendingChanges).filter(k => pendingChanges[k] === true);
      const toHide = Object.keys(pendingChanges).filter(k => pendingChanges[k] === false);
      
      if (toShow.length > 0) await toggleVisibility(toShow, true);
      if (toHide.length > 0) await toggleVisibility(toHide, false);
      
      toast.success('Visibility changes saved successfully!');
      setPendingChanges({});
      setActiveStep('scan');
    } catch (e) {
      console.error(e);
      toast.error('Failed to save visibility changes');
    } finally {
      setIsSaving(false);
    }
  };

  const existingRegions = useMemo(() => {
    const regions = new Set(resources.map(r => r.region).filter(Boolean));
    return Array.from(regions);
  }, [resources]);

  const regionOptions = useMemo(() => {
    return [
      { label: 'All Regions', value: 'All Regions' },
      ...existingRegions.sort().map(r => ({ label: r, value: r }))
    ];
  }, [existingRegions]);

  const stepOptions = [
    { id: 'scan', label: 'Discovery Sync' },
    { id: 'visibility', label: 'Setup Visibility' },
    { id: 'preview', label: 'Preview & Save' }
  ];

  return (
    <>
      <div className="sticky -top-6 h-6 -mx-6 -mt-6 bg-[#0a0a0f]/80 backdrop-blur-md z-30 pointer-events-none" />
      <div className="relative flex flex-col min-h-[calc(100vh-80px)]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {topFilters.provider && (
              <img src={`/${topFilters.provider.toLowerCase()}-logo.svg`} alt="" className="h-10 w-10 object-contain shrink-0" />
            )}
            <div>
              <h1 className="text-xl font-semibold flex items-center gap-3 text-[#e4e4e7] tracking-tight">
                Control Settings Setup
              </h1>
              <p className="text-[11px] text-[#a1a1aa] mt-1">Configure which resources appear in your main dashboard</p>
            </div>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
            </div>
          </div>

        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mt-6">
          <FilterBar
            filters={[
              { label: "Provider:", value: topFilters.provider, onChange: v => handleTopFilterChange('provider', v), options: availableProviders.map(p => ({ label: p, value: p })), width: "max-w-[110px]" },
              { label: "Account:", value: topFilters.account, onChange: v => handleTopFilterChange('account', v), options: availableAccounts.map(a => ({ label: a, value: a })), width: "max-w-[150px]" }
            ]}
          />

          <div className="flex items-center gap-3">
            {stepOptions.map((step, idx) => {
              const isActive = activeStep === step.id;
              return (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => setActiveStep(step.id)}
                    className={`relative text-[13px] font-bold tracking-wide transition-all duration-300 px-4 py-1.5 rounded-full ${
                      isActive 
                        ? 'text-white bg-blue-500/10 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {step.label}
                  </button>
                  {idx < stepOptions.length - 1 && (
                    <span className="text-zinc-700 font-medium">→</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="pt-4 flex-1 pb-10">
          {['AZURE', 'GCP'].includes(topFilters.provider) ? (
            <div className="animate-in fade-in duration-300 w-full h-[calc(100vh-250px)] flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 mb-4 rounded-2xl bg-[#15181e] flex items-center justify-center border border-zinc-800/80 shadow-lg">
                <img src={`/${topFilters.provider.toLowerCase()}-logo.svg`} alt={topFilters.provider} className="h-8 w-8 object-contain opacity-60 grayscale-[50%]" />
              </div>
              <h3 className="text-lg font-bold text-[#e4e4e7] tracking-tight mb-2">Coming Soon</h3>
              <p className="text-[13px] text-[#8b949e] max-w-sm leading-relaxed mx-auto">
                Automated resource discovery and control for {topFilters.provider === 'AZURE' ? 'Microsoft Azure' : 'Google Cloud'} is currently in development.
              </p>
            </div>
          ) : (
            <>
              {activeStep === 'scan' && (
                <ScanStep 
                  topFilters={topFilters} 
                  syncRegions={syncRegions} 
                  setSyncRegions={setSyncRegions} 
                  syncing={syncing} 
                  handleSync={handleSync} 
                  onNext={() => setActiveStep('visibility')}
                  existingRegions={existingRegions}
                  totalResources={totalActionable}
                  lastSyncDate={verifiedConfigs.find(c => c.account_name === topFilters.account)?.last_sync_date || 'Never'}
                />
              )}

              {activeStep === 'visibility' && (
                <VisibilityStep 
                  filter={filter}
                  setFilter={setFilter}
                  groupOptions={groupOptions}
                  regionOptions={regionOptions}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  displayCount={displayCount}
                  visibleResources={visibleResources}
                  handleToggleAll={handleLocalToggleAll}
                  treeData={treeData}
                  loading={loading}
                  offset={offset}
                  hasMore={hasMore}
                  loadMore={loadMore}
                  toggleRow={toggleRow}
                  handleLocalToggle={handleLocalToggle}
                  setDetailResource={setDetailResource}
                  onNext={() => setActiveStep('preview')}
                  onPrev={() => setActiveStep('scan')}
                />
              )}

              {activeStep === 'preview' && (
                <PreviewStep 
                  visibleResources={visibleResources}
                  hasChanges={Object.keys(pendingChanges).length > 0}
                  onPrev={() => setActiveStep('visibility')}
                  onSave={handleSave}
                  isSaving={isSaving}
                />
              )}
            </>
          )}
        </div>

      </div>
      
      {detailResource && (
        <ControlResourceDetailModal 
          resource={detailResource} 
          onClose={() => setDetailResource(null)} 
        />
      )}
    </>
  );
}
