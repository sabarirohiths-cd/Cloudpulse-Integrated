import React from 'react';
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatType } from '../../utils/ui-utils';

export function ActivityHeatmap({ account, crossFilterType, provider = 'aws' }) {
  const [data, setData] = React.useState([]);
  const [trendData, setTrendData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [currentMonth, setCurrentMonth] = React.useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDay, setSelectedDay] = React.useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return { date: `${yyyy}-${mm}-${dd}`, count: 0, created: 0, deleted: 0, updated: 0 };
  });
  const [activeTab, setActiveTab] = React.useState(null);

  React.useEffect(() => {
    let mounted = true;
    if (!account) return;
    setLoading(true);
    import('../../api/inventory').then(api => {
      Promise.all([
        api.getHeatmapActivity(account, crossFilterType),
        api.getTrend(provider, null, null, account, crossFilterType)
      ]).then(([heatmapRes, trendRes]) => {
        if (mounted) {
          setData(heatmapRes);
          setTrendData(trendRes.data?.trend || []);
          setLoading(false);
        }
      }).catch(() => {
        if (mounted) setLoading(false);
      });
    });
    return () => { mounted = false; };
  }, [account, crossFilterType, provider]);

  // Reset calendar and selected day back to "today" when account changes
  React.useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    
    setSelectedDay({ date: `${yyyy}-${mm}-${dd}`, count: 0, created: 0, deleted: 0, updated: 0 });
    
    const d = new Date();
    d.setDate(1);
    setCurrentMonth(d);
  }, [account]);

  const activityMap = {};
  data.forEach(d => { activityMap[d.date] = d; });
  
  const trendMap = {};
  const breakdownMap = {};
  const sortedTrend = [...trendData].sort((a,b) => new Date(a.raw_date) - new Date(b.raw_date));
  
  sortedTrend.forEach(t => {
    if (t.raw_date) {
      const d = t.raw_date.split('T')[0];
      // Keep the latest snapshot of the day if there are multiple
      trendMap[d] = t.total;
      breakdownMap[d] = t.category_breakdown || {};
    }
  });

  // Forward fill the gaps
  if (sortedTrend.length > 0) {
    let lastKnownTotal = '-';
    let lastKnownBreakdown = {};
    const minDateStr = sortedTrend[0].raw_date.split('T')[0];
    const maxDate = new Date(); // Fill up to today
    
    let curr = new Date(minDateStr);
    while (curr <= maxDate) {
      const yyyy = curr.getFullYear();
      const mm = String(curr.getMonth() + 1).padStart(2, '0');
      const dd = String(curr.getDate()).padStart(2, '0');
      const dStr = `${yyyy}-${mm}-${dd}`;
      
      if (trendMap[dStr] !== undefined) {
        lastKnownTotal = trendMap[dStr];
        lastKnownBreakdown = breakdownMap[dStr];
      } else {
        trendMap[dStr] = lastKnownTotal;
        breakdownMap[dStr] = lastKnownBreakdown;
      }
      curr.setDate(curr.getDate() + 1);
    }
  }

  // Update selectedDay with data once loaded, if the selected day's data exists
  React.useEffect(() => {
    if (selectedDay && activityMap[selectedDay.date]) {
      setSelectedDay(prev => ({ ...prev, ...activityMap[prev.date] }));
    }
    
    // Manage active tab state dynamically based on available data
    if (selectedDay && breakdownMap[selectedDay.date]) {
       const available = ['created', 'deleted', 'updated'].filter(a => 
         breakdownMap[selectedDay.date][a] && Object.keys(breakdownMap[selectedDay.date][a]).length > 0
       );
       if (available.length > 0 && !available.includes(activeTab)) {
         setActiveTab(available[0]);
       } else if (available.length === 0) {
         setActiveTab(null);
       }
    } else {
       setActiveTab(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, selectedDay?.date]);

  const prevMonth = () => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() - 1);
    setCurrentMonth(d);
  };
  
  const nextMonth = () => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() + 1);
    setCurrentMonth(d);
  };

  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      days.push(`${yyyy}-${mm}-${dd}`);
    }
    return days;
  };

  const calendarDays = generateCalendar();

  const getColor = (count) => {
    if (count === 0) return '#ebedf0';
    if (count <= 5) return '#9be9a8';
    if (count <= 20) return '#40c463';
    return '#216e39';
  };

  // Remove the full-component loading replacement
  // if (loading) return <div className="...">Loading heatmap...</div>;

  return (
    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5 overflow-hidden mt-4">
      <h3 className="text-sm font-semibold mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-green-400" /> Infrastructure Volatility
        </div>
        <div className="flex items-center gap-3 text-xs font-medium text-zinc-300">
          <button onClick={prevMonth} className="hover:text-white p-1 bg-zinc-800 rounded border border-zinc-700/50"><ChevronLeft className="h-3 w-3" /></button>
          <span className="w-[105px] text-center whitespace-nowrap">{currentMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })}</span>
          <button onClick={nextMonth} className="hover:text-white p-1 bg-zinc-800 rounded border border-zinc-700/50"><ChevronRight className="h-3 w-3" /></button>
        </div>
      </h3>

      <div className={`flex flex-row gap-10 justify-center items-stretch py-2 w-full transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        {/* Section 1: Calendar */}
        <div className="flex flex-col gap-1 shrink-0 w-max self-center">
          <div className="grid grid-cols-7 gap-2 text-[10px] text-zinc-500 mb-1 text-center font-semibold">
             <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
          </div>
          <div className="grid grid-cols-7 gap-2 min-h-[184px] content-start">
            {calendarDays.map((dateStr, i) => {
              if (!dateStr) return <div key={`empty-${i}`} className="w-[24px] h-[24px] rounded-sm opacity-0" />;
              
              const dayData = activityMap[dateStr] || { count: 0, created: 0, deleted: 0, updated: 0 };
              const isSelected = selectedDay?.date === dateStr;
              const dateObj = new Date(dateStr);
              
              return (
                <div 
                  key={dateStr}
                  onClick={() => setSelectedDay({ date: dateStr, ...dayData })}
                  className={`w-[24px] h-[24px] rounded-sm cursor-pointer border ${isSelected ? 'border-2 border-blue-500 text-black font-bold shadow-md shadow-blue-500/20' : 'border border-transparent text-black/50 font-medium'} hover:border-zinc-400 flex items-center justify-center text-[10px] transition-all duration-150`}
                  style={{ backgroundColor: getColor(dayData.count) }}
                  title={`${dateStr}: ${dayData.count} changes`}
                >
                  {dateObj.getDate()}
                </div>
              );
            })}
          </div>
        </div>

        {selectedDay ? (
          <>
            {/* Section 2: Vertical Stats */}
            <div className="border-l border-zinc-800/50 px-8 flex flex-col justify-center w-[160px] shrink-0 animate-in fade-in slide-in-from-left-4 duration-300">
              <h4 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
                {new Date(selectedDay.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
              </h4>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Total Active</span>
                  <span className="text-xl font-bold text-white">{trendMap[selectedDay.date] !== undefined ? trendMap[selectedDay.date] : '-'}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Created</span>
                  <span className="text-lg font-bold text-emerald-400">{selectedDay.created || 0}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Deleted</span>
                  <span className="text-lg font-bold text-rose-400">{selectedDay.deleted || 0}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Updated</span>
                  <span className="text-lg font-bold text-amber-400">{selectedDay.updated || 0}</span>
                </div>
              </div>
            </div>

            {/* Section 3: Tabbed Breakdown */}
            <div className="border-l border-zinc-800/50 pl-8 flex flex-col justify-start w-[280px] shrink-0">
              {breakdownMap[selectedDay.date] && Object.keys(breakdownMap[selectedDay.date]).length > 0 && activeTab ? (
                <div className="animate-in fade-in zoom-in-95 duration-300 h-full flex flex-col">
                  <div className="flex bg-zinc-950/50 p-1 rounded-lg w-full mb-3 border border-zinc-800/50 grid grid-cols-3 gap-1">
                    {['created', 'deleted', 'updated'].map(action => {
                      const hasData = breakdownMap[selectedDay.date][action] && Object.keys(breakdownMap[selectedDay.date][action]).length > 0;
                      const isActive = activeTab === action;
                      return (
                        <button 
                          key={action}
                          disabled={!hasData}
                          onClick={() => setActiveTab(action)}
                          className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md transition-all duration-200 flex-1 text-center ${!hasData ? 'opacity-20 cursor-not-allowed text-zinc-500' : isActive ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                          {action}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="max-h-[220px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-700">
                    <div className="grid grid-cols-1 gap-y-1.5">
                      {Object.entries(breakdownMap[selectedDay.date][activeTab] || {}).sort((a,b) => b[1] - a[1]).map(([cat, count]) => (
                        <div key={cat} className="flex items-center justify-between bg-zinc-800/30 px-3 py-1.5 rounded-md text-xs transition-all hover:bg-zinc-800/60 border border-transparent hover:border-zinc-700/50">
                          <span className="text-zinc-400 truncate pr-2" title={cat}>{formatType(cat, provider)}</span>
                          <span className={`font-medium px-2 py-0.5 rounded text-[11px] bg-zinc-900/80 border ${activeTab === 'created' ? 'text-emerald-400 border-emerald-900/30' : activeTab === 'deleted' ? 'text-rose-400 border-rose-900/30' : 'text-amber-400 border-amber-900/30'}`}>{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-zinc-600 h-full flex flex-col items-center justify-center italic gap-2 opacity-60">
                  <Activity className="h-6 w-6 opacity-20" />
                  <span className="text-center">No changes recorded<br/>on this day.</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="border-l border-zinc-800/50 pl-8 flex flex-col justify-center items-center w-[440px] text-xs text-zinc-500 opacity-50">
            <Activity className="h-6 w-6 mb-2" />
            <span className="text-center">Select a day on the calendar<br/>to view change details.</span>
          </div>
        )}
      </div>
    </div>
  );
}
