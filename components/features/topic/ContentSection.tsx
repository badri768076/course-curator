import React, { useState } from 'react';
import { TopicNode } from '@/types/ai-output';
import { Button } from '@/components/ui/button';
import { Check, Clipboard, ClipboardCheck, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ContentSectionProps {
  topic: TopicNode;
  courseId: string;
  isCompleted: boolean;
  onToggleComplete: () => void;
}

export function ContentSection({ topic, courseId, isCompleted, onToggleComplete }: ContentSectionProps) {
  const router = useRouter();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Basic parser to render custom markdown styles beautifully
  const parseMarkdown = (content: string) => {
    if (!content) return null;

    const lines = content.split('\n');
    let inCodeBlock = false;
    let codeContent: string[] = [];
    let codeLanguage = '';
    
    return lines.map((line, idx) => {
      // Code Block handling
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          inCodeBlock = false;
          const codeText = codeContent.join('\n');
          const currentCodeId = `code-${idx}`;
          codeContent = [];
          
          return (
            <div key={idx} style={{ position: 'relative', margin: '1.5rem 0', borderRadius: '8px', overflow: 'hidden', border: '1px solid hsla(var(--border-glass))' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.9)', padding: '0.4rem 1rem', fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', fontFamily: 'monospace' }}>
                <span>{codeLanguage || 'code'}</span>
                <button
                  onClick={() => copyToClipboard(codeText, currentCodeId)}
                  style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  {copiedCode === currentCodeId ? <ClipboardCheck size={14} color="#10b981" /> : <Clipboard size={14} />}
                  {copiedCode === currentCodeId ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre style={{ margin: 0, padding: '1.2rem', backgroundColor: 'rgba(9, 12, 22, 0.7)', overflowX: 'auto', fontFamily: 'monospace', fontSize: '0.9rem', color: '#e2e8f0' }}>
                <code>{codeText}</code>
              </pre>
            </div>
          );
        } else {
          inCodeBlock = true;
          codeLanguage = line.trim().slice(3);
          return null;
        }
      }

      if (inCodeBlock) {
        codeContent.push(line);
        return null;
      }

      // Headings
      if (line.startsWith('# ')) {
        return <h1 key={idx} style={{ fontSize: '2rem', fontWeight: 800, margin: '2rem 0 1rem 0', color: 'white' }}>{line.substring(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} style={{ fontSize: '1.5rem', fontWeight: 700, margin: '1.8rem 0 0.8rem 0', color: 'hsl(var(--primary-cyan))' }}>{line.substring(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={idx} style={{ fontSize: '1.25rem', fontWeight: 600, margin: '1.5rem 0 0.5rem 0' }}>{line.substring(4)}</h3>;
      }

      // Lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <li key={idx} style={{ marginLeft: '1.5rem', marginBottom: '0.5rem', color: 'hsl(var(--text-secondary))', listStyleType: 'square' }}>
            {line.trim().substring(2)}
          </li>
        );
      }

      // Tables (simple parser)
      if (line.trim().startsWith('|') && line.includes('---')) {
        return null; // skip separators
      }
      if (line.trim().startsWith('|')) {
        const cols = line.split('|').map(c => c.trim()).filter(c => c !== '');
        const isHeader = idx < 5; // heuristic
        
        return (
          <div key={idx} style={{ display: 'flex', borderBottom: '1px solid hsla(var(--border-glass))', padding: '0.75rem 0.5rem', backgroundColor: isHeader ? 'rgba(255,255,255,0.03)' : 'transparent', fontWeight: isHeader ? 'bold' : 'normal' }}>
            {cols.map((col, cIdx) => (
              <span key={cIdx} style={{ flex: 1, fontSize: '0.9rem' }}>{col}</span>
            ))}
          </div>
        );
      }

      // Paragraph / Empty spaces
      if (line.trim() === '') {
        return <div key={idx} style={{ height: '0.8rem' }} />;
      }

      return (
        <p key={idx} style={{ fontSize: '1.05rem', lineHeight: '1.7', color: 'hsl(var(--text-secondary))', marginBottom: '1rem' }}>
          {line}
        </p>
      );
    });
  };

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid hsla(var(--border-glass))', paddingBottom: '1.25rem' }}>
        <div>
          <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em', color: 'hsl(var(--primary-violet))', fontWeight: 'bold' }}>Topic Lesson</span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.25rem' }}>{topic.title}</h2>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Button
            variant={isCompleted ? 'secondary' : 'primary'}
            onClick={onToggleComplete}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {isCompleted ? <Check size={16} color="#22c55e" /> : null}
            {isCompleted ? 'Completed' : 'Mark Complete'}
          </Button>
          
          {topic.quiz && topic.quiz.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => router.push(`/mcq/${topic.slug}`)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid hsla(var(--primary-cyan) / 0.4)' }}
            >
              <span>Quiz Room</span>
              <ArrowRight size={16} color="hsl(var(--primary-cyan))" />
            </Button>
          )}
        </div>
      </div>

      <div style={{ minHeight: '200px' }}>
        {parseMarkdown(topic.content || '')}
      </div>
    </div>
  );
}
