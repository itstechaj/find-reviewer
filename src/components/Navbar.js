'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRequester } from './RequesterContext';

export default function Navbar() {
    const pathname = usePathname();
    const { email, name, loaded, clearEmail } = useRequester();

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
            <div className="navbar-identity">
                {loaded && email ? (
                    <>
                        <div className="identity-text">
                            <span className="identity-name">{name || email}</span>
                            {name && <span className="identity-email">{email}</span>}
                        </div>
                        <button
                            type="button"
                            className="identity-change"
                            onClick={clearEmail}
                            title="Change email"
                        >
                            Change
                        </button>
                    </>
                ) : null}
            </div>
        </nav>
    );
}
