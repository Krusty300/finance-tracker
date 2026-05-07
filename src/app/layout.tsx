import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { FormattingProvider } from "@/contexts/FormattingContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sprint Financial",
  description: "A personal finance app to track income, expenses, budgets, and visualize financial health",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme && ['light', 'dark', 'system'].includes(theme)) {
                    if (theme === 'system') {
                      var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                      document.documentElement.classList.add(systemTheme);
                    } else {
                      document.documentElement.classList.add(theme);
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider>
          <CurrencyProvider>
            <FormattingProvider>
              <OnboardingProvider>
                {children}
                <Toaster />
              </OnboardingProvider>
            </FormattingProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
