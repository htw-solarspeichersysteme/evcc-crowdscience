import React, { forwardRef, type JSX } from "react";

import { cn } from "~/lib/utils";

// Reusable helper to create components with consistent structure
const createComponent = <T extends HTMLElement>(
  tag: keyof JSX.IntrinsicElements,
  defaultClassName: string,
  displayName: string,
) => {
  const Component = forwardRef<T, React.HTMLAttributes<T>>((props, ref) => {
    return React.createElement(
      tag,
      { ...props, ref, className: cn(defaultClassName, props.className) },
      props.children,
    );
  });
  Component.displayName = displayName;
  return Component;
};

export const H1 = createComponent<HTMLHeadingElement>(
  "h1",
  "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-4",
  "H1",
);

export const PageTitle = createComponent<HTMLHeadingElement>(
  "h1",
  "scroll-m-20 text-4xl font-bold tracking-tight mb-6",
  "PageTitle",
);

export const H2 = createComponent<HTMLHeadingElement>(
  "h2",
  "scroll-m-20 text-3xl font-semibold tracking-tight mt-8 mb-3 first:mt-0",
  "H2",
);

export const H3 = createComponent<HTMLHeadingElement>(
  "h3",
  "scroll-m-20 text-2xl font-semibold tracking-tight mt-6 mb-2",
  "H3",
);

export const H4 = createComponent<HTMLHeadingElement>(
  "h4",
  "scroll-m-20 text-xl font-semibold tracking-tight mt-4 mb-2",
  "H4",
);

export const Lead = createComponent<HTMLParagraphElement>(
  "p",
  "text-xl text-muted-foreground mb-4",
  "Lead",
);

export const P = createComponent<HTMLParagraphElement>(
  "p",
  "leading-7 [&:not(:first-child)]:mt-3",
  "P",
);

export const Large = createComponent<HTMLDivElement>(
  "div",
  "text-lg font-semibold mb-2",
  "Large",
);

export const Small = createComponent<HTMLParagraphElement>(
  "p",
  "text-sm font-medium leading-none mb-1",
  "Small",
);

export const Muted = createComponent<HTMLSpanElement>(
  "span",
  "text-sm text-muted-foreground",
  "Muted",
);

export const InlineCode = createComponent<HTMLSpanElement>(
  "code",
  "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold inline-block mx-0.5",
  "InlineCode",
);

export const MultilineCode = createComponent<HTMLPreElement>(
  "pre",
  "relative rounded bg-muted p-4 font-mono text-sm font-semibold overflow-x-auto my-3",
  "MultilineCode",
);

export const List = createComponent<HTMLUListElement>(
  "ul",
  "my-4 ml-6 list-disc space-y-2 [&>li]:mt-2",
  "List",
);

export const Quote = createComponent<HTMLQuoteElement>(
  "blockquote",
  "mt-4 mb-4 border-l-2 pl-6 italic text-muted-foreground",
  "Quote",
);
