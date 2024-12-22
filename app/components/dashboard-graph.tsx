import { PlusIcon } from "lucide-react";

import { cn } from "~/lib/utils";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

export function DashboardGraph({
  title,
  className,
  onExpand,
  children,
}: {
  title: string;
  className?: string;
  onExpand?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-normal">{title}</CardTitle>
        {onExpand ? (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="ml-auto rounded-full size-6"
                  onClick={onExpand}
                >
                  <PlusIcon />
                  <span className="sr-only">More details</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent sideOffset={10}>More details</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
