import React, { useEffect, useState, useCallback, memo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
  EdgeLabelRenderer,
  BaseEdge,
  getStraightPath,
  getBezierPath,
  getSmoothStepPath,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';
import { getIcon, getColorClasses, getGlowColors, RESOURCE_MAP } from '../../../utils/iconMap';
import { CloudOff, Layers, AlertTriangle, Zap } from 'lucide-react';
import TopologyNode from './TopologyNode';

// ─── Edge color palette by relationship type ────────────────────────────────
const EDGE_STYLES = {
  DEFAULT:    { stroke: '#10b981', label: '#94a3b8' },   // emerald (healthy)
  CRITICAL:   { stroke: '#ef4444', label: '#fb7185' },   // red
  DEGRADED:   { stroke: '#f59e0b', label: '#fbbf24' },   // amber
  INACTIVE:   { stroke: '#94a3b8', label: '#94a3b8' },   // slate (unknown/inactive)
  HOVERED:    { stroke: '#38bdf8', label: '#67e8f9' },   // sky (highlighted path)
};

const getEdgeStyle = (relation, isIncident, isMain, isHovered, isDimmed) => {
  if (isIncident) return { ...EDGE_STYLES.CRITICAL, strokeWidth: 2.5, animated: true, opacity: 1 };
  if (isHovered)  return { ...EDGE_STYLES.HOVERED, strokeWidth: 2.5, animated: false, opacity: 1 };
  if (isDimmed)   return { ...EDGE_STYLES.INACTIVE, strokeWidth: 1.5, animated: false, opacity: 0.25, strokeDasharray: '4,4' };
  
  // Normal edges (healthy)
  return { ...EDGE_STYLES.DEFAULT, strokeWidth: 2, animated: false, opacity: 0.85 };
};

// ─── Custom floating edge label ──────────────────────────────────────────────
const RelationEdge = memo(({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, style, markerEnd, label }) => {
  const offset = data?.offset || 0;
  
  // Use Bezier path with X/Y offsets for a beautiful horizontal architecture flow
  const [edgePath, labelX, labelY] = getBezierPath({ 
    sourceX, 
    sourceY: sourceY + offset, 
    sourcePosition, 
    targetX, 
    targetY: targetY + offset, 
    targetPosition
  });
  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      {label && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan absolute pointer-events-none"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
          >
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{
                background: '#0d1117',
                color: data?.labelColor || '#94a3b8',
                border: `1px solid ${data?.borderColor || '#2d333b'}`,
              }}
            >
              {label}
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

const nodeTypes = {
  topologyNode: TopologyNode,
};

const edgeTypes = {
  relation: RelationEdge,
};

// ─── Dagre layout ────────────────────────────────────────────────────────────
const getLayoutedElements = (nodes, edges, direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 80, ranksep: 180, marginx: 40, marginy: 40 });

  nodes.forEach((node) => {
    const isRoot = node.data?.isRoot;
    const isGroup = node.data?.metadata?.isGroupNode;
    const w = isRoot ? 220 : isGroup ? 260 : 200;
    const h = isRoot ? 96 : isGroup ? 88 : 72;
    dagreGraph.setNode(node.id, { width: w, height: h });
  });

  edges.forEach((edge) => dagreGraph.setEdge(edge.source, edge.target));
  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const { x, y } = dagreGraph.node(node.id);
    const isRoot = node.data?.isRoot;
    const isGroup = node.data?.metadata?.isGroupNode;
    const w = isRoot ? 220 : isGroup ? 260 : 200;
    const h = isRoot ? 96 : isGroup ? 88 : 72;
    
    // Set handle positions based on layout direction
    const isHorizontal = direction === 'LR';
    
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: { x: x - w / 2, y: y - h / 2 },
    };
  });

  return { nodes: layoutedNodes, edges };
};

function FlowVisualizerContent({ data, focusNodeId, onNodeClick, isSidebarOpen, groupResources = true }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { setCenter, getNode, fitView }  = useReactFlow();
  const [lastCenteredNodeId, setLastCenteredNodeId] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);

  // Re-fit on sidebar toggle
  useEffect(() => {
    const t = setTimeout(() => { if (nodes.length > 0) fitView({ padding: 0.15, duration: 600, maxZoom: 1 }); }, 350);
    return () => clearTimeout(t);
  }, [isSidebarOpen, fitView, nodes.length]);

  // Re-fit on window resize
  useEffect(() => {
    const h = () => { if (nodes.length > 0) fitView({ padding: 0.15, duration: 500, maxZoom: 1 }); };
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, [fitView, nodes.length]);

  // Focus pan to selected node
  useEffect(() => {
    if (focusNodeId && focusNodeId !== lastCenteredNodeId && nodes.length > 0) {
      const t = setTimeout(() => {
        window.requestAnimationFrame(() => {
          const node = getNode(focusNodeId);
          if (node) {
            const x = node.position.x + (node.measured?.width  || 260) / 2;
            const y = node.position.y + (node.measured?.height || 110) / 2;
            setCenter(x, y, { zoom: 1.1, duration: 800 });
          } else {
            fitView({ padding: 0.2, duration: 800, maxZoom: 1 });
          }
        });
        setLastCenteredNodeId(focusNodeId);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [focusNodeId, nodes, fitView, setCenter, getNode, lastCenteredNodeId]);

  useEffect(() => { setLastCenteredNodeId(null); }, [data]);

  // Build nodes and edges when data changes
  useEffect(() => {
    if (!data || !data.nodes) return;

    let rawNodes = [...data.nodes];
    let rawEdges = [...(data.edges || [])];

    // ── Group nodes with 5+ same-type same-neighborhood (existing logic) ──
    const GROUPABLE_TYPES = ['CLOUDWATCH_ALARM', 'TARGET_GROUP'];
    const THRESHOLD = 5;
    const groupableNodes = groupResources ? rawNodes.filter(n => GROUPABLE_TYPES.includes(n.type)) : [];

    const getNeighborhoodHash = (nodeId) => {
      const inc = rawEdges.filter(e => e.source === nodeId || e.target === nodeId);
      return inc.map(e => e.source === nodeId ? `T:${e.target}` : `S:${e.source}`).sort().join('|');
    };

    const groups = {};
    groupableNodes.forEach(n => {
      const key = `${n.type}::${getNeighborhoodHash(n.id)}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(n);
    });

    const finalNodes = [];
    const finalEdges = [...rawEdges];
    const nodesToRemove = new Set();

    Object.entries(groups).forEach(([, members]) => {
      if (members.length >= THRESHOLD) {
        const type    = members[0].type;
        const groupId = `group_${type}_${members[0].id.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const hasCritical = members.some(m => m.health_state === 'CRITICAL');
        const hasDegraded = members.some(m => m.health_state === 'DEGRADED');

        finalNodes.push({
          id: groupId, type, label: `${members.length} ${type.replace(/_/g, ' ')}S`,
          status: 'active',
          health_state: hasCritical ? 'CRITICAL' : hasDegraded ? 'DEGRADED' : 'HEALTHY',
          diagnostic: hasCritical ? `${members.filter(m => m.health_state === 'CRITICAL').length} items CRITICAL` : undefined,
          metadata: { groupedNodes: members, isGroupNode: true },
        });
        members.forEach(m => nodesToRemove.add(m.id));

        // Rewire edges from first member to group
        rawEdges.filter(e => e.source === members[0].id || e.target === members[0].id).forEach(e => {
          const ne = { ...e };
          if (ne.source === members[0].id) ne.source = groupId;
          if (ne.target === members[0].id) ne.target = groupId;
          ne.id = `ge_${ne.source}_${ne.target}`;
          finalEdges.push(ne);
        });
      }
    });

    rawNodes.forEach(n => { if (!nodesToRemove.has(n.id)) finalNodes.push(n); });
    const processedEdges = finalEdges.filter(e => !nodesToRemove.has(e.source) && !nodesToRemove.has(e.target));

    // ── Map to ReactFlow nodes with visual tier ──
    const rootId = data.compute_id || data.last_compute_id;

    const rfNodes = finalNodes.map(n => {
      const isRoot      = n.id === rootId;
      const isGroupNode = n.metadata?.isGroupNode;

      return {
        id:   n.id,
        type: 'topologyNode',
        data: {
          label:       n.label,
          type:        n.type,
          status:      n.status,
          metadata:    n.metadata,
          health_state: n.health_state,
          diagnostic:  n.diagnostic,
          isRoot,
        },
        position: { x: 0, y: 0 },
      };
    });

    // Sort: root first, then by type alphabetically
    rfNodes.sort((a, b) => {
      if (a.data.isRoot !== b.data.isRoot) return a.data.isRoot ? -1 : 1;
      return (a.data.type || '').localeCompare(b.data.type || '');
    });

    // Count parallel edges to offset them
    const edgeCounts = {};
    const processedEdgesWithIndex = processedEdges.map(e => {
        const pairKey = [e.source, e.target].sort().join('|');
        if (edgeCounts[pairKey] === undefined) {
            edgeCounts[pairKey] = 0;
        }
        edgeCounts[pairKey]++;
        return { ...e, pairIndex: edgeCounts[pairKey] - 1, totalInPair: 0 }; // totalInPair set next
    });
    
    // Update total counts
    processedEdgesWithIndex.forEach(e => {
        const pairKey = [e.source, e.target].sort().join('|');
        e.totalInPair = edgeCounts[pairKey];
    });

    // ── Map to ReactFlow edges (proper style, NO blanket animation) ──
    const rfEdges = processedEdgesWithIndex.map((e, idx) => {
      const srcNode = finalNodes.find(n => n.id === e.source);
      const tgtNode = finalNodes.find(n => n.id === e.target);

      const isIncident = e.health_state === 'CRITICAL' || e.health_state === 'BLOCKED'
        || tgtNode?.health_state === 'CRITICAL' || srcNode?.health_state === 'CRITICAL';
      const isMain = srcNode?.id === rootId || tgtNode?.id === rootId;

      const isDegradedEdge = e.health_state === 'DEGRADED' || tgtNode?.health_state === 'DEGRADED' || srcNode?.health_state === 'DEGRADED';

      const style = getEdgeStyle(e.relation, isIncident, isMain, false, false);

      // Apply strokeDasharray: Degraded gets dashed lines, others get solid or their specific definitions
      let strokeDasharray = undefined;
      if (isDegradedEdge && !isIncident) strokeDasharray = '6,4';
      if (style.strokeDasharray) strokeDasharray = style.strokeDasharray; // Overridden by getEdgeStyle (e.g., dimmed)

      return {
        id:   `e-${e.source}-${e.target}-${idx}`,
        type: 'relation',
        source: e.source,
        target: e.target,
        label:  e.relation || '',
        animated: style.animated,
        style: {
          stroke:          style.stroke,
          strokeWidth:     style.strokeWidth,
          strokeDasharray: strokeDasharray,
          opacity:         style.opacity,
        },
        markerEnd: {
          type:  MarkerType.ArrowClosed,
          color: style.stroke,
          width: 16,
          height: 16,
        },
        data: {
          health_state: e.health_state,
          diagnostic:   e.diagnostic,
          labelColor:   style.label,
          borderColor:  style.stroke,
          isIncident,
          isMain,
          offset: e.totalInPair > 1 ? (e.pairIndex - (e.totalInPair - 1) / 2) * 25 : 0
        },
      };
    });

    rfEdges.sort((a, b) => {
      const sc = a.source.localeCompare(b.source);
      return sc !== 0 ? sc : a.target.localeCompare(b.target);
    });

    // Default to LR for a cleaner horizontal architecture layout
    const { nodes: lNodes, edges: lEdges } = getLayoutedElements(rfNodes, rfEdges, 'LR');
    setNodes(lNodes);
    setEdges(lEdges);
  }, [data, setNodes, setEdges, groupResources]);

  // ── Edge hover-dimming effect ──────────────────────────────────────────────
  useEffect(() => {
    if (!data?.nodes) return;
    setEdges(eds => eds.map(e => {
      const isConnected = hoveredNodeId && (e.source === hoveredNodeId || e.target === hoveredNodeId);
      const isDimmed    = hoveredNodeId && !isConnected;
      const isHovered   = isConnected;
      const isIncident  = e.data?.isIncident;
      const isMain      = e.data?.isMain;

      const style = getEdgeStyle(e.label, isIncident, isMain, isHovered, isDimmed);
      return {
        ...e,
        animated: style.animated,
        style: {
          ...e.style,
          stroke:      style.stroke,
          strokeWidth: style.strokeWidth,
          opacity:     style.opacity,
        },
        markerEnd: { ...e.markerEnd, color: style.stroke },
        data: { ...e.data, labelColor: style.label, borderColor: style.stroke },
      };
    }));
  }, [hoveredNodeId, data, setEdges]);

  // Empty state
  if (!data || !data.nodes || data.nodes.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-5" style={{ background: '#0a0a0f' }}>
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #2d333b' }}>
            <CloudOff size={36} className="text-zinc-600" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-[14px] font-semibold text-zinc-400">No topology data</p>
          <p className="text-[12px] text-zinc-600 mt-1">Select a compute resource from the sidebar to trace its flow</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full" style={{ background: '#0a0a0f' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => { setHoveredNodeId(null); if (onNodeClick) onNodeClick(node); }}
        onNodeMouseEnter={(_, node) => setHoveredNodeId(node.id)}
        onNodeMouseLeave={() => setHoveredNodeId(null)}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.15, maxZoom: 1 }}
        minZoom={0.05}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        className="bg-transparent"
      >
        {/* Subtle dot grid */}
        <Background color="#2d333b" gap={28} size={1} />

        {/* MiniMap */}
        <MiniMap
          nodeColor={(n) => {
            if (n.data?.health_state === 'CRITICAL') return '#ef4444';
            if (n.data?.health_state === 'DEGRADED') return '#f59e0b';
            return '#10b981'; // Healthy default
          }}
          maskColor="rgba(0,0,0,0.65)"
          style={{ backgroundColor: '#0d1117', width: 130, height: 85 }}
          className="!bg-[#0d1117] border border-[#2d333b] rounded-xl shadow-2xl overflow-hidden"
        />

        {/* Controls */}
        <Controls
          className="!bg-[#161a22] !border-[#2d333b] shadow-xl"
          showInteractive={false}
        />
      </ReactFlow>
    </div>
  );
}

export default function ApplicationFlowVisualizer(props) {
  return (
    <ReactFlowProvider>
      <FlowVisualizerContent {...props} />
    </ReactFlowProvider>
  );
}
