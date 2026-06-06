import React from 'react';
import { Course, MindmapNode } from '@/types/ai-output';
import { useLearningStore } from '@/store/use-learning-store';

interface MindmapRendererProps {
  course: Course;
  activeTopicSlug: string | null;
  onNodeClick: (slug: string) => void;
}

export function MindmapRenderer({ course, activeTopicSlug, onNodeClick }: MindmapRendererProps) {
  const { progress } = useLearningStore();

  const isNodeCompleted = (node: MindmapNode) => {
    if (node.type === 'topic' && node.slug) {
      const key = `${course.id}:${node.slug}`;
      return progress[key]?.completed || false;
    }
    return false;
  };

  const getIsActive = (node: MindmapNode) => {
    return node.type === 'topic' && node.slug === activeTopicSlug;
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Interactive Syllabus Path</h3>
          <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))' }}>Navigate course modules visually</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'hsl(var(--primary-violet))' }}></span> Active
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'hsl(var(--primary-cyan))' }}></span> Done
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'hsl(var(--text-muted))' }}></span> Topic
          </span>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', height: '420px', backgroundColor: '#1A0F14', borderRadius: '12px', border: '2px solid hsla(var(--primary-magenta) / 0.5)', overflow: 'auto', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' }}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 800 560"
          preserveAspectRatio="xMidYMid meet"
          style={{ display: 'block' }}
        >
          <defs>
            {/* Connection Glow Filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            
            {/* Active Glow Filter */}
            <filter id="active-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            
            <linearGradient id="activeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary-violet))" />
              <stop offset="100%" stopColor="hsl(var(--primary-cyan))" />
            </linearGradient>
          </defs>

          {/* Draw Edges */}
          {course.mindmap.edges.map((edge, idx) => {
            const fromNode = course.mindmap.nodes.find((n) => n.id === edge.from);
            const toNode = course.mindmap.nodes.find((n) => n.id === edge.to);

            if (!fromNode || !toNode) return null;

            const isCompleted = isNodeCompleted(toNode);
            const isActive = getIsActive(toNode);

            let strokeColor = 'rgba(255, 165, 0, 0.5)'; // Orange
            let strokeWidth = 2.5;
            let filter = 'url(#glow)'; // Reflection for all edges

            if (isCompleted) {
              strokeColor = 'rgba(255, 140, 0, 0.9)'; // Bright orange for completed
              strokeWidth = 3;
            } else if (isActive) {
              strokeColor = 'url(#activeGrad)';
              strokeWidth = 3.5;
              filter = 'url(#active-glow)';
            }

            return (
              <line
                key={`edge-${idx}`}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                filter={filter}
                style={{ transition: 'stroke 0.3s ease' }}
              />
            );
          })}

          {/* Draw Nodes */}
          {course.mindmap.nodes.map((node) => {
            const isCompleted = isNodeCompleted(node);
            const isActive = getIsActive(node);
            
            let r = 14;
            let fill = 'hsl(35, 20%, 100%)';
            let stroke = 'hsl(var(--text-muted))';
            let strokeWidth = 2;
            let isClickable = false;
            let filter = undefined;

            if (node.type === 'root') {
              r = 28;
              fill = 'hsl(45, 100%, 96%)';
              stroke = 'hsl(var(--primary-cyan))';
              strokeWidth = 3;
              filter = 'url(#glow)';
            } else if (node.type === 'chapter') {
              r = 20;
              fill = 'hsl(35, 30%, 98%)';
              stroke = 'hsl(var(--text-secondary))';
              strokeWidth = 2;
            } else if (node.type === 'topic') {
              r = 15;
              isClickable = true;
              if (isCompleted) {
                fill = 'hsl(45, 100%, 90%)';
                stroke = 'hsl(var(--primary-cyan))';
                strokeWidth = 3;
              } else if (isActive) {
                fill = 'hsl(28, 100%, 95%)';
                stroke = 'hsl(var(--primary-violet))';
                strokeWidth = 3;
                filter = 'url(#active-glow)';
              } else {
                fill = 'white';
                stroke = 'hsl(var(--border-glass-bright))';
                strokeWidth = 2;
              }
            }

            return (
              <g
                key={node.id}
                onClick={() => isClickable && node.slug && onNodeClick(node.slug)}
                style={{ cursor: isClickable ? 'pointer' : 'default' }}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  filter={filter}
                  style={{
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                  }}
                  className={isClickable ? 'mindmap-node' : ''}
                />
                
                {/* Node Label Text */}
                <text
                  x={node.x}
                  y={node.y + r + 15}
                  textAnchor="middle"
                  fill={isActive ? 'hsl(var(--primary-cyan))' : 'white'}
                  fontSize={node.type === 'root' ? '12px' : '10px'}
                  fontWeight={isActive || node.type === 'root' ? 'bold' : 'normal'}
                  style={{
                    fontFamily: 'var(--font-title)',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    textShadow: '0 2px 4px rgba(0,0,0,0.9)'
                  }}
                >
                  {node.label.length > 20 ? `${node.label.substring(0, 17)}...` : node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
