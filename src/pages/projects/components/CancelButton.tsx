import { forwardRef } from "react";

export const CancelButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>((props, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      tabIndex={0}
      {...props}
      className="rounded-lg p-2 text-left text-sm font-medium hover:bg-slate-200 focus:bg-slate-200"
    />
  );
});
