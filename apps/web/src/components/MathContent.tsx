import { useEffect, useRef } from 'react';

interface MathContentProps {
  readonly content: string;
  readonly className?: string;
}

export function MathContent({ content, className = '' }: MathContentProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    // React owns the container; KaTeX owns its children. Reset from source on
    // every update so flipping cards and StrictMode cannot reuse rendered math.
    container.textContent = content;
    if (!content.includes('$$') && !content.includes('\\(') && !content.includes('\\[')) {
      return;
    }

    let active = true;
    void (async () => {
      try {
        const { default: renderMathInElement } = await import('katex/contrib/auto-render');
        if (!active) {
          return;
        }
        renderMathInElement(container, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true },
          ],
          throwOnError: false,
          trust: false,
          maxSize: 20,
          maxExpand: 1000,
          output: 'htmlAndMathml',
          // Macro definitions are scoped to this content, never shared by cards.
          macros: {},
        });
      } catch {
        if (active) {
          container.textContent = content;
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [content]);

  return <span ref={containerRef} className={`math-content ${className}`} />;
}
