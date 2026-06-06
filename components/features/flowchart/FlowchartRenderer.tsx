import React from 'react';
import { VideoFlowchartData, FlowchartNode } from '@/types/video-analysis';

interface FlowchartRendererProps {
  data: VideoFlowchartData;
  title?: string;
}

const NODE_W = 160;
const NODE_H = 44;
const DIA_W = 170;
const DIA_H = 52;

function nodeColor(type: FlowchartNode['type']) {
  switch (type) {
    case 'start': return { fill: 'rgba(34,197,94,0.15)', stroke: '#22c55e', text: '#22c55e' };
    case 'end':   return { fill: 'rgba(239,68,68,0.12)', stroke: '#ef4444', text: '#ef4444' };
    case 'decision': return { fill: 'rgba(168,85,247,0.12)', stroke: 'hsl(263,90%,64%)', text: '#c084fc' };
    case 'io':    return { fill: 'rgba(0,204,255,0.1)', stroke: '#00ccff', text: '#00ccff' };
    default:      return { fill: 'rgba(255,255,255,0.04)', stroke: 'rgba(148,163,184,0.4)', text: '#cbd5e1' };
  }
}

function NodeShape({ node }: { node: FlowchartNode }) {
  const col = nodeColor(node.type);
  const cx = node.x;
  const cy = node.y;

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
  const nodeMap = Object.fromEntries(data.nodes.map((n) => [n.id, n]));

  // Compute SVG viewbox from node positions
  const xs = data.nodes.map((n) => n.x);
  const ys = data.nodes.map((n) => n.y);
  const minX = Math.min(...xs) - 120;
  const minY = Math.min(...ys) - 60;
  const maxX = Math.max(...xs) + 120;
  const maxY = Math.max(...ys) + 80;
  const vw = maxX - minX;
  const vh = maxY - minY;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {title && (
        <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Process Flowchart — {title}
        </p>
      )}
      <div style={{ width: '100%', borderRadius: '12px', border: '1px solid hsla(var(--border-glass))', background: 'rgba(9,12,22,0.6)', overflow: 'auto', maxHeight: '520px' }}>
        <svg viewBox={`${minX} ${minY} ${vw} ${vh}`} width="100%" style={{ minHeight: '340px', display: 'block' }}>
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="rgba(148,163,184,0.6)" />
            </marker>
            <marker id="arrow-violet" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="hsl(263,90%,64%)" />
            </marker>
          </defs>

          {/* Edges */}
          {data.edges.map((edge, i) => {
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
                  stroke="rgba(148,163,184,0.35)"
                  strokeWidth="1.5"
                  markerEnd="url(#arrow)"
                />
                {edge.label && (
                  <text x={(fx + tx) / 2 + 6} y={midY} fontSize="9" fill="#94a3b8" fontFamily="var(--font-body)">
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {data.nodes.map((node) => (
            <NodeShape key={node.id} node={node} />
          ))}
        </svg>
      </div>
    </div>
  );
}
