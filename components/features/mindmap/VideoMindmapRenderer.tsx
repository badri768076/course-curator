import React from 'react';
import { VideoMindmapData } from '@/types/video-analysis';

interface VideoMindmapRendererProps {
  data: VideoMindmapData;
  onNodeClick?: (slug: string, timestamp?: number) => void;
  title?: string;
}

export function VideoMindmapRenderer({ data, onNodeClick, title }: VideoMindmapRendererProps) {
  const nodeMap = Object.fromEntries(data.nodes.map((n) => [n.id, n]));

  const xs = data.nodes.map((n) => n.x);
  const ys = data.nodes.map((n) => n.y);
  const pad = 80;
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  const vw = Math.max(...xs) - minX + pad;
  const vh = Math.max(...ys) - minY + pad;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {title && (
        <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Concept Network — {title}
        </p>
      )}
      <div style={{ width: '100%', borderRadius: '12px', border: '1px solid hsla(var(--border-glass))', background: 'rgba(9,12,22,0.6)', overflow: 'auto', maxHeight: '480px' }}>
        <svg viewBox={`${minX} ${minY} ${vw} ${vh}`} width="100%" style={{ minHeight: '320px', display: 'block' }}>
          <defs>
            <radialGradient id="rootGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(263,90%,64%)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(263,90%,64%)" stopOpacity="0.05" />
            </radialGradient>
            <filter id="mmGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Edges */}
          {data.edges.map((edge, i) => {
            const from = nodeMap[edge.from];
            const to = nodeMap[edge.to];
            if (!from || !to) return null;
            const isChapterEdge = from.type === 'root' || to.type === 'chapter';
            return (
              <line
                key={`e${i}`}
                x1={from.x} y1={from.y}
                x2={to.x} y2={to.y}
                stroke={isChapterEdge ? 'rgba(168,85,247,0.35)' : 'rgba(100,116,139,0.3)'}
                strokeWidth={isChapterEdge ? 2 : 1.5}
                strokeDasharray={isChapterEdge ? undefined : '4 3'}
              />
            );
          })}

          {/* Nodes */}
          {data.nodes.map((node) => {
            const isRoot = node.type === 'root';
            const isChapter = node.type === 'chapter';
            const isTopic = node.type === 'topic';
            const r = isRoot ? 26 : isChapter ? 18 : 12;

            const fill = isRoot
              ? 'url(#rootGrad)'
              : isChapter
              ? 'rgba(168,85,247,0.1)'
              : 'rgba(0,204,255,0.08)';
            const stroke = isRoot
              ? 'hsl(263,90%,64%)'
              : isChapter
              ? 'rgba(168,85,247,0.6)'
              : 'rgba(0,204,255,0.45)';

            const isClickable = isTopic && !!node.slug;

            return (
              <g
                key={node.id}
                onClick={() => isClickable && node.slug && onNodeClick?.(node.slug)}
                style={{ cursor: isClickable ? 'pointer' : 'default' }}
              >
                {isRoot && (
                  <circle cx={node.x} cy={node.y} r={r + 8}
                    fill="rgba(168,85,247,0.06)" filter="url(#mmGlow)" />
                )}
                <circle
                  cx={node.x} cy={node.y} r={r}
                  fill={fill} stroke={stroke} strokeWidth={isRoot ? 2 : 1.5}
                  style={{ transition: 'r 0.2s ease' }}
                />
                <text
                  x={node.x} y={node.y + r + 13}
                  textAnchor="middle"
                  fontSize={isRoot ? '12' : isChapter ? '10' : '9'}
                  fontWeight={isRoot ? '700' : isChapter ? '600' : '400'}
                  fill={isRoot ? 'white' : isChapter ? '#c4b5fd' : '#94a3b8'}
                  fontFamily="var(--font-title)"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {node.label.length > 18 ? node.label.slice(0, 16) + '…' : node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textAlign: 'center' }}>
        Click any topic node to jump to that moment in the video
      </p>
    </div>
  );
}
