import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import {
  isLocale,
  isTimeZone,
  localeCookie,
  localeFromAcceptLanguage,
  timeZoneCookie,
} from "./config";

// The locale isn't in the URL: it comes from the cookie set by the language
// switch, else from the device language. The time zone comes from a cookie
// set by the browser (see TimeZoneSync), so dates render in local time.
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(localeCookie)?.value;
  const locale = isLocale(cookieLocale)
    ? cookieLocale
    : localeFromAcceptLanguage((await headers()).get("accept-language"));
  const cookieTimeZone = cookieStore.get(timeZoneCookie)?.value;

  return {
    locale,
    timeZone: isTimeZone(cookieTimeZone) ? cookieTimeZone : "UTC",
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
