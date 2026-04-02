import React, { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { login } from "../../features/Auth/authService";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
                                                        isOpen,
                                                        onClose,
                                                        title = "Authentication Required",
                                                        message = "You need to log in to your account to perform this action."
                                                    }) => {
    const [accentColor, setAccentColor] = useState(() => {
        return localStorage.getItem('site_accent_color') || 'purple';
    });

    useEffect(() => {
        const handleStorageChange = () => setAccentColor(localStorage.getItem('site_accent_color') || 'purple');
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('accent-color-change', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('accent-color-change', handleStorageChange);
        };
    }, []);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-zoomIn relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                    <X size={24} />
                </button>

                <div className="flex flex-col items-center text-center mt-4">
                    <div className={`w-16 h-16 bg-${accentColor}-100 dark:bg-${accentColor}-900/30 text-${accentColor}-600 rounded-full flex items-center justify-center mb-4`}>
                        <AlertCircle size={32} />
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {title}
                    </h3>

                    <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                        {message}
                    </p>

                    <div className="flex gap-3 w-full">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={login}
                            className={`flex-1 py-3 px-4 bg-${accentColor}-600 hover:bg-${accentColor}-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-${accentColor}-500/30`}
                        >
                            Log In
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};