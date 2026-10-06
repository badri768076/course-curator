import React from 'react';
import { VideoMindmapData, MindmapNode } from '@/types/video-analysis';

interface VideoMindmapRendererProps {
  data?: VideoMindmapData;
  onNodeClick?: (slug: string, timestamp?: number) => void;
  title?: string;
}

export function VideoMindmapRenderer({ data, onNodeClick, title }: VideoMindmapRendererProps) {
  const rootTitle = title || 'Topic Overview';

  // 1. Prepare raw nodes or default fallback nodes
  const rawNodes = data?.nodes && data.nodes.length > 0 ? data.nodes : [
    { id: 'root', slug: 'root', label: rootTitle, type: 'root' as const, x: 300, y: 200 },
    { id: 'c1', slug: 'core-concepts', label: 'Core Concepts', type: 'chapter' as const },
    { id: 'c2', slug: 'architecture', label: 'Architecture & Rules', type: 'chapter' as const },
    { id: 'c3', slug: 'implementation', label: 'Practical Implementation', type: 'topic' as const },
    { id: 'c4', slug: 'best-practices', label: 'Best Practices', type: 'topic' as const },
    { id: 'c5', slug: 'summary', label: 'Key Takeaways', type: 'topic' as const },
  ];

  // 2. Ensure each node has valid (x, y) coordinates (Radial Layout if missing)
  const rootNode = rawNodes.find((n) => n.type === 'root') || rawNodes[0];
  const otherNodes = rawNodes.filter((n) => n.id !== rootNode.id);
  
  const centerX = 300;
  const centerY = 200;
  const radius = 135;

  const nodes: MindmapNode[] = rawNodes.map((node) => {
    if (typeof node.x === 'number' && !isNaN(node.x) && typeof node.y === 'number' && !isNaN(node.y)) {
      return node;
    }
    if (node.id === rootNode.id) {
      return { ...node, x: centerX, y: centerY };
    }
    const idx = otherNodes.findIndex((n) => n.id === node.id);
    const count = Math.max(otherNodes.length, 1);
    const angle = (idx * (2 * Math.PI) / count) - Math.PI / 2;
    return {
      ...node,
      x: Math.round(centerX + Math.cos(angle) * radius),
      y: Math.round(centerY + Math.sin(angle) * (radius * 0.85)),
    };
  });

  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  // 3. Normalize edges or generate star edges from root
  const rawEdges = data?.edges && data.edges.length > 0 ? data.edges : otherNodes.map((n) => ({
    from: rootNode.id,
    to: n.id,
  }));

  const edges = rawEdges.map((edge: any) => ({
    from: edge.from || edge.source || '',
    to: edge.to || edge.target || '',
  })).filter((e) => nodeMap[e.from] && nodeMap[e.to]);

  // 4. Calculate bounding box safely
  const xs = nodes.map((n) => n.x ?? centerX);
  const ys = nodes.map((n) => n.y ?? centerY);
  const pad = 75;
  const minX = Math.min(...xs, centerX - 150) - pad;
  const minY = Math.min(...ys, centerY - 100) - pad;
  const maxX = Math.max(...xs, centerX + 150) + pad;
  const maxY = Math.max(...ys, centerY + 100) + pad;
  const vw = Math.max(maxX - minX, 400);
  const vh = Math.max(maxY - minY, 300);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {title && (
        <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Concept Network — {title}
        </p>
      )}
      <div style={{ width: '100%', borderRadius: '12px', border: '1px solid var(--cc-border, #e8e7e4)', background: 'var(--cc-surface, #ffffff)', overflow: 'auto', maxHeight: '480px' }}>
        <svg viewBox={`${minX} ${minY} ${vw} ${vh}`} width="100%" style={{ minHeight: '340px', display: 'block' }}>
          <defs>
            <radialGradient id="rootGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.04" />
            </radialGradient>
            <filter id="mmGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Edges */}
          {edges.map((edge, i) => {
            const from = nodeMap[edge.from];
            const to = nodeMap[edge.to];
            if (!from || !to) return null;
            const isChapterEdge = from.type === 'root' || to.type === 'chapter';
            return (
              <line
                key={`e${i}`}
                x1={from.x} y1={from.y}
                x2={to.x} y2={to.y}
                stroke={isChapterEdge ? 'rgba(79,70,229,0.45)' : 'rgba(148,163,184,0.5)'}
                strokeWidth={isChapterEdge ? 2 : 1.5}
                strokeDasharray={isChapterEdge ? undefined : '4 3'}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const isRoot = node.type === 'root';
            const isChapter = node.type === 'chapter';
            const isTopic = node.type === 'topic';
            const r = isRoot ? 28 : isChapter ? 20 : 16;

            const fill = isRoot
              ? 'url(#rootGrad)'
              : isChapter
              ? 'rgba(79,70,229,0.1)'
              : 'rgba(14,165,233,0.08)';
            const stroke = isRoot
              ? '#4f46e5'
              : isChapter
              ? 'rgba(79,70,229,0.8)'
              : 'rgba(14,165,233,0.7)';

            const isClickable = !!node.slug;

            return (
              <g
                key={node.id}
                onClick={() => isClickable && node.slug && onNodeClick?.(node.slug)}
                style={{ cursor: isClickable ? 'pointer' : 'default' }}
              >
                {isRoot && (
                  <circle cx={node.x} cy={node.y} r={r + 10}
                    fill="rgba(79,70,229,0.08)" filter="url(#mmGlow)" />
                )}
                <circle
                  cx={node.x} cy={node.y} r={r}
                  fill={fill} stroke={stroke} strokeWidth={isRoot ? 2.5 : 1.8}
                  style={{ transition: 'r 0.2s ease' }}
                />
                {/* Node icon / indicator inside circle */}
                <text
                  x={node.x} y={(node.y ?? 0) + 4}
                  textAnchor="middle"
                  fontSize={isRoot ? '12' : '10'}
                  fill={isRoot ? '#4f46e5' : isChapter ? '#4338ca' : '#0284c7'}
                  fontWeight="bold"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {isRoot ? '★' : isChapter ? '◆' : '●'}
                </text>
                {/* Node Label Below */}
                <text
                  x={node.x} y={(node.y ?? 0) + r + 15}
                  textAnchor="middle"
                  fontSize={isRoot ? '12' : isChapter ? '10' : '9.5'}
                  fontWeight={isRoot ? '700' : isChapter ? '600' : '500'}
                  fill={isRoot ? '#0f172a' : isChapter ? '#334155' : '#64748b'}
                  fontFamily="var(--cc-font-display, var(--font-title, sans-serif))"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {node.label.length > 20 ? node.label.slice(0, 18) + '…' : node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textAlign: 'center' }}>
        Interactive concept network — click any concept node to navigate
      </p>
    </div>
  );
}
