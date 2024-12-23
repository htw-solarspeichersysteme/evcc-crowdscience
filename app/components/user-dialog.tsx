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
import { type OptionalId } from "~/lib/typeHelpers";
import { createUser, updateUser } from "~/serverHandlers/user";
import type { SessionUser } from "~/serverHandlers/userSession";

type EditableUser = Pick<
  SessionUser,
  "firstName" | "lastName" | "email" | "isAdmin" | "id"
>;
export type DialogUser = OptionalId<EditableUser>;

const userDialogCreateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  isAdmin: z.boolean(),
  password: z.string(),
  mode: z.literal("create").default("create"),
});

const userDialogUpdateSchema = userDialogCreateSchema.extend({
  id: z.string(),
  password: z.string().nullable().default(null),
  showChangePassword: z.boolean().default(false),
  mode: z.literal("update").default("update"),
});

export function UserDialogForm({
  user,
  onAfterSuccessfulSubmit,
}: {
  user: DialogUser;
  onAfterSuccessfulSubmit?: (
    values: z.infer<
      typeof userDialogCreateSchema | typeof userDialogUpdateSchema
    >,
  ) => void;
}) {
  const schema = user.id ? userDialogUpdateSchema : userDialogCreateSchema;

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...user,
      // @ts-expect-error it does not matter enough to fix
      mode: user.id ? "update" : "create",
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
  });
  const createMutation = useMutation({
    mutationFn: createUser,
  });

  // const { mutateAsync: createMutation } = api.user.create.useMutation();
  // const { mutateAsync: updateMutation } = api.user.update.useMutation();

  async function onSubmit(values: z.infer<typeof schema>) {
    if (values?.mode === "update") {
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
                <div className="flex flex-row items-center justify-left gap-4">
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
          <FormLabel>{user.id ? "Change" : "Set"} Password</FormLabel>
          <FormControl>
            <div className="flex flex-row items-center gap-4">
              <FormField
                control={form.control}
                name="showChangePassword"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => {
                  return (
                    <PasswordInput
                      {...field}
                      value={field.value ?? ""}
                      disabled={!form.watch("showChangePassword")}
                      autoComplete={user.id ? "off" : "new-password"}
                    />
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

export function UserDialog({
  onOpenChange,
  user,
}: {
  onOpenChange: (open: boolean) => void;
  user: DialogUser | null;
}) {
  const queryClient = useQueryClient();

  return (
    <Dialog open={user !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{user?.id ? "Edit" : "Create"} User</DialogTitle>
          <DialogDescription>
            Make changes to the user here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        {user ? (
          <UserDialogForm
            user={user}
            onAfterSuccessfulSubmit={(values) => {
              onOpenChange(false);
              void queryClient.invalidateQueries({
                queryKey: ["user"],
              });

              // make "delete" to "deleted" and "create" to "created"
              const action = `${values.mode}d` as const;
              toast({
                title: `User ${action}`,
                description: `User ${values.firstName} ${values.lastName} has been ${action}`,
              });
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
