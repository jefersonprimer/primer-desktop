import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useState } from "react";

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export default function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const handleCopyCode = async (code: string) => {
        await navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    return (
        <div className={`markdown-content ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Headings
                    h1: ({ children }) => (
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 mt-4 first:mt-0">{children}</h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 mt-3">{children}</h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 mt-2">{children}</h3>
                    ),

                    // Paragraphs
                    p: ({ children }) => (
                        <p className="text-gray-700 dark:text-white/90 mb-3 leading-relaxed">{children}</p>
                    ),

                    // Lists
                    ul: ({ children }) => (
                        <ul className="list-disc list-inside mb-3 space-y-1 text-gray-700 dark:text-white/90">{children}</ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-700 dark:text-white/90">{children}</ol>
                    ),
                    li: ({ children }) => (
                        <li className="text-gray-700 dark:text-white/90">{children}</li>
                    ),

                    // Strong / Emphasis
                    strong: ({ children }) => (
                        <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>
                    ),
                    em: ({ children }) => (
                        <em className="italic text-gray-600 dark:text-white/80">{children}</em>
                    ),

                    // Links
                    a: ({ href, children }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 underline transition-colors"
                        >
                            {children}
                        </a>
                    ),

                    // Blockquotes
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-blue-500/50 pl-4 py-1 my-3 bg-black/5 dark:bg-white/5 rounded-r-lg">
                            {children}
                        </blockquote>
                    ),

                    // Horizontal rules
                    hr: () => <hr className="border-black/10 dark:border-white/10 my-4" />,

                    // Code blocks
                    code: ({ className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || "");
                        const codeString = String(children).replace(/\n$/, "");
                        const isInline = !match && !codeString.includes("\n");

                        if (isInline) {
                            return (
                                <code
                                    className="bg-black/5 dark:bg-white/10 text-pink-600 dark:text-pink-300 px-1.5 py-0.5 rounded text-sm font-mono"
                                    {...props}
                                >
                                    {children}
                                </code>
                            );
                        }

                        return (
                            <div className="relative group my-3">
                                {/* Language badge */}
                                {match && (
                                    <div className="absolute top-0 left-0 px-2 py-1 text-xs text-gray-500 dark:text-white/50 bg-black/5 dark:bg-white/5 rounded-tl-lg rounded-br-lg">
                                        {match[1]}
                                    </div>
                                )}

                                {/* Copy button */}
                                <button
                                    onClick={() => handleCopyCode(codeString)}
                                    className="absolute top-2 right-2 px-2 py-1 text-xs bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-gray-600 dark:text-white/70 hover:text-white rounded transition-all opacity-0 group-hover:opacity-100"
                                >
                                    {copiedCode === codeString ? "✓ Copiado" : "Copiar"}
                                </button>

                                <SyntaxHighlighter
                                    style={oneDark}
                                    language={match ? match[1] : "text"}
                                    PreTag="div"
                                    className="!m-0 !rounded-lg !p-4 !text-sm !bg-black/5 dark:!bg-black/30"
                                    showLineNumbers={false}
                                >
                                    {codeString}
                                </SyntaxHighlighter>
                            </div>
                        );
                    },

                    // Tables
                    table: ({ children }) => (
                        <div className="overflow-x-auto my-3">
                            <table className="min-w-full border border-black/10 dark:border-white/10 rounded-lg overflow-hidden">
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({ children }) => (
                        <thead className="bg-black/5 dark:bg-white/5">{children}</thead>
                    ),
                    tbody: ({ children }) => (
                        <tbody className="divide-y divide-black/10 dark:divide-white/10">{children}</tbody>
                    ),
                    tr: ({ children }) => (
                        <tr className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">{children}</tr>
                    ),
                    th: ({ children }) => (
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-white">{children}</th>
                    ),
                    td: ({ children }) => (
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-white/90">{children}</td>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
