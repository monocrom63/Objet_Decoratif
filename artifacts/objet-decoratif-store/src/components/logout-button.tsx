import { useState } from "react";
import { useClerk } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function LogoutButton({
  className = "header-action",
  label = "Log out",
  pendingLabel = "Logging out…",
  testId = "button-logout",
}: {
  className?: string;
  label?: string;
  pendingLabel?: string;
  testId?: string;
}) {
  const { signOut } = useClerk();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);

  const handleLogout = async () => {
    if (pending) return;
    setPending(true);
    try {
      await signOut(() => {
        // Remove private account/admin data before returning to the public shop.
        queryClient.clear();
        window.location.assign(import.meta.env.BASE_URL);
      });
    } catch {
      setPending(false);
      toast({
        title: "Abmelden fehlgeschlagen",
        description: "Bitte versuche es erneut. Du bist weiterhin angemeldet.",
        variant: "destructive",
      });
    }
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleLogout}
      disabled={pending}
      aria-busy={pending}
      data-testid={testId}
    >
      <LogOut size={14} strokeWidth={1.5} aria-hidden="true" />
      <span>{pending ? pendingLabel : label}</span>
    </button>
  );
}