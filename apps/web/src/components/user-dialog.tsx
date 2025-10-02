import { useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { LoadingButton } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { PasswordInput } from "~/components/ui/password-input";
import { Switch } from "~/components/ui/switch";
import { toast } from "~/hooks/use-toast";
import type { SessionUser } from "~/lib/session";
import { cn } from "~/lib/utils";
import { Route } from "~/routes/dashboard/users";
import { createUser, updateUser, userApi } from "~/serverHandlers/user";

type EditableUser = Pick<
  SessionUser,
  "firstName" | "lastName" | "email" | "isAdmin" | "id"
>;
export type DialogUser = EditableUser;

const userDialogBaseSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.email(),
  isAdmin: z.boolean(),
});

const userDialogCreateSchema = userDialogBaseSchema.extend({
  password: z.string().min(3),
  mode: z.literal("create").default("create"),
});

const userDialogUpdateSchema = userDialogCreateSchema.extend({
  id: z.string(),
  password: z.string().nullable().default(null),
  showPasswordInput: z.boolean().default(false),
  mode: z.literal("edit").default("edit"),
});

type UserDialogFormProps = {
  user?: DialogUser;
  action: "edit" | "create";
} & {
  onAfterSuccessfulSubmit?: (
    values: z.infer<
      typeof userDialogCreateSchema | typeof userDialogUpdateSchema
    >,
  ) => void;
};

export function UserDialogForm({
  action,
  user,
  onAfterSuccessfulSubmit,
}: UserDialogFormProps) {
  const schema =
    action === "edit" ? userDialogUpdateSchema : userDialogCreateSchema;

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...(user ?? {
        email: "",
        firstName: "",
        lastName: "",
        isAdmin: false,
        id: null,
        password: "",
        showPasswordInput: true,
      }),
      mode: action,
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
  });
  const createMutation = useMutation({
    mutationFn: createUser,
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    if (values.mode === "edit") {
      await updateMutation.mutateAsync({ data: values });
    } else {
      await createMutation.mutateAsync({ data: values });
    }
    form.reset();
    onAfterSuccessfulSubmit?.(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input placeholder="Jane" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input placeholder="Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-Mail</FormLabel>
              <FormControl>
                <Input
                  placeholder="jane@doe.com"
                  autoComplete="username"
                  {...field}
                  type="email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isAdmin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Admin</FormLabel>
              <FormControl>
                <div className="justify-left flex flex-row items-center gap-4">
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <FormDescription>Is an Admin</FormDescription>
                </div>
              </FormControl>
            </FormItem>
          )}
        />
        <FormItem>
          <FormLabel
            className={cn(form.formState.errors.password && "text-destructive")}
          >
            {action === "edit" ? "Change" : "Set"} Password
          </FormLabel>
          <FormControl>
            <div className="flex flex-row flex-wrap items-center gap-x-4 gap-y-2">
              <FormField
                control={form.control}
                name="showPasswordInput"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={(e) => {
                      field.onChange(e);
                      if (!e) {
                        form.setValue("password", "");
                      }
                    }}
                  />
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => {
                  return (
                    <>
                      <PasswordInput
                        {...field}
                        value={field.value ?? ""}
                        disabled={!form.watch("showPasswordInput")}
                        autoComplete="new-password"
                      />
                      <FormMessage className="w-full shrink-0" />
                    </>
                  );
                }}
              />
            </div>
          </FormControl>
        </FormItem>
        <DialogFooter>
          <LoadingButton type="submit" loading={form.formState.isSubmitting}>
            {user?.id ? "Save changes" : "Create user"}
          </LoadingButton>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function UserDialog() {
  const queryClient = useQueryClient();
  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();

  const action = searchParams.action;
  const { data: user } = userApi.get.useQuery({
    variables: {
      data: { id: searchParams.action === "edit" ? searchParams.userId : "" },
    },
    enabled: action === "edit",
  });

  const navigateToUsers = useCallback(() => {
    return navigate({
      to: "/dashboard/users",
      replace: true,
      search: (prev) => ({
        ...prev,
        action: undefined,
        userId: undefined,
      }),
    });
  }, [navigate]);

  return (
    <Dialog
      open={!!action}
      onOpenChange={(state) => {
        if (!state) void navigateToUsers();
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {action === "edit" ? "Edit" : "Create"} User
          </DialogTitle>
          <DialogDescription>
            Make changes to the user here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        {action === "edit" && !user ? (
          <div>User not found</div>
        ) : (
          <UserDialogForm
            action={action!}
            user={user}
            onAfterSuccessfulSubmit={(values) => {
              void queryClient.invalidateQueries({
                queryKey: ["user"],
              });
              void navigateToUsers();

              const action = values.mode === "edit" ? "updated" : "created";
              toast({
                title: `User ${action}`,
                description: `User ${values.firstName} ${values.lastName} has been ${action}`,
              });
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
