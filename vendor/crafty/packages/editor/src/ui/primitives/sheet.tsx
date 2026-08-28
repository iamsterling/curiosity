import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from "react";

const joinClasses = (...classes: Array<string | undefined>): string => classes.filter(Boolean).join(" ");

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;
export const SheetTitle = Dialog.Title;
export const SheetDescription = Dialog.Description;

export function SheetHeader({ className, ...props }: ComponentPropsWithoutRef<"div">): ReactNode {
  return <div className={joinClasses("sheet-header", className)} {...props} />;
}

export const SheetContent = forwardRef<ElementRef<typeof Dialog.Content>, ComponentPropsWithoutRef<typeof Dialog.Content> & { side?: "top" | "right" | "bottom" | "left" }>(function SheetContent({ className, children, side = "right", ...props }, ref) {
  return <Dialog.Portal>
    <Dialog.Overlay className="sheet-overlay" />
    <Dialog.Content ref={ref} className={joinClasses("sheet-content", `sheet-${side}`, className)} {...props}>
      {children}
      <Dialog.Close className="sheet-close" aria-label="Close panel">
        <X aria-hidden="true" size={17} strokeWidth={2} />
      </Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>;
});
