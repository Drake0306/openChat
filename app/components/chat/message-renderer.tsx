'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { Copy, Terminal, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MessageRendererProps {
  content: string;
  className?: string;
}

export default function MessageRenderer({ content, className = '' }: MessageRendererProps) {
  const [copiedStates, setCopiedStates] = React.useState<Record<string, boolean>>({});

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [id]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const components = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const codeContent = String(children).replace(/\n$/, '');
      const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;

      if (!inline && codeContent) {
        // Determine if it's a bash/terminal command
        const isBashCommand = language === 'bash' || language === 'sh' || language === 'shell' || 
                             codeContent.startsWith('$') || codeContent.startsWith('npm ') || 
                             codeContent.startsWith('git ') || codeContent.startsWith('docker ');

        if (isBashCommand) {
          return (
            <div className="my-4 rounded-lg bg-gray-900 border border-gray-700 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center space-x-2">
                  <Terminal className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-gray-300 font-mono">Terminal</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(codeContent, codeId)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                >
                  {copiedStates[codeId] ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <div className="p-4 bg-gray-900">
                <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">
                  <span className="text-green-500">$ </span>
                  <span className="text-gray-100">{codeContent}</span>
                </pre>
              </div>
            </div>
          );
        }

        // Regular code block with syntax highlighting
        return (
          <div className="my-4 rounded-lg overflow-hidden border border-gray-700">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-sm text-gray-300 font-mono">
                  {language || 'code'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(codeContent, codeId)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              >
                {copiedStates[codeId] ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={language || 'text'}
              PreTag="div"
              customStyle={{
                margin: 0,
                padding: '16px',
                fontSize: '14px',
                lineHeight: '1.5',
                background: '#1e1e1e',
              }}
              {...props}
            >
              {codeContent}
            </SyntaxHighlighter>
          </div>
        );
      }

      // Inline code
      return (
        <code 
          className="px-1.5 py-0.5 text-sm bg-gray-100 text-gray-900 rounded font-mono border"
          {...props}
        >
          {children}
        </code>
      );
    },
    
    pre({ children, ...props }: any) {
      return <div {...props}>{children}</div>;
    },

    h1({ children, ...props }: any) {
      return (
        <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-4 border-b border-gray-200 pb-2" {...props}>
          {children}
        </h1>
      );
    },

    h2({ children, ...props }: any) {
      return (
        <h2 className="text-xl font-semibold text-gray-900 mt-5 mb-3" {...props}>
          {children}
        </h2>
      );
    },

    h3({ children, ...props }: any) {
      return (
        <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2" {...props}>
          {children}
        </h3>
      );
    },

    p({ children, ...props }: any) {
      return (
        <p className="text-gray-700 leading-relaxed mb-3" {...props}>
          {children}
        </p>
      );
    },

    ul({ children, ...props }: any) {
      return (
        <ul className="list-disc list-inside space-y-1 mb-3 text-gray-700" {...props}>
          {children}
        </ul>
      );
    },

    ol({ children, ...props }: any) {
      return (
        <ol className="list-decimal list-inside space-y-1 mb-3 text-gray-700" {...props}>
          {children}
        </ol>
      );
    },

    li({ children, ...props }: any) {
      return (
        <li className="text-gray-700" {...props}>
          {children}
        </li>
      );
    },

    blockquote({ children, ...props }: any) {
      return (
        <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-4" {...props}>
          {children}
        </blockquote>
      );
    },

    table({ children, ...props }: any) {
      return (
        <div className="overflow-x-auto my-4">
          <table className="min-w-full border border-gray-300 rounded-lg" {...props}>
            {children}
          </table>
        </div>
      );
    },

    thead({ children, ...props }: any) {
      return (
        <thead className="bg-gray-50" {...props}>
          {children}
        </thead>
      );
    },

    th({ children, ...props }: any) {
      return (
        <th className="px-4 py-2 text-left font-medium text-gray-900 border-b border-gray-300" {...props}>
          {children}
        </th>
      );
    },

    td({ children, ...props }: any) {
      return (
        <td className="px-4 py-2 text-gray-700 border-b border-gray-200" {...props}>
          {children}
        </td>
      );
    },

    a({ children, href, ...props }: any) {
      return (
        <a 
          href={href}
          className="text-blue-600 hover:text-blue-800 underline"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      );
    },

    strong({ children, ...props }: any) {
      return (
        <strong className="font-semibold text-gray-900" {...props}>
          {children}
        </strong>
      );
    },

    em({ children, ...props }: any) {
      return (
        <em className="italic text-gray-700" {...props}>
          {children}
        </em>
      );
    },
  };

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        components={components}
        remarkPlugins={[remarkGfm]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}