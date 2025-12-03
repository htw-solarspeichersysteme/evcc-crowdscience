import React from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { formatDate } from "date-fns";
import { ExpandIcon } from "lucide-react";

import { cn } from "~/lib/utils";
import type { MetaData } from "~/orpc/types";
import { DataTable } from "./data-table";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

export function DashboardGraph({
  title,
  className,
  children,
}: {
  title?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4 pb-2">
        {title && (
          <CardTitle className="text-sm font-normal">{title}</CardTitle>
        )}
      </CardHeader>
      <CardContent className="grow px-4 pb-4">{children}</CardContent>
    </Card>
  );
}

export function ExpandableDashboardGraph({
  title,
  mainContent,
  expandContent,
  expandKey,
  className,
  dialogClassName,
}: {
  title: string;
  mainContent: React.ReactNode;
  expandContent: React.ReactNode;
  expandKey: string;
  className?: string;
  dialogClassName?: string;
}) {
  const search = useSearch({ from: "__root__" });
  const isExpanded = search.expandedKey === expandKey;
  const navigate = useNavigate();

  return (
    <>
      <Card className={cn(className)}>
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 p-4 pb-2">
          <CardTitle className="text-sm font-normal">{title}</CardTitle>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="ml-auto size-8 rounded-full"
                  onClick={() =>
                    navigate({
                      to: ".",
                      replace: true,
                      search: {
                        expandedKey: expandKey,
                      },
                    })
                  }
                >
                  <ExpandIcon />
                  <span className="sr-only">More details</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent sideOffset={10}>More details</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent className="px-4">{mainContent}</CardContent>
      </Card>
      <Dialog
        open={isExpanded}
        onOpenChange={() =>
          navigate({
            to: ".",
            replace: true,
            search: {
              expandedKey: undefined,
            },
          })
        }
      >
        <DialogContent className={cn("lg:max-w-4xl", dialogClassName)}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div className="h-full max-h-[70vh] w-full max-w-[90vw] overflow-auto">
            {expandContent}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// this is an extension of the ExpandableDashboardGraph
// it needs all the same props but also a metadata object
export function MetadataGraph({
  title,
  mainContent,
  expandKey,
  className,
  metaData,
}: {
  title: string;
  mainContent: React.ReactNode;
  expandKey: string;
  className?: string;
  metaData: MetaData;
}) {
  return (
    <ExpandableDashboardGraph
      title={title}
      mainContent={mainContent}
      expandContent={
        <div className="flex flex-col gap-4">
          <Tabs>
            <TabsList className="w-full overflow-x-auto">
              {Object.keys(metaData.values).map((key) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="w-full cursor-pointer"
                >
                  {key}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.keys(metaData.values).map((key) => (
              <TabsContent key={key} value={key}>
                <DataTable
                  data={Object.entries(metaData.values[key]).map(
                    ([key, value]) => ({
                      field: key,
                      value: value,
                    }),
                  )}
                  columns={[
                    { accessorKey: "field", header: "Field" },
                    {
                      accessorFn: (row) => row.value.value,
                      header: "Value",
                    },
                    {
                      accessorFn: (row) =>
                        formatDate(row.value.lastUpdate, "MMM dd HH:mm"),
                      header: "Last Update",
                    },
                  ]}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      }
      expandKey={expandKey}
      className={className}
    />
  );
}
