import { SignInMethodDivider } from "@/components/SignInMethodDivider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { useAuthActions } from "@convex-dev/auth/react";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { GoogleLogo } from "@/components/GoogleLogo";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function SignInForm() {
  const [step, setStep] = useState<"signIn" | "linkSent">("signIn");
  const { signIn } = useAuthActions();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void signIn("anonymous");
  }, [signIn]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Sign In</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          {step === "signIn" ? (
            <DialogTitle>Sign in or create an account</DialogTitle>
          ) : (
            <DialogTitle>Check your email</DialogTitle>
          )}
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {step === "signIn" ? (
            <>
              <SignInWithGitHub />
              <Button
                className="flex-1"
                variant="outline"
                type="button"
                onClick={() => void signIn("google")}
              >
                <GoogleLogo className="mr-2 h-4 w-4" /> Google
              </Button>
              <SignInMethodDivider />
              <SignInWithMagicLink
                handleLinkSent={() => {
                  setStep("linkSent");
                }}
              />
            </>
          ) : (
            <>
              <p>A sign-in link has been sent to your email address.</p>
              <Button className="self-start p-0" variant="link" onClick={() => setStep("signIn")}>
                Cancel
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SignInWithGitHub() {
  const { signIn } = useAuthActions();
  return (
    <Button
      className="flex-1"
      variant="outline"
      type="button"
      onClick={() => void signIn("github")}
    >
      <GitHubLogoIcon className="mr-2 h-4 w-4" /> GitHub
    </Button>
  );
}

function SignInWithMagicLink({ handleLinkSent }: { handleLinkSent: () => void }) {
  const { signIn } = useAuthActions();
  const { toast } = useToast();
  return (
    <form
      className="flex flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        signIn("resend", formData)
          .then(handleLinkSent)
          .catch((error) => {
            console.error(error);
            toast({
              title: "Could not send sign-in link",
              variant: "destructive",
            });
          });
      }}
    >
      <label htmlFor="email">Email</label>
      <Input name="email" id="email" className="mb-4" autoComplete="email" />
      <Button type="submit">Send sign-in link</Button>
      <Toaster />
    </form>
  );
}
