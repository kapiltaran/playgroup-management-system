import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertExpenseSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle,
  SheetFooter
} from "@/components/ui/sheet";

const formSchema = insertExpenseSchema.extend({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in format YYYY-MM-DD",
  }),
  amount: z.string().min(1, "Amount is required"),
  category: z.string().min(1, "Category is required"),
});

type ExpenseFormValues = z.infer<typeof formSchema>;

// Predefined expense categories
const EXPENSE_CATEGORIES = [
  "Materials",
  "Food",
  "Activities",
  "Utilities",
  "Salary",
  "Rent",
  "Equipment",
  "Maintenance",
  "Transportation",
  "Other"
];

interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: ExpenseFormValues) => void;
  defaultValues?: Partial<ExpenseFormValues>;
  isSubmitting?: boolean;
}

export function ExpenseForm({
  isOpen,
  onClose,
  onSubmit,
  defaultValues,
  isSubmitting = false,
}: ExpenseFormProps) {
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      description: "",
      amount: "",
      category: "",
      date: new Date().toISOString().substring(0, 10),
      notes: "",
    },
  });

  const handleSubmit = (values: ExpenseFormValues) => {
    onSubmit(values);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {defaultValues?.id ? "Edit Expense" : "Add New Expense"}
          </SheetTitle>
          <SheetDescription>
            Fill in the details below to {defaultValues?.id ? "update" : "add"} an expense.
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter expense description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="0.00" 
                          type="number" 
                          step="0.01"
                          min="0"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional notes"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <SheetFooter className="mt-6 flex items-center justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Expense"}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
