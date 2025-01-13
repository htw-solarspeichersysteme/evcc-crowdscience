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
              "inline-flex items-center space-x-1 gap-1 rounded border border-gray-200 bg-gray-100 px-2 py-1 text-sm font-mono relative bg-background",
              "hover:bg-gray-200 cursor-pointer",
              className,
            )}
            onClick={copyToClipboard}
          >
            <span>{text}</span>
            <Button
              variant="ghost"
              size="icon"
              className="w-4 h-4 p-0 text-gray-500"
            >
              {copied ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
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
