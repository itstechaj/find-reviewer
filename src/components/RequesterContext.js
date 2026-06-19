'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';

const STORAGE_KEY = 'requesterEmail';

const RequesterContext = createContext(null);

export function useRequester() {
    const ctx = useContext(RequesterContext);
    if (!ctx) {
        throw new Error('useRequester must be used inside RequesterProvider');
    }
    return ctx;
}

export function RequesterProvider({ children }) {
    const [email, setEmailState] = useState(null);
    const [name, setName] = useState(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const stored = typeof window !== 'undefined'
            ? window.localStorage.getItem(STORAGE_KEY)
            : null;
        if (stored) setEmailState(stored);
        setLoaded(true);
    }, []);

    useEffect(() => {
        if (!email) {
            setName(null);
            return;
        }
        let cancelled = false;
        fetch(`/api/me?email=${encodeURIComponent(email)}`)
            .then((r) => r.json())
            .then((data) => {
                if (!cancelled) setName(data?.name || null);
            })
            .catch(() => { });
        return () => {
            cancelled = true;
        };
    }, [email]);

    const setEmail = useCallback((value) => {
        window.localStorage.setItem(STORAGE_KEY, value);
        setEmailState(value);
    }, []);

    const clearEmail = useCallback(() => {
        window.localStorage.removeItem(STORAGE_KEY);
        setEmailState(null);
        setName(null);
    }, []);

    return (
        <RequesterContext.Provider value={{ email, name, loaded, setEmail, clearEmail }}>
            {children}
        </RequesterContext.Provider>
    );
}
