import { zodResolver } from "@hookform/resolvers/zod";
import { AccordionItem, AccordionTrigger } from "@radix-ui/react-accordion";
import { Link } from "@tanstack/react-router";
import { FilterIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import { useInstancesFilter } from "~/hooks/use-instances-filter";
import { instancesFilterSchema } from "~/lib/globalSchemas";
import { type Route as DashboardRoute } from "~/routes/dashboard";
import { type Route as DashboardInstancesRoute } from "~/routes/dashboard/instances";
import { Accordion, AccordionContent } from "./ui/accordion";
import { Button, LoadingButton } from "./ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";

export function InstancesFilter({
  className,
  routeId,
}: {
  className?: string;
  routeId:
    | (typeof DashboardRoute)["id"]
    | (typeof DashboardInstancesRoute)["id"];
}) {
  const { filter, updateFilter } = useInstancesFilter({ routeId });
  const instancesFilterForm = useForm<z.infer<typeof instancesFilterSchema>>({
    resolver: zodResolver(instancesFilterSchema),
    defaultValues: {
      id: "",
      updatedWithinHours: 0,
      ...filter,
    },
  });
  const onSubmit = async (values: z.infer<typeof instancesFilterSchema>) => {
    await updateFilter(values);
  };

  return (
    <Accordion type="single" collapsible className={className}>
      <AccordionItem value="instances-filter" className="flex flex-col">
        <Button variant="outline" className={"w-full px-4"} asChild>
          <AccordionTrigger>
            <FilterIcon className="size-4" />
            Filter Instances
            {filter && <span className="text-xs text-primary">(active)</span>}
          </AccordionTrigger>
        </Button>
        <AccordionContent className="pt-4 max-w-xl mx-auto w-full">
          <Form {...instancesFilterForm}>
            <form
              onSubmit={instancesFilterForm.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={instancesFilterForm.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Instance ID{" "}
                      <span className="text-muted-foreground">(contains)</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={instancesFilterForm.control}
                name="updatedWithinHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Updated within{" "}
                      <span className="text-muted-foreground">(in hours)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => {
                          field.onChange(Number(e.target.value));
                        }}
                        type="number"
                        min={0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                {filter && (
                  <Button variant="outline" className="" asChild>
                    <Link to={"."} search={{ iFltr: undefined }}>
                      Clear Filter
                    </Link>
                  </Button>
                )}
                <LoadingButton
                  type="submit"
                  className="w-full"
                  loading={instancesFilterForm.formState.isSubmitting}
                >
                  Apply Filter
                </LoadingButton>
              </div>
            </form>
          </Form>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
