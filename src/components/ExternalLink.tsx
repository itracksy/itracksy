import { ReactNode } from "react";
import { trpcClient } from "@/utils/trpc";
import { ExternalLinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExternalLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  showIcon?: boolean;
  iconClassName?: string;
  iconPosition?: "left" | "right";
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * ExternalLink component for safely opening links in the default browser
 * via Electron's shell API through a tRPC procedure.
 */
export function ExternalLink({
  href,
  children,
  className = "",
  showIcon = true,
  iconClassName = "h-4 w-4",
  iconPosition = "right",
  onClick,
}: ExternalLinkProps) {
  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    // Call user-defined onClick if provided
    if (onClick) {
      onClick(e);
    }

    try {
      await trpcClient.utils.openExternalUrl.mutate({ url: href });
    } catch (error) {
      console.error("Failed to open external link:", error);
      // Fallback to standard link behavior if tRPC fails
      window.open(href, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <a
      href={href}
      className={cn("inline-flex items-center hover:underline", className)}
      onClick={handleClick}
      rel="noopener noreferrer"
    >
      {showIcon && iconPosition === "left" && (
        <ExternalLinkIcon className={cn("mr-1", iconClassName)} />
      )}

      {children}

      {showIcon && iconPosition === "right" && (
        <ExternalLinkIcon className={cn("ml-1", iconClassName)} />
      )}
    </a>
  );
}
