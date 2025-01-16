import { zodResolver } from "@hookform/resolvers/zod";
import { AccordionItem } from "@radix-ui/react-accordion";
import { Link, useSearch } from "@tanstack/react-router";
import { FilterIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import { useInstancesFilter } from "~/hooks/use-instances-filter";
import { instancesFilterSchema } from "~/lib/globalSchemas";
import { instanceApi } from "~/serverHandlers/instance";
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

export function InstancesFilter({ className }: { className?: string }) {
  const { filter, updateFilter } = useInstancesFilter();
  const { filterExpanded } = useSearch({ from: "/dashboard" });

  const { data: instances } = instanceApi.getActiveInstances.useSuspenseQuery({
    variables: { data: {} },
  });
  const { data: unfilteredInstances } =
    instanceApi.getActiveInstances.useSuspenseQuery({
      variables: { data: { filter: {} } },
    });

  const defaultFormValues = {
    id: "",
    updatedWithinHours: 0,
  };

  const instancesFilterForm = useForm<z.infer<typeof instancesFilterSchema>>({
    resolver: zodResolver(instancesFilterSchema),
    values: {
      ...defaultFormValues,
      ...filter,
    },

    defaultValues: {
      ...defaultFormValues,
    },
  });
  const onSubmit = async (values: z.infer<typeof instancesFilterSchema>) => {
    await updateFilter(values);
  };

  return (
    <Accordion
      type="single"
      collapsible
      className={className}
      value={filterExpanded ? "instances-filter" : undefined}
    >
      <AccordionItem value="instances-filter" className="flex flex-col">
        <Button variant="outline" className={"w-full px-4"} asChild>
          <Link to={"."} search={{ filterExpanded: !filterExpanded }}>
            <FilterIcon className="size-4" />
            Filter Instances
            {filter && (
              <span className="text-xs text-primary">
                ({instances?.length}/{unfilteredInstances?.length})
              </span>
            )}
          </Link>
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
                          field.onChange(
                            e.target.value === "" ? "" : Number(e.target.value),
                          );
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
                    <Link
                      to={"."}
                      search={{ iFltr: undefined }}
                      onClick={() =>
                        instancesFilterForm.reset(defaultFormValues)
                      }
                    >
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
