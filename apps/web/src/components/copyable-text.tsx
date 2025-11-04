import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

interface CopyableTextProps {
  text: string;
  className?: string;
  language?: "en" | "de";
}

export function CopyableText({
  text,
  className,
  language = "en",
}: CopyableTextProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 5000); // Reset after 5 seconds
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "relative inline-flex items-center gap-1 space-x-1 rounded border border-gray-200 bg-background px-2 py-1 font-mono text-sm",
              "cursor-pointer hover:bg-gray-200",
              className,
            )}
            onClick={copyToClipboard}
          >
            <span>{text}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 text-gray-500"
            >
              {copied ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              <span className="sr-only">Copy</span>
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {language === "en"
              ? copied
                ? "Copied!"
                : "Click to copy"
              : copied
                ? "Kopiert!"
                : "Klicken, um zu kopieren"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
