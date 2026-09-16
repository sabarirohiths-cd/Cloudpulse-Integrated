import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { getIcon, getColorClasses } from '../../../utils/iconMap';

const TopologyNode = memo(({ data, targetPosition = Position.Top, sourcePosition = Position.Bottom }) => {
  const isRoot = data.isRoot;
  const isGroup = data.metadata?.isGroupNode;

  // Determine Dimensions
  let width = 200;
  let height = 72;
  
  if (isRoot) {
    width = 220;
    height = 96;
  } else if (isGroup) {
    width = 260;
    height = 88;
  }

  // The icon acts as the full-height left panel
  const iconSize = height;
  const iconPanelWidth = height;

  // Determine Health Colors
  const health = data.health_state?.toUpperCase() || 'UNKNOWN';
  let healthColor = '#10b981'; // Healthy green default
  let healthText = 'Healthy';
  if (health === 'CRITICAL') {
    healthColor = '#ef4444';
    healthText = 'Critical';
  } else if (health === 'DEGRADED') {
    healthColor = '#f59e0b';
    healthText = 'Degraded';
  } else if (health === 'UNKNOWN') {
    healthColor = '#94a3b8';
    healthText = 'Unknown';
  }

  // Determine Border & Glow
  let borderColor = healthColor;
  let boxShadow = 'none';
  if (isRoot) {
    // Selected node: strong border with glow
    boxShadow = `0 0 16px ${healthColor}33`; // 20% opacity hex
    borderColor = healthColor;
  } else if (health === 'CRITICAL') {
    boxShadow = `0 0 12px rgba(239, 68, 68, 0.15)`;
  } else if (health === 'DEGRADED') {
    boxShadow = `0 0 10px rgba(245, 158, 11, 0.1)`;
  }

  // Remove the static panel bg color logic since the AWS SVGs have built-in colored backgrounds
  // We will let the icon fill the entire left panel.

  // For group nodes, we might show a count instead of a raw label
  const displayLabel = isGroup 
    ? `${data.metadata.groupedNodes?.length || 0} resources`
    : (data.label || 'Unknown Resource');

  return (
    <div 
      className={`relative rounded-lg flex overflow-hidden transition-all duration-300 ${isGroup ? 'backdrop-blur-sm' : ''}`}
      style={{
        width,
        height,
        backgroundColor: isGroup ? 'rgba(15, 23, 42, 0.5)' : '#161a22',
        border: `1.5px ${isGroup ? 'dashed' : 'solid'} ${borderColor}`,
        boxShadow,
      }}
    >
      <Handle type="target" position={targetPosition} style={{ opacity: 0, pointerEvents: 'none' }} />

      {/* Left Icon Panel (Full Height AWS SVG) */}
      <div 
        className="flex items-center justify-center flex-shrink-0"
        style={{ width: `${iconPanelWidth}px`, height: '100%' }}
      >
        <div className="flex items-center justify-center drop-shadow-md">
          {/* We do NOT force text-white here since the AWS architecture icons are pre-colored SVGs with their own backgrounds */}
          {getIcon(data.type, iconSize, '')}
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex flex-col justify-center flex-1 min-w-0 px-3 py-2">
        {/* Resource Type */}
        <div className="text-white text-[14px] font-semibold truncate leading-tight">
          {isGroup ? `${data.type} Group` : data.type}
        </div>
        
        {/* Resource Name / Count */}
        <div className="text-zinc-400 text-[12px] font-normal truncate mt-0.5" title={displayLabel}>
          {displayLabel}
        </div>
        
        {/* Health Status */}
        <div className="flex items-center mt-1.5">
          <span 
            className="w-2 h-2 rounded-full mr-1.5 flex-shrink-0" 
            style={{ backgroundColor: healthColor }}
          />
          <span 
            className="text-[11px] font-medium leading-none"
            style={{ color: healthColor }}
          >
            {isGroup && health !== 'HEALTHY' 
              ? `${data.diagnostic || healthText}`
              : healthText}
          </span>
        </div>

        {/* Metadata (Root Only) */}
        {isRoot && (
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-2 pt-1.5 border-t border-zinc-800/60 truncate">
            <span>{data.metadata?.instance_type || data.metadata?.type || 'Standard'}</span>
            <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
            <span>{data.metadata?.az || data.metadata?.region || 'us-east-1'}</span>
            <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
            <span>{Object.keys(data.metadata || {}).length} attrs</span>
          </div>
        )}
      </div>

      <Handle type="source" position={sourcePosition} style={{ opacity: 0, pointerEvents: 'none' }} />
    </div>
  );
});

export default TopologyNode;
