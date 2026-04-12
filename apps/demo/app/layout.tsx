import type { Metadata } from 'next';
import './globals.css';
import ThemeRegistry from './ThemeRegistry';

export const metadata: Metadata = {
  title: '@cp949/react-webcam demo',
  description: '학습형 웹캠 컴포넌트 데모',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
