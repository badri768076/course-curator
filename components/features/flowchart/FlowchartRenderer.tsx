import React from 'react';
import { VideoFlowchartData, FlowchartNode } from '@/types/video-analysis';

interface FlowchartRendererProps {
  data?: VideoFlowchartData;
  title?: string;
}

const NODE_W = 160;
const NODE_H = 44;
const DIA_W = 170;
const DIA_H = 52;

function nodeColor(type: FlowchartNode['type']) {
  switch (type) {
    case 'start': return { fill: 'rgba(34,197,94,0.12)', stroke: '#16a34a', text: '#15803d' };
    case 'end':   return { fill: 'rgba(239,68,68,0.1)', stroke: '#dc2626', text: '#b91c1c' };
    case 'decision': return { fill: 'rgba(79,70,229,0.08)', stroke: '#4f46e5', text: '#4338ca' };
    case 'io':    return { fill: 'rgba(14,165,233,0.1)', stroke: '#0284c7', text: '#0369a1' };
    default:      return { fill: '#f8fafc', stroke: '#cbd5e1', text: '#1e293b' };
  }
}

function NodeShape({ node }: { node: FlowchartNode }) {
  const col = nodeColor(node.type);
  const cx = node.x ?? 200;
  const cy = node.y ?? 50;

  if (node.type === 'start' || node.type === 'end') {
    return (
      <g>
        <rect x={cx - NODE_W / 2} y={cy - NODE_H / 2} width={NODE_W} height={NODE_H}
          rx={NODE_H / 2} fill={col.fill} stroke={col.stroke} strokeWidth={1.5} />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
          fontSize="11" fontWeight="700" fill={col.text} fontFamily="var(--font-title)">
          {node.label.length > 22 ? node.label.slice(0, 20) + '…' : node.label}
        </text>
      </g>
    );
  }

  if (node.type === 'decision') {
    const hw = DIA_W / 2, hh = DIA_H / 2;
    const pts = `${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`;
    return (
      <g>
        <polygon points={pts} fill={col.fill} stroke={col.stroke} strokeWidth={1.5} />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
          fontSize="10" fontWeight="600" fill={col.text} fontFamily="var(--font-title)">
          {node.label.length > 20 ? node.label.slice(0, 18) + '…' : node.label}
        </text>
      </g>
    );
  }

  if (node.type === 'io') {
    const skew = 12;
    const pts = `${cx - NODE_W / 2 + skew},${cy - NODE_H / 2} ${cx + NODE_W / 2 + skew},${cy - NODE_H / 2} ${cx + NODE_W / 2 - skew},${cy + NODE_H / 2} ${cx - NODE_W / 2 - skew},${cy + NODE_H / 2}`;
    return (
      <g>
        <polygon points={pts} fill={col.fill} stroke={col.stroke} strokeWidth={1.5} />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
          fontSize="10" fontWeight="600" fill={col.text} fontFamily="var(--font-title)">
          {node.label.length > 22 ? node.label.slice(0, 20) + '…' : node.label}
        </text>
      </g>
    );
  }

  // Default: process rectangle
  return (
    <g>
      <rect x={cx - NODE_W / 2} y={cy - NODE_H / 2} width={NODE_W} height={NODE_H}
        rx={8} fill={col.fill} stroke={col.stroke} strokeWidth={1.5} />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
        fontSize="10" fontWeight="500" fill={col.text} fontFamily="var(--font-title)">
        {node.label.length > 22 ? node.label.slice(0, 20) + '…' : node.label}
      </text>
    </g>
  );
}

export function FlowchartRenderer({ data, title }: FlowchartRendererProps) {
  const rawNodes = data?.nodes && data.nodes.length > 0 ? data.nodes : [
    { id: 'start', label: `Start: ${title || 'Topic'}`, type: 'start' as const, x: 200, y: 50 },
    { id: 'p1', label: 'Understand Key Concepts', type: 'process' as const, x: 200, y: 140 },
    { id: 'd1', label: 'Need More Practice?', type: 'decision' as const, x: 200, y: 230 },
    { id: 'p2', label: 'Apply in Real Projects', type: 'process' as const, x: 200, y: 320 },
    { id: 'end', label: 'Topic Mastered', type: 'end' as const, x: 200, y: 410 },
  ];

  // Guarantee valid coordinates
  const nodes = rawNodes.map((n, i) => ({
    ...n,
    x: typeof n.x === 'number' && !isNaN(n.x) ? n.x : 200,
    y: typeof n.y === 'number' && !isNaN(n.y) ? n.y : (i * 90 + 50),
  }));

  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  const rawEdges = data?.edges && data.edges.length > 0 ? data.edges : [
    { from: 'start', to: 'p1' },
    { from: 'p1', to: 'd1' },
    { from: 'd1', to: 'p2' },
    { from: 'p2', to: 'end' },
  ];

  const edges = rawEdges.map((e, idx) => ({
    from: e.from || (e as any).source || (nodes[idx]?.id || ''),
    to: e.to || (e as any).target || (nodes[idx + 1]?.id || ''),
    label: e.label,
  })).filter((e) => nodeMap[e.from] && nodeMap[e.to]);

  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const minX = Math.min(...xs) - 120;
  const minY = Math.min(...ys) - 60;
  const maxX = Math.max(...xs) + 120;
  const maxY = Math.max(...ys) + 80;
  const vw = Math.max(maxX - minX, 300);
  const vh = Math.max(maxY - minY, 350);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {title && (
        <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Process Flowchart — {title}
        </p>
      )}
      <div style={{ width: '100%', borderRadius: '12px', border: '1px solid var(--cc-border, #e8e7e4)', background: 'var(--cc-surface, #ffffff)', overflow: 'auto', maxHeight: '520px' }}>
        <svg viewBox={`${minX} ${minY} ${vw} ${vh}`} width="100%" style={{ minHeight: '340px', display: 'block' }}>
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#64748b" />
            </marker>
            <marker id="arrow-violet" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#4f46e5" />
            </marker>
          </defs>

          {/* Edges */}
          {edges.map((edge, i) => {
            const from = nodeMap[edge.from];
            const to = nodeMap[edge.to];
            if (!from || !to) return null;

            const fx = from.x, fy = from.y + (from.type === 'decision' ? DIA_H / 2 : NODE_H / 2);
            const tx = to.x, ty = to.y - (to.type === 'decision' ? DIA_H / 2 : NODE_H / 2) - 4;
            const midY = (fy + ty) / 2;

            return (
              <g key={`e${i}`}>
                <path
                  d={`M ${fx} ${fy} C ${fx} ${midY}, ${tx} ${midY}, ${tx} ${ty}`}
                  fill="none"
                  stroke="rgba(148,163,184,0.6)"
                  strokeWidth="1.5"
                  markerEnd="url(#arrow)"
                />
                {edge.label && (
                  <text x={(fx + tx) / 2 + 6} y={midY} fontSize="9" fill="#475569" fontFamily="var(--cc-font-body, sans-serif)">
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => (
            <NodeShape key={node.id} node={node} />
          ))}
        </svg>
      </div>
    </div>
  );
}
