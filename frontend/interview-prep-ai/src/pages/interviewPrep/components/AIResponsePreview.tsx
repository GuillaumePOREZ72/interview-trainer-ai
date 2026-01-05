import { LuCopy, LuCheck, LuCode } from "react-icons/lu";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneLight,
  vscDarkPlus,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { useState } from "react";
import type { Components } from "react-markdown";
import { useTheme } from "../../../hooks/useTheme";
import { a } from "framer-motion/client";

interface AIResponsePreviewProps {
  content: string;
}

interface CodeBlockProps {
  code: string;
  language: string;
}

const AIResponsePreview = ({ content }: AIResponsePreviewProps) => {
  if (!content) {
    return null;
  }

  const components: Components = {
    code({ node, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : "";

      return match ? (
        <CodeBlock
          code={String(children).replace(/\n$/, "")}
          language={language}
        />
      ) : (
        <code
          className="px-1.5 py-0.5 bg-bg-tertiary text-text-primary rounded text-sm font-mono"
          {...props}
        >
          {children}
        </code>
      );
    },
    p({ children }) {
      return <p className="mb-4 leading-6 text-text-secondary">{children}</p>;
    },
    strong({ children }) {
      return (
        <strong className="font-semibold text-text-primary">{children}</strong>
      );
    },
    em({ children }) {
      return <em className="italic text-text-secondary">{children}</em>;
    },
    ul({ children }) {
      return (
        <ul className="list-disc pl-6 space-y-2 my-4 text-text-secondary">
          {children}
        </ul>
      );
    },
    ol({ children }) {
      return (
        <ol className="list-decimal pl-6 space-y-2 my-4 text-text-secondary">
          {children}
        </ol>
      );
    },
    li({ children }) {
      return <li className="mb-1">{children}</li>;
    },
    blockquote({ children }) {
      return (
        <blockquote className="border-l-4 border-primary/50 pl-4 italic my-4 text-text-tertiary bg-bg-secondary/50 py-2 rounded-r-lg">
          {children}
        </blockquote>
      );
    },
    h1({ children }) {
      return (
        <h1 className="text-2xl font-bold mt-6 mb-4 text-text-primary">
          {children}
        </h1>
      );
    },
    h2({ children }) {
      return (
        <h2 className="text-xl font-bold mt-6 mb-3 text-text-primary">
          {children}
        </h2>
      );
    },
    h3({ children }) {
      return (
        <h3 className="text-lg font-bold mt-5 mb-2 text-text-primary">
          {children}
        </h3>
      );
    },
    h4({ children }) {
      return (
        <h4 className="text-base font-bold mt-4 mb-2 text-text-primary">
          {children}
        </h4>
      );
    },
    a({ children, href }) {
      return (
        <a
          href={href}
          className="text-primary hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      );
    },
    table({ children }) {
      return (
        <div className="overflow-x-auto my-4 rounded-lg border border-border-primary">
          <table className="min-w-full divide-y divide-border-primary">
            {children}
          </table>
        </div>
      );
    },
    thead({ children }) {
      return (
        <thead className="bg-bg-secondary text-text-primary">{children}</thead>
      );
    },
    tbody({ children }) {
      return (
        <tbody className="divide-y divide-border-primary bg-bg-primary text-text-secondary">
          {children}
        </tbody>
      );
    },
    tr({ children }) {
      return (
        <tr className="hover:bg-bg-secondary/50 transition-colors">
          {children}
        </tr>
      );
    },
    th({ children }) {
      return (
        <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
          {children}
        </th>
      );
    },
    td({ children }) {
      return (
        <td className="px-4 py-3 text-sm whitespace-nowrap">{children}</td>
      );
    },
    hr() {
      return <hr className="my-6 border-gray-200" />;
    },
    img({ alt, src }) {
      return <img src={src} alt={alt} className="my-4 max-w-full rounded" />;
    },
  };

  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

const CodeBlock = ({ code, language }: CodeBlockProps) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const { theme } = useTheme();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="relative my-4 rounded-lg overflow-hidden bg-bg-primary border border-border-primary shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-bg-secondary border-b border-border-primary ">
        <div className="flex items-center gap-2 text-text-secondary">
          <LuCode className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wider">
            {language || "code"}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-primary transition-colors cursor-pointer"
          aria-label="Copy code"
        >
          {isCopied ? (
            <>
              {" "}
              <LuCheck className="w-3.5 h-3.5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <LuCopy className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Code */}
      <div className="text-sm dark:bg-[#1e1e1e]">
        <SyntaxHighlighter
          language={language || "text"}
          style={theme === "dark" ? vscDarkPlus : oneLight}
          customStyle={{
            fontSize: "0.8rem",
            margin: 0,
            padding: "1.5rem",
            background: "transparent",
            fontFamily: "var(--font-mono)",
          }}
          wrapLongLines={true}
          PreTag="div"
          CodeTag="code"
          codeTagProps={{
            style: {
              background: "transparent",
              textShadow: "none",
            },
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default AIResponsePreview;
