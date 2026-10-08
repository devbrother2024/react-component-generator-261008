import { useState } from 'react';

interface CodeViewProps {
  code: string;
  isStreaming?: boolean;
}

export function CodeView({ code, isStreaming = false }: CodeViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-panel">
      <div className="panel-header">
        <h3>{isStreaming ? '코드 생성 중...' : '코드'}</h3>
        <button className="btn-copy" disabled={isStreaming} onClick={handleCopy}>
          {copied ? '복사됨!' : '복사'}
        </button>
      </div>
      <pre className="code-block">
        <code>{code || (isStreaming ? '첫 코드 응답을 기다리고 있습니다...' : '')}</code>
      </pre>
    </div>
  );
}
