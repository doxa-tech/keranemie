import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { isLocale, localeCookie, localeFromAcceptLanguage } from "./config";

// The locale isn't in the URL: it comes from the cookie set by the language
// switch, else from the device language.
export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get(localeCookie)?.value;
  const locale = isLocale(cookieLocale)
    ? cookieLocale
    : localeFromAcceptLanguage((await headers()).get("accept-language"));

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
