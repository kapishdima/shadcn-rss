"use client";

import { useEffect, useState } from "react";
import { Loader2, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getRegistries, type RegistryOption } from "@/lib/api/registries";

export type { RegistryOption };

const webhookFormSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL" }),
  registries: z.array(z.string()).min(1, {
    message: "Please select at least one registry to subscribe to.",
  }),
});

export type WebhookFormValues = z.infer<typeof webhookFormSchema>;

interface WebhookFormProps {
  defaultValues?: Partial<WebhookFormValues>;
  onSubmit: (data: WebhookFormValues) => Promise<void>;
  submitLabel?: string;
}

export function WebhookForm({
  defaultValues,
  onSubmit,
  submitLabel = "Create Webhook",
}: WebhookFormProps) {
  const [availableRegistries, setAvailableRegistries] = useState<
    RegistryOption[]
  >([]);
  const [isLoadingRegistries, setIsLoadingRegistries] = useState(true);

  const form = useForm<WebhookFormValues>({
    resolver: zodResolver(webhookFormSchema),
    defaultValues: {
      url: "",
      registries: [],
      ...defaultValues,
    },
  });

  useEffect(() => {
    async function loadRegistries() {
      try {
        setIsLoadingRegistries(true);
        const registries = await getRegistries();
        setAvailableRegistries(registries);
      } catch (error) {
        console.error("Failed to load registries:", error);
      } finally {
        setIsLoadingRegistries(false);
      }
    }

    loadRegistries();
  }, []);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endpoint URL</FormLabel>
              <FormControl>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="https://api.example.com/webhook"
                    className="pl-9"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormDescription>
                The URL where we'll send POST requests.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="registries"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Registries</FormLabel>
                <FormDescription>
                  Select the registries you want to receive updates from.
                </FormDescription>
              </div>
              {isLoadingRegistries ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto rounded-md border p-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
                  <div className="grid grid-cols-2 gap-4">
                    {availableRegistries.map((registry) => (
                      <FormField
                        key={registry.id}
                        control={form.control}
                        name="registries"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={registry.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(registry.name)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([
                                          ...(field.value || []),
                                          registry.name,
                                        ])
                                      : field.onChange(
                                          (field.value || []).filter(
                                            (value) => value !== registry.name
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {registry.name}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
