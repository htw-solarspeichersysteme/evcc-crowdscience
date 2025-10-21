export function isUuidV7(str: string): boolean {
  // RFC 9562 UUIDv7: xxxxxxxx-xxxx-7xxx-[89ab]xxx-xxxxxxxxxxxx
  const re =
    /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return re.test(str);
}
