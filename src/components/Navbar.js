'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const pathname = usePathname();

    return (
        <nav className="navbar">
            <Link href="/" className="navbar-brand">
                <span className="brand-icon">🔍</span>
                <span>FindReviewer</span>
            </Link>
            <div className="navbar-links">
                <Link href="/" className={pathname === '/' ? 'active' : ''}>
                    Review
                </Link>
                <Link href="/admin" className={pathname === '/admin' ? 'active' : ''}>
                    Admin
                </Link>
                <Link href="/analytics" className={pathname === '/analytics' ? 'active' : ''}>
                    Analytics
                </Link>
            </div>
        </nav>
    );
}
