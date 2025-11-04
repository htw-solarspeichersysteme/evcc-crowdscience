import { cn } from "~/lib/utils";

export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40mm"
      height="40mm"
      viewBox="0 0 113.4 113.4"
      className={cn("text-primary size-8", className)}
    >
      <path
        fill="currentColor"
        d="M52.65,77.44l9.4-17.6h-5l5-10.1h-7.6l-6.3,15.1h6.3l-1.9,12.6h.1Z"
      />
      <path
        fill="currentColor"
        d="M106.3,62.9v-9h-23.2c-.7-3.9-2.2-7.6-4.5-10.9l16.4-16.4-6.4-6.4-16.4,16.4c-3.3-2.3-7-3.8-10.9-4.5V8.8h-9v23.2c-3.9.7-7.6,2.2-10.9,4.5l-16.4-16.4-6.4,6.4,16.4,16.4c-2.3,3.2-3.8,7-4.5,10.9H7.1v9.1h32.5c-2.5-9.4,3.1-19.1,12.5-21.6s19.1,3.1,21.6,12.5c2,7.7-1.3,15.8-8.2,19.8l6.5,6.5,16.4,16.4,6.4-6.4-16.4-16.4c2.3-3.2,3.8-7,4.5-10.9h23.2l.2.1Z"
      />
    </svg>
  );
}

export function EVCCLogoIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={cn("-mb-0.5 -ml-[1px] size-8 p-0.5", className)}
      width="16.91"
      height="33.81"
      viewBox="0 0 16.91 33.81"
    >
      <path
        fill="#0fdd42"
        d="M7.68,0h9.22l-6.14,12.3h6.15l-11.53,21.51,2.3-15.36H0L7.68,0Z"
      />
    </svg>
  );
}
