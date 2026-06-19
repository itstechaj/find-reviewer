import './globals.css';
import Navbar from '@/components/Navbar';
import EmailGate from '@/components/EmailGate';
import { RequesterProvider } from '@/components/RequesterContext';

export const metadata = {
  title: 'FindReviewer - Smart Reviewer Assignment',
  description: 'Intelligently find and assign reviewers for PRs, solutioning, and go-live reviews across your engineering teams.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <RequesterProvider>
          <Navbar />
          <EmailGate>
            <main>{children}</main>
          </EmailGate>
        </RequesterProvider>
      </body>
    </html>
  );
}
