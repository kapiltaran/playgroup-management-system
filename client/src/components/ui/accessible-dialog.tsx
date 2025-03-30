import * as React from "react";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// This is a wrapper component that ensures accessibility requirements
// like having a DialogTitle when using DialogContent
interface AccessibleDialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogContent> {
  title: string;
  description?: string;
}

export const AccessibleDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  AccessibleDialogContentProps
>(({ title, description, children, ...props }, ref) => (
  <DialogContent ref={ref} {...props}>
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
      {description && <DialogDescription>{description}</DialogDescription>}
    </DialogHeader>
    {children}
  </DialogContent>
));
AccessibleDialogContent.displayName = "AccessibleDialogContent";

// Export all dialog components
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};