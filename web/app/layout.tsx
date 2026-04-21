import type { ReactNode } from "react";
import { AppProviders } from "../components/AppProviders";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "ui-sans-serif, system-ui", padding: 0 }}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
