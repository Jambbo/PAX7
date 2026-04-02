import React, { useState, useEffect } from "react";
import {
    Menu,
    X,
    Home,
    MessageSquare,
    Users,
    TrendingUp,
    Bookmark,
    Bell,
    Settings,
    LogOut,
    Plus,
    Hash,
    Calendar,
    Lock
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { useSelector } from "react-redux";
import { RootState } from "../../../app/layout/store";
import { logout } from "../../../features/Auth/authService";
import { AuthModal } from "../../AuthModal/AuthModal";
import { HashtagModal } from "./HashtagModal";

interface SidebarProps {
    isOpen: boolean;
    toggleMenu: () => void;
    isAuthenticated: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleMenu, isAuthenticated }) => {
    const [activeItem, setActiveItem] = useState("home");
    const [authModal, setAuthModal] = useState({ isOpen: false, title: "", message: "" });
    const [isHashtagModalOpen, setIsHashtagModalOpen] = useState(false);
    const location = useLocation();

    const [customLinks, setCustomLinks] = useState<string[]>(() => {
        const saved = localStorage.getItem('pax_quick_links');
        return saved ? JSON.parse(saved) : ["news", "gaming"];
    });

    const handleSaveLinks = (links: string[]) => {
        setCustomLinks(links);
        localStorage.setItem('pax_quick_links', JSON.stringify(links));
    };

    useEffect(() => {
        const pathSegment = location.pathname.split('/')[1];
        if (!pathSegment || pathSegment === 'home') {
            setActiveItem("home");
        } else {
            setActiveItem(pathSegment);
        }
    }, [location.pathname]);

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
    const unreadNotificationsCount = useSelector((state: RootState) => state.notifications?.unreadCount || 0);

    const menuItems = [
        { id: "home", icon: Home, label: "Home", badge: null, requiresAuth: false },
        { id: "messages", icon: MessageSquare, label: "Messages", badge: "24", requiresAuth: true, authMessage: "Please log in to view and send messages." },
        { id: "trending", icon: TrendingUp, label: "Trending", badge: 2, requiresAuth: false },
        { id: "groups", icon: Users, label: "Groups", badge: null, requiresAuth: false },
        { id: "bookmarks", icon: Bookmark, label: "Bookmarks", badge: null, requiresAuth: true, authMessage: "Please log in to view your saved bookmarks." },
        { id: "notifications", icon: Bell, label: "Notifications", badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : null, requiresAuth: true, authMessage: "Please log in to see your notifications." },
    ];


    const handleNavClick = (e: React.MouseEvent, item: any) => {
        if (item.requiresAuth && !isAuthenticated) {
            e.preventDefault();
            setAuthModal({
                isOpen: true,
                title: "Authentication Required",
                message: item.authMessage
            });
            return;
        }
        setActiveItem(item.id);
    };

    return (
        <>
            <div
                className={`
                    fixed top-16 left-0 h-[calc(100vh-4rem)] z-40 flex flex-col shadow-2xl transition-all duration-300
                    bg-white dark:bg-gray-950/95 backdrop-blur-xl border-r border-gray-200 dark:border-gray-800/50 text-gray-900 dark:text-white
                    ${isOpen ? "w-72" : "w-20"}
                `}
            >
                
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800/50">
                    {isOpen && (
                        <span className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Navigation
                        </span>
                    )}
                    <button
                        onClick={toggleMenu}
                        className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-300"
                    >
                        {isOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>

                
                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-800 scrollbar-track-transparent">
                    {menuItems.map((item) => (
                        <Link
                            to={item.requiresAuth && !isAuthenticated ? "#" : `/${item.id === 'home' ? '' : item.id}`}
                            key={item.id}
                            onClick={(e) => handleNavClick(e, item)}
                        >
                            <button
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative mb-1
                                    ${activeItem === item.id
                                    ? `bg-${accentColor}-600 text-white shadow-lg shadow-${accentColor}-500/20`
                                    : "hover:bg-gray-100 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                                }`
                                }
                            >
                                <item.icon size={20} className="flex-shrink-0" />
                                {isOpen && (
                                    <>
                                        <span className="flex-1 text-left text-sm font-medium">{item.label}</span>

                                        
                                        {item.requiresAuth && !isAuthenticated && (
                                            <Lock size={14} className="text-gray-400 dark:text-gray-500 mr-1" />
                                        )}

                                        {item.badge && (
                                            <span className={`text-white text-xs font-bold px-2 py-0.5 rounded-full bg-${accentColor}-500`}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </>
                                )}
                                {!isOpen && item.badge && (
                                    <span className={`absolute -top-1 -right-1 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full bg-${accentColor}-500`}>
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        </Link>
                    ))}

                    {isOpen && isAuthenticated && (
                        <>
                            
                            <div className="pt-6">
                                <div className="flex items-center justify-between px-3 mb-3">
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider">
                                        Quick Links
                                    </span>
                                    <button
                                        onClick={() => setIsHashtagModalOpen(true)}
                                        className={`text-gray-400 hover:text-${accentColor}-500 transition-colors`}
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    {customLinks.map((link) => (
                                        <Link
                                            to={`/trending?hashtag=${link}`}
                                            key={link}
                                            onClick={(e) => setActiveItem("trending")}
                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-200 group"
                                        >
                                            <Hash size={18} className={`flex-shrink-0 text-${accentColor}-500`} />
                                            <span className="text-sm">#{link}</span>
                                        </Link>
                                    ))}
                                    {customLinks.length === 0 && (
                                        <p className="px-3 text-xs text-gray-500 italic">No links added.</p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </nav>

                
                <div className="border-t border-gray-200 dark:border-gray-800/50 p-3 space-y-2">
                    <Link to="/settings" onClick={(e) => {
                        if (!isAuthenticated) {
                            e.preventDefault();
                            setAuthModal({
                                isOpen: true,
                                title: "Authentication Required",
                                message: "Please log in to access your settings."
                            });
                        }
                    }}>
                        <button
                            onClick={() => isAuthenticated && setActiveItem("settings")}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200
                                ${activeItem === "settings"
                                ? "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white"
                                : "hover:bg-gray-100 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            }`
                            }
                        >
                            <Settings size={20} className="flex-shrink-0" />
                            {isOpen && (
                                <>
                                    <span className="text-sm font-medium flex-1 text-left">Settings</span>
                                    {!isAuthenticated && <Lock size={14} className="text-gray-400 dark:text-gray-500" />}
                                </>
                            )}
                        </button>
                    </Link>

                    
                    {isAuthenticated && (
                        <button onClick={logout}
                                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white transition-all duration-200 shadow-lg shadow-red-500/20"
                        >
                            <LogOut size={20} className="flex-shrink-0" />
                            {isOpen && <span className="text-sm font-medium">Logout</span>}
                        </button>
                    )}
                </div>
            </div>

            
            <AuthModal
                isOpen={authModal.isOpen}
                onClose={() => setAuthModal({ ...authModal, isOpen: false })}
                title={authModal.title}
                message={authModal.message}
            />

            <HashtagModal
                isOpen={isHashtagModalOpen}
                onClose={() => setIsHashtagModalOpen(false)}
                onSave={handleSaveLinks}
                currentLinks={customLinks}
                accentColor={accentColor}
            />
        </>
    );
};