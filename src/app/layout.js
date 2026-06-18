import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'FindReviewer - Smart Reviewer Assignment',
  description: 'Intelligently find and assign reviewers for PRs, solutioning, and go-live reviews across your engineering teams.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
