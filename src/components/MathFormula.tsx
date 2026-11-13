import katex from 'katex';
import { useMemo } from 'react';

interface MathFormulaProps {
  tex: string;
  displayMode?: boolean;
  className?: string;
}

export function MathFormula({
  tex,
  displayMode = false,
  className = '',
}: MathFormulaProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, {
        displayMode,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return tex;
    }
  }, [tex, displayMode]);

  return (
    <span
      className={`${displayMode ? 'block my-1.5 overflow-x-auto' : 'inline-block'} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
