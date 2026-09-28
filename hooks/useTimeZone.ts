import { useSyncExternalStore } from "react";

const subscribe = () => () => {}; // the timezone never changes while the page is open
const getTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const getServerTimeZone = () => null; // the server does not know the viewer's timezone

// The viewer's IANA timezone, e.g. "Asia/Kolkata". It is null during server
// rendering and the first hydration pass, so the HTML from the server and
// the browser's first render always match.
export function useTimeZone(): string | null {
  return useSyncExternalStore(subscribe, getTimeZone, getServerTimeZone);
}
