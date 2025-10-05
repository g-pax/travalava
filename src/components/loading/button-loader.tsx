import { Button } from "@/components/ui/button";
import { Spinner } from "./spinner";
import { cn } from "@/lib/utils";

interface LoadingButtonProps extends React.ComponentProps<typeof Button> {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function LoadingButton({
  loading = false,
  loadingText,
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={disabled || loading}
      className={cn("relative", className)}
      {...props}
    >
      {loading && (
        <Spinner size="sm" className="mr-2" />
      )}
      {loading && loadingText ? loadingText : children}
    </Button>
  );
}

interface ActionButtonProps extends React.ComponentProps<typeof Button> {
  isPending?: boolean;
  pendingText?: string;
  children: React.ReactNode;
}

export function ActionButton({
  isPending = false,
  pendingText,
  children,
  disabled,
  ...props
}: ActionButtonProps) {
  return (
    <LoadingButton
      loading={isPending}
      loadingText={pendingText}
      disabled={disabled}
      {...props}
    >
      {children}
    </LoadingButton>
  );
}