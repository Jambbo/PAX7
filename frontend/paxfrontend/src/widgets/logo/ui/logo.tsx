import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";

export const Logo = () => {
    const [accentColor, setAccentColor] = useState(() => {
        return localStorage.getItem('site_accent_color') || 'purple';
    });

    useEffect(() => {
        const handleStorageChange = () => {
            setAccentColor(localStorage.getItem('site_accent_color') || 'purple');
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('accent-color-change', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('accent-color-change', handleStorageChange);
        };
    }, []);

    return (
        <Link
            to="/"
            className={`text-4xl font-bold text-${accentColor}-600 hover:text-${accentColor}-700 transition-colors`}
        >
            PAX
        </Link>
    )
}