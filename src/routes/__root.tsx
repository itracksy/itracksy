import { useToast } from "@/hooks/use-toast";
import BaseLayout from "@/layouts/BaseLayout";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { ConfirmationDialogProvider } from "@/components/providers/ConfirmationDialog";

export const RootRoute = createRootRoute({
  component: Root,
  errorComponent: ({ error }) => {
    const { toast } = useToast();
    const err = error as Error;
    console.log("show toast", err);
    toast({
      variant: "destructive",
      title: "Error",
      description: err.message,
    });
    return <Root />;
  },
});

function Root() {
  return (
    <ConfirmationDialogProvider>
      <BaseLayout>
        <Outlet />
      </BaseLayout>
    </ConfirmationDialogProvider>
  );
}
