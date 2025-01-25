import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogPortal,
  DialogTitle,
} from "@radix-ui/react-dialog";
import { useNavigate, useSearch } from "@tanstack/react-router";

import { cn } from "~/lib/utils";
import { DialogOverlay } from "./ui/dialog";

export function ImageModal() {
  const { imageModal: image } = useSearch({ from: "__root__" });
  const navigate = useNavigate();

  return (
    <Dialog
      open={!!image}
      onOpenChange={(state) => {
        if (!state) {
          void navigate({
            to: ".",
            search: (prev) => ({ ...prev, imageModal: undefined }),
          });
        }
      }}
    >
      <DialogTitle className="sr-only">Image</DialogTitle>
      <DialogDescription className="sr-only">{image}</DialogDescription>
      <DialogPortal>
        <DialogOverlay className="backdrop-blur-sm bg-transparent" />
        <DialogContent
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid max-w-lg translate-x-[-50%] translate-y-[-50%] border bg-background duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
            "flex flex-col h-full max-h-[90svh] w-full max-w-[90svw] md:max-h-[95svh] md:max-w-lg items-center gap-4 p-0 border-none overflow-hidden bg-transparent",
            "ring-offset-background focus-visible:outline-none",
          )}
        >
          <img
            src={image}
            alt={image}
            className="h-full w-auto min-h-0 object-contain"
          />
          <div className="flex gap-4 items-center"></div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
