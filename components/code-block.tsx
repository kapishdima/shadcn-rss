import React from "react";
import { highlightCode } from "@/lib/highlight";
import { Button } from "./ui/button";
import { CheckCheck, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

type CodeBlockProps = {
  code: string;
  lang?: string;
  containerClassName?: string;
  codeClassName?: string;
  hasCopyButton?: boolean;
};

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  lang,
  containerClassName,
  codeClassName,
  hasCopyButton = true,
}) => {
  const [isCopied, setIsCopied] = React.useState<boolean>(false);
  const [html, setHtml] = React.useState<string>("");

  const getHighlightedCode = async () => {
    const highlighted = await highlightCode(code, lang);
    setHtml(highlighted);
  };

  const copyToClipboard = () => {
    window.navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  React.useEffect(() => {
    getHighlightedCode();
  }, [code, lang]);

  return (
    <div
      className={cn(
        "relative w-full rounded-lg bg-muted text-sm px-4 py-2 pr-15",
        containerClassName
      )}
    >
      <div
        className={cn("not-prose w-full", codeClassName)}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {hasCopyButton && (
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-1 right-0 z-10"
          onClick={copyToClipboard}
        >
          {isCopied ? <CheckCheck /> : <Copy />}
        </Button>
      )}
    </div>
  );
};
