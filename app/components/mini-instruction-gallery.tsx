import { Link } from "@tanstack/react-router";
import type { ClassValue } from "clsx";

import { cn } from "~/lib/utils";

export function ImageThumbnail({
  image,
  alt,
  className,
}: {
  image: string;
  alt: string;
  className?: ClassValue;
}) {
  return (
    <Link
      to={"."}
      search={(prev) => ({ ...prev, imageModal: image })}
      className="ring-offset-background rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <img
        src={image}
        alt={alt}
        className={cn("size-full rounded-md object-cover", className)}
      />
    </Link>
  );
}

export function MiniInstructionGallery({
  steps,
  className,
}: {
  steps: {
    title: string;
    image: string;
    className?: ClassValue;
  }[];
  className?: ClassValue;
}) {
  return (
    <>
      <div className={cn("grid gap-2 w-full", className)}>
        {steps.map((step) => (
          <div key={step.title} className="flex flex-col gap-2">
            <ImageThumbnail
              image={step.image}
              alt={step.title}
              className={step.className}
            />
          </div>
        ))}
      </div>
    </>
  );
}
