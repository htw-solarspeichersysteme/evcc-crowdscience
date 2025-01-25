import { useRef } from "react";
import { UserRoundPen } from "lucide-react";

import { EVCCLogoIcon, LogoIcon } from "./logo";
import { AnimatedBeam, Circle } from "./ui/animated-beam";

export function DataFlowOverview() {
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
      className="relative flex h-[400px] w-full items-center justify-center overflow-hidden md:h-[500px] md:p-10"
      ref={containerRef}
    >
      <div className="flex size-full flex-col max-w-2xl items-stretch justify-between md:gap-4 lg:max-w-5xl">
        {Array.from({ length: evccCount }, (_, i) => (
          <div className="flex flex-row items-center justify-between" key={i}>
            <Circle ref={refs[i + 1]} className="bg-black">
              <EVCCLogoIcon />
            </Circle>
            {i == Math.floor(evccCount / 2) && (
              <Circle
                ref={refs[0]}
                className="size-20 -my-20 md:size-32 md:-my-32"
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
