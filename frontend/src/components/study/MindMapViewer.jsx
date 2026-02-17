import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Color scheme based on hierarchy level
const levelColors = {
  0: { bg: '#3b82f6', border: '#2563eb', text: '#ffffff' }, // Root - Blue
  1: { bg: '#10b981', border: '#059669', text: '#ffffff' }, // Level 1 - Green
  2: { bg: '#f59e0b', border: '#d97706', text: '#ffffff' }, // Level 2 - Amber
};

// Custom node component
const MindMapNode = ({ data }) => {
  const colors = levelColors[data.level] || levelColors[2];
  
  return (
    <div
      style={{
        padding: '12px 20px',
        borderRadius: '8px',
        backgroundColor: colors.bg,
        border: `2px solid ${colors.border}`,
        color: colors.text,
        fontWeight: '500',
        fontSize: '14px',
        textAlign: 'center',
        minWidth: '120px',
        maxWidth: '180px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
      }}
    >
      {data.label}
    </div>
  );
};

const nodeTypes = {
  mindMapNode: MindMapNode,
};

export default function MindMapViewer({ mindmap }) {
  // Transform mindmap data to React Flow format
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!mindmap || !mindmap.nodes || !mindmap.edges) {
      return { initialNodes: [], initialEdges: [] };
    }

    // Ensure ids are strings and assign positions if missing
    const hasValidPositions = mindmap.nodes.some((n) => typeof n.x === 'number' && typeof n.y === 'number' && (n.x !== 0 || n.y !== 0));

    const nodes = mindmap.nodes.map((node, idx) => {
      const id = String(node.id);
      const level = node.level != null ? node.level : 1;

      // If no positions provided by backend, assign a simple layout
      let x = typeof node.x === 'number' ? node.x : 0;
      let y = typeof node.y === 'number' ? node.y : 0;
      if (!hasValidPositions) {
        if (level === 0) {
          x = 400;
          y = 60;
        } else if (level === 1) {
          x = 120 + idx * 140;
          y = 170;
        } else {
          // level 2+ spread under parents
          x = 120 + idx * 100;
          y = 270 + (level - 2) * 40;
        }
      }

      return {
        id,
        type: 'mindMapNode',
        position: { x, y },
        data: {
          label: node.label,
          level,
        },
      };
    });

    // Create edges
    const edges = mindmap.edges.map((edge, index) => {
      const source = String(edge.from);
      const target = String(edge.to);
      return ({
        id: `e${source}-${target}-${index}`,
        source,
        target,
        type: 'smoothstep',
        style: {
          stroke: '#64748b',
          strokeWidth: 2,
        },
        animated: false,
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [mindmap]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // Update nodes when mindmap data changes
  useMemo(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  if (!mindmap || !mindmap.nodes || mindmap.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[#64748b]">
        No mind map data available
      </div>
    );
  }

  return (
    <div className="w-full h-full" style={{ minHeight: '500px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
          minZoom: 0.5,
          maxZoom: 1.5,
        }}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          color="#e2e8f0" 
          gap={20} 
          size={1} 
        />
        <Controls 
          showInteractive={false}
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
          }}
        />
      </ReactFlow>
      
      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md p-3 border border-[#e2e8f0]">
        <p className="text-xs font-semibold text-[#64748b] mb-2">Legend</p>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: levelColors[0].bg }} />
            <span className="text-xs text-[#334155]">Main Topic</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: levelColors[1].bg }} />
            <span className="text-xs text-[#334155]">Sub Topics</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: levelColors[2].bg }} />
            <span className="text-xs text-[#334155]">Details</span>
          </div>
        </div>
      </div>
    </div>
  );
}
