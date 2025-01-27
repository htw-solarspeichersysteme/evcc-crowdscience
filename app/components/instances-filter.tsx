import { zodResolver } from "@hookform/resolvers/zod";
import { AccordionItem } from "@radix-ui/react-accordion";
import { Link, useSearch } from "@tanstack/react-router";
import { FilterIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import { DualRangeSlider } from "~/components/ui/dual-range-slider";
// import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { useInstancesFilter } from "~/hooks/use-instances-filter";
import { instancesFilterSchema } from "~/lib/globalSchemas";
import { roundToNiceNumber } from "~/lib/utils";
import { type ActiveInstances } from "~/serverHandlers/instance/serverFns";
import { HistogramPreview } from "./charts/histogram-preview";
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

const getDefaultRangeValues = (instances: ActiveInstances) => {
  const pvPower = instances.map((instance) => instance.pvPower ?? -1);
  const loadpointPower = instances.map(
    (instance) => instance.loadpointPower ?? -1,
  );

  return {
    pvPower: [0, roundToNiceNumber(Math.max(...pvPower))],
    loadpointPower: [0, roundToNiceNumber(Math.max(...loadpointPower))],
  } satisfies Record<string, [number, number]>;
};

export function InstancesFilter({ className }: { className?: string }) {
  const { filter, updateFilter, instances, filteredInstances } =
    useInstancesFilter();
  const { filterExpanded } = useSearch({ from: "/dashboard" });

  const defaultFormValues = {
    id: "",
    updatedWithinHours: 0,
    chargingBehaviour: [],
    ...getDefaultRangeValues(instances),
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
                ({filteredInstances?.length}/{instances?.length})
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
              {/* <FormField
                control={instancesFilterForm.control}
                name="chargingBehaviour"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel>
                      Charging Behaviour{" "}
                      <span className="text-red-500">
                        (not implemented yet)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <ToggleGroup
                        type="multiple"
                        className="flex gap-2"
                        value={field.value}
                        onValueChange={(value) => field.onChange(value)}
                      >
                        <ToggleGroupItem
                          value="daily"
                          className="border border-gray-300 rounded px-3 py-2 hover:bg-primary hover:text-white data-[state=on]:bg-primary data-[state=on]:text-white transition-colors"
                        >
                          Daily
                        </ToggleGroupItem>
                        <ToggleGroupItem
                          value="multiplePerWeek"
                          // variant="default"
                          className="border border-gray-300 rounded px-3 py-2 hover:bg-primary hover:text-white data-[state=on]:bg-primary data-[state=on]:text-white transition-colors"
                        >
                          Multiple per Week
                        </ToggleGroupItem>
                        <ToggleGroupItem
                          value="weekly"
                          className="border border-gray-300 rounded px-3 py-2 hover:bg-primary hover:text-white data-[state=on]:bg-primary data-[state=on]:text-white transition-colors"
                        >
                          Weekly
                        </ToggleGroupItem>
                        <ToggleGroupItem
                          value="rarely"
                          className="border border-gray-300 rounded px-3 py-2 hover:bg-primary hover:text-white data-[state=on]:bg-primary data-[state=on]:text-white transition-colors"
                        >
                          Rarely
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}
              <FormField
                control={instancesFilterForm.control}
                name="pvPower"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel>
                      PV Power{" "}
                      <span className="text-muted-foreground">(in kW)</span>
                    </FormLabel>
                    <FormControl>
                      <div>
                        <HistogramPreview
                          data={instances.map(
                            (instance) => instance.pvPower ?? -1,
                          )}
                          range={defaultFormValues.pvPower}
                          binSize={0.1}
                        />
                        <DualRangeSlider
                          label={(value) => value}
                          labelPosition="bottom"
                          value={field.value}
                          onValueChange={(value) => field.onChange(value)}
                          min={defaultFormValues.pvPower[0]}
                          max={defaultFormValues.pvPower[1]}
                          step={0.1}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={instancesFilterForm.control}
                name="loadpointPower"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel>
                      Wallbox Power{" "}
                      <span className="text-muted-foreground">(in kwH)</span>
                    </FormLabel>
                    <FormControl>
                      <div>
                        <HistogramPreview
                          data={instances.map(
                            (instance) => instance.loadpointPower ?? -1,
                          )}
                          range={defaultFormValues.loadpointPower}
                          binSize={1}
                        />
                        <DualRangeSlider
                          label={(value) => value}
                          labelPosition="bottom"
                          value={field.value}
                          onValueChange={(value) => field.onChange(value)}
                          min={defaultFormValues.loadpointPower[0]}
                          max={defaultFormValues.loadpointPower[1]}
                          step={1}
                        />
                      </div>
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
