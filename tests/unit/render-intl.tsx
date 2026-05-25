import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import en from "@/messages/en.json";

/**
 * Render a component inside the EN next-intl provider, so components calling
 * `useTranslations` work in unit tests. Uses the real message bundle, which
 * also guards against missing keys.
 */
export function renderIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      {ui}
    </NextIntlClientProvider>,
  );
}
