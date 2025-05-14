import { useRef } from "react";
import { UserRoundPen } from "lucide-react";

import { cn } from "~/lib/utils";
import { EVCCLogoIcon, LogoIcon } from "./logo";
import { AnimatedBeam, Circle } from "./ui/animated-beam";

export function DataFlowOverview({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const evccCount = 5;
  const scientistCount = 3;

  const refs = Array.from({ length: evccCount + scientistCount + 1 }, () =>
    useRef<HTMLDivElement>(null),
  );

  const centerRef = refs[0];
  const evccRefs = refs.slice(1, evccCount + 1);
  const scientistRefs = refs.slice(
    evccCount + 1,
    evccCount + scientistCount + 1,
  );

  return (
    <div
      className={cn(
        "relative flex h-[350px] w-full items-center justify-center overflow-hidden md:h-[450px]",
        className,
      )}
      ref={containerRef}
    >
      <div className="flex flex-col items-stretch justify-between size-full md:gap-4">
        {Array.from({ length: evccCount }, (_, i) => (
          <div className="flex flex-row items-center justify-between" key={i}>
            <Circle ref={refs[i + 1]} className="bg-black">
              <EVCCLogoIcon />
            </Circle>
            {i == Math.floor(evccCount / 2) && (
              <Circle
                ref={refs[0]}
                className="-my-20 size-20 md:size-32 md:-my-32"
              >
                <LogoIcon className="size-12 md:size-16" />
              </Circle>
            )}
            {i !== 0 && i !== evccCount - 1 && (
              <Circle ref={refs[i + evccCount]}>
                <UserRoundPen className="-mr-[3px]" />
              </Circle>
            )}
          </div>
        ))}
      </div>
      {evccRefs.map((ref, i) => (
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={ref}
          toRef={centerRef}
          key={i}
        />
      ))}
      {scientistRefs.map((ref, i) => (
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={centerRef}
          toRef={ref}
          key={i}
        />
      ))}
    </div>
  );
}
