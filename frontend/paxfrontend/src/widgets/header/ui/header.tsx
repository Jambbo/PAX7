import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Search } from "./search";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";
import { login } from "../../../features/Auth/authService";

interface HeaderProps {
    isAuthenticated: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isAuthenticated }) => {
    const [accentColor, setAccentColor] = useState(() => {
        return localStorage.getItem('site_accent_color') || 'purple';
    });

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Логіка виходу з акаунту
    const handleLogout = () => {
        localStorage.removeItem("access_token");
        window.location.href = "/";
    };

    return (
        <header className="fixed z-50 top-0 w-full h-16 bg-white dark:bg-gray-950 text-gray-900 dark:text-white shadow-lg transition-colors duration-300">
            <div className="px-6 h-full flex items-center justify-between">

                <Link
                    to="/"
                    className={`text-4xl font-bold bg-gradient-to-r from-${accentColor}-600 to-indigo-600 bg-clip-text text-transparent ml-16`}
                >
                    PAX
                </Link>

                <div className="md:block hidden flex-1 ml-48 mr-auto items-center">
                    <Search />
                </div>

                <div className="hidden md:flex space-x-3 items-center">

                    {!isAuthenticated && (
                        <>
                            <Link
                                onClick={login}
                                to="/signin"
                                className={`px-4 py-2 border border-${accentColor}-600 text-${accentColor}-600 rounded-lg hover:bg-${accentColor}-50 dark:hover:bg-${accentColor}-900/20 transition`}
                            >
                                Sign In
                            </Link>
                            <Link
                                onClick={login}
                                to="/signup"
                                className={`px-4 py-2 bg-${accentColor}-600 text-white rounded-lg hover:opacity-90 transition`}
                            >
                                Sign Up
                            </Link>
                        </>
                    )}

                    {isAuthenticated && (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${isDropdownOpen ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                            >
                                <div className={`w-8 h-8 bg-${accentColor}-600 rounded-full flex items-center justify-center text-white`}>
                                    <User size={20} />
                                </div>
                                <span className="text-sm font-medium">My Profile</span>
                                <ChevronDown size={16} className={`text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Тіло випадаючого меню */}
                            {isDropdownOpen && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl py-2 z-50 animate-fadeIn overflow-hidden">
                                    <Link
                                        to="/profile"
                                        onClick={() => setIsDropdownOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <User size={18} className="text-gray-400" />
                                        <span className="font-medium">Profile</span>
                                    </Link>

                                    <Link
                                        to="/settings"
                                        onClick={() => setIsDropdownOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <Settings size={18} className="text-gray-400" />
                                        <span className="font-medium">Settings</span>
                                    </Link>

                                    <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-4"></div>

                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left"
                                    >
                                        <LogOut size={18} className="text-red-500" />
                                        <span className="font-medium">Log out</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Mobile menu icon */}
                <button className={`md:hidden flex items-center text-gray-900 dark:text-white hover:text-${accentColor}-600 transition`}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>
        </header>
    );
};