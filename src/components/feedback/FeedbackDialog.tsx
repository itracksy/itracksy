import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[80vh] sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Feedback</DialogTitle>
          <DialogDescription>
            We value your input. Please share your thoughts with us.
          </DialogDescription>
        </DialogHeader>
        <div className="h-full overflow-auto">
          <iframe
            src="https://www.itracksy.com/feedback"
            className="h-[calc(80vh-100px)] w-full"
            title="Feedback Form"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
