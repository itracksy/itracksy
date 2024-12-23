import { createContext, useCallback, useContext, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmationDialogOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

interface ConfirmationDialogContext {
  confirm: (options: ConfirmationDialogOptions) => Promise<boolean>;
}

const ConfirmationDialogContext = createContext<ConfirmationDialogContext | undefined>(
  undefined
);

export function ConfirmationDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmationDialogOptions | null>(null);
  const [resolve, setResolve] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmationDialogOptions) => {
    setOptions(options);
    setOpen(true);
    return new Promise<boolean>((res) => {
      setResolve(() => res);
    });
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    resolve?.(false);
  }, [resolve]);

  const handleConfirm = useCallback(() => {
    setOpen(false);
    resolve?.(true);
  }, [resolve]);

  return (
    <ConfirmationDialogContext.Provider value={{ confirm }}>
      {children}
      {options && (
        <Dialog open={open} onOpenChange={handleClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{options.title}</DialogTitle>
              <DialogDescription>{options.description}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={handleClose}>
                {options.cancelText || "Cancel"}
              </Button>
              <Button
                variant={options.variant || "default"}
                onClick={handleConfirm}
              >
                {options.confirmText || "Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </ConfirmationDialogContext.Provider>
  );
}

export const useConfirmationDialog = () => {
  const context = useContext(ConfirmationDialogContext);
  if (!context) {
    throw new Error(
      "useConfirmationDialog must be used within a ConfirmationDialogProvider"
    );
  }
  return context;
};
