import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface CurrencySettings {
  value: string;
  key: string;
  description: string | null;
  id: number;
  updatedAt: string;
}

// Define the available currencies
const currencies = [
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "British Pound (£)" },
  { value: "JPY", label: "Japanese Yen (¥)" },
  { value: "CAD", label: "Canadian Dollar (C$)" },
  { value: "AUD", label: "Australian Dollar (A$)" },
  { value: "INR", label: "Indian Rupee (₹)" },
  { value: "CNY", label: "Chinese Yuan (¥)" },
  { value: "MXN", label: "Mexican Peso (Mex$)" },
  { value: "BRL", label: "Brazilian Real (R$)" },
];

// Schema for currency setting form
const currencyFormSchema = z.object({
  value: z.string().min(1, "Please select a currency"),
});

function CurrencySettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // Query to fetch the current currency setting
  const { data: currencySetting, isLoading: isLoadingCurrency } = useQuery<CurrencySettings>({
    queryKey: ["/api/settings/currency"],
    queryFn: () => apiRequest<CurrencySettings>("GET", "/api/settings/currency", undefined),
  });

  const form = useForm<z.infer<typeof currencyFormSchema>>({
    resolver: zodResolver(currencyFormSchema),
    defaultValues: {
      value: currencySetting?.value || "USD",
    },
  });

  // Update form values when currency data is loaded
  useEffect(() => {
    if (currencySetting && !isEditing) {
      form.reset({
        value: currencySetting.value,
      });
    }
  }, [currencySetting, form, isEditing]);

  // Mutation to update the currency setting
  const updateCurrencyMutation = useMutation({
    mutationFn: (data: z.infer<typeof currencyFormSchema>) => {
      return apiRequest("POST", "/api/settings", {
        key: "currency",
        value: data.value,
        description: "Default currency for fees and expenses"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/currency"] });
      toast({
        title: "Currency updated",
        description: "Your currency preference has been saved.",
      });
      setIsEditing(false);
    },
    onError: (error) => {
      console.error("Error updating currency:", error);
      toast({
        title: "Update failed",
        description: "There was a problem updating your currency preference.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: z.infer<typeof currencyFormSchema>) {
    updateCurrencyMutation.mutate(data);
  }

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    form.reset({
      value: currencySetting?.value || "USD",
    });
    setIsEditing(false);
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle>Currency Settings</CardTitle>
        <CardDescription>
          Set the default currency for fees, payments, and expenses.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingCurrency ? (
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select
                      disabled={!isEditing}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      This currency will be used throughout the system.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                {!isEditing ? (
                  <Button type="button" onClick={handleEdit}>
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={updateCurrencyMutation.isPending}
                    >
                      {updateCurrencyMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save
                    </Button>
                  </>
                )}
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure your application preferences
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <CurrencySettings />
        {/* Add more settings cards here as needed */}
      </div>
    </div>
  );
}