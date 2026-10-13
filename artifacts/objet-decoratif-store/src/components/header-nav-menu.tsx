import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function HeaderNavMenu({
  label,
  testId,
  open,
  onOpenChange,
  children,
}: {
  label: string;
  testId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openedByHover = useRef(false);

  const cancelClose = () => {
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  useEffect(() => {
    if (!open && closeTimer.current !== null) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    return () => {
      if (closeTimer.current !== null) clearTimeout(closeTimer.current);
    };
  }, [open]);

  const openOnHover = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    cancelClose();
    openedByHover.current = true;
    onOpenChange(true);
  };

  const closeOnLeave = (event: PointerEvent) => {
    if (event.pointerType !== "mouse" || !openedByHover.current) return;
    cancelClose();
    // Allow crossing the small gap between the trigger and the portal.
    closeTimer.current = setTimeout(() => onOpenChange(false), 180);
  };

  const keepKeyboardAccess = () => {
    openedByHover.current = false;
    cancelClose();
  };

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="nav-link header-nav-trigger"
          data-testid={testId}
          onPointerEnter={openOnHover}
          onPointerLeave={closeOnLeave}
          onKeyDownCapture={keepKeyboardAccess}
        >
          {label} <ChevronDown size={11} aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="header-nav-menu"
        align="start"
        sideOffset={12}
        aria-label={label}
        onPointerEnter={cancelClose}
        onPointerLeave={closeOnLeave}
        onKeyDownCapture={keepKeyboardAccess}
        onCloseAutoFocus={(event) => {
          if (openedByHover.current) event.preventDefault();
        }}
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
