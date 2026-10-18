"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type CopilotMessageProps = {
  text: string;
  isUser: boolean;
};

export function CopilotMessage({
  text,
  isUser,
}: CopilotMessageProps) {
  if (isUser) {
    return (
      <p className="whitespace-pre-wrap wrap-break-word">
        {text}
      </p>
    );
  }

  return (
    <div className="min-w-0 space-y-3 wrap-break-word font-sans text-sm leading-6">
      <ReactMarkdown
        skipHtml
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({children}) => (
            <p className="my-2 whitespace-pre-wrap first:mt-0 last:mb-0">
              {children}
            </p>
          ),

          strong: ({children}) => (
            <strong className="font-semibold text-emerald-200">
              {children}
            </strong>
          ),

          h1: ({children}) => (
            <h3 className="mb-2 mt-4 text-base font-semibold text-white">
              {children}
            </h3>
          ),

          h2: ({children}) => (
            <h3 className="mb-2 mt-4 text-base font-semibold text-white">
              {children}
            </h3>
          ),

          h3: ({children}) => (
            <h4 className="mb-2 mt-3 text-sm font-semibold text-white">
              {children}
            </h4>
          ),

          ul: ({children}) => (
            <ul className="my-2 list-disc space-y-1 pl-5">
              {children}
            </ul>
          ),

          ol: ({children}) => (
            <ol className="my-2 list-decimal space-y-1 pl-5">
              {children}
            </ol>
          ),

          li: ({children}) => (
            <li className="pl-1">
              {children}
            </li>
          ),

          table: ({children}) => (
            <div
              aria-label="Tabela da resposta do Copiloto"
              className="my-3 max-w-full overflow-x-auto rounded-xl border border-white/10"
              role="region"
              tabIndex={0}
            >
              <table className="w-full border-collapse text-left text-xs">
                {children}
              </table>
            </div>
          ),

          thead: ({children}) => (
            <thead className="bg-white/5 text-slate-200">
              {children}
            </thead>
          ),

          th: ({children}) => (
            <th className="border-b border-white/10 px-3 py-2 font-semibold">
              {children}
            </th>
          ),

          td: ({children}) => (
            <td className="border-b border-white/5 px-3 py-2 align-top last:whitespace-nowrap">
              {children}
            </td>
          ),

          blockquote: ({children}) => (
            <blockquote className="my-3 border-l-2 border-emerald-300/40 pl-3 text-slate-400">
              {children}
            </blockquote>
          ),

          code: ({children}) => (
            <code className="rounded bg-white/5 px-1 py-0.5 font-mono text-xs text-emerald-100">
              {children}
            </code>
          ),

          pre: ({children}) => (
            <pre className="my-3 overflow-x-auto rounded-xl bg-black/20 p-3">
              {children}
            </pre>
          ),

          a: ({href, children}) => (
            <a
              className="text-emerald-300 underline underline-offset-4"
              href={href}
              rel="noopener noreferrer"
              target="_blank"
            >
              {children}
            </a>
          ),

          img: () => null,

          hr: () => (
            <hr className="my-4 border-white/10" />
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}