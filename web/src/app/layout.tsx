import type { Metadata, Viewport } from 'next';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/dm-mono/400.css';
import './globals.css';
import { AppProvider } from '@/components/AppProvider';
import { Shell } from '@/components/Shell';

export const metadata: Metadata = {
  title: 'Embed Studios — Client portal',
  description: 'Follow your project with Embed Studios: progress, approvals, new scope, quotes, invoices and messages.',
  robots: { index: false, follow: false },
  icons: { icon: '/favicon.png' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#fafafa', viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <Shell>{children}</Shell>
        </AppProvider>
      </body>
    </html>
  );
}
