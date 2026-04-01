import React, { useState, useEffect } from 'react';
import {
    User, Bell, Shield, Palette, Globe, Mail, Lock, Eye, EyeOff,
    Camera, Save, Moon, Sun, Monitor, Loader2, CheckCircle, AlertCircle, X
} from 'lucide-react';

// ПЕРЕВІР ШЛЯХИ!
import { fetchCurrentUser, updateUser } from '../../profile/userService';
import { AuthModal } from '../../../widgets/AuthModal/AuthModal';

export const SettingsPage: React.FC = () => {
    // --- СТЕЙТИ АВТОРИЗАЦІЇ ---
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    // --- СТЕЙТИ НАВІГАЦІЇ ТА UI ---
    const [activeTab, setActiveTab] = useState('appearance');

    // --- СТЕЙТ ДЛЯ ТОАСТ-СПОВІЩЕНЬ ---
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // --- СТЕЙТИ ДАНИХ ЮЗЕРА ---
    const [userData, setUserData] = useState<any>({
        username: "",
        email: "",
        bio: "",
        location: "",
        website: ""
    });
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // --- ЛОГІКА ТЕМ ТА КОЛЬОРІВ ---
    const [selectedTheme, setTheme] = useState(() => {
        return localStorage.getItem('site_theme') || 'Dark';
    });

    const [accentColor, setAccentColor] = useState(() => {
        const saved = localStorage.getItem('site_accent_color');
        const validColors = ['purple', 'blue', 'green', 'red', 'orange', 'pink', 'teal', 'indigo'];
        return (saved && validColors.includes(saved)) ? saved : 'purple';
    });

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Застосування теми
    useEffect(() => {
        localStorage.setItem('site_theme', selectedTheme);
        const root = window.document.documentElement;

        root.classList.remove('dark');

        if (selectedTheme === 'Dark') {
            root.classList.add('dark');
        } else if (selectedTheme === 'Auto') {
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                root.classList.add('dark');
            }
        }
    }, [selectedTheme]);

    // Застосування акцентного кольору
    useEffect(() => {
        localStorage.setItem('site_accent_color', accentColor);
        window.dispatchEvent(new Event('accent-color-change'));
    }, [accentColor]);

    // --- ЗАВАНТАЖЕННЯ ДАНИХ ЮЗЕРА АБО РЕЖИМ ГОСТЯ ---
    useEffect(() => {
        const token = localStorage.getItem("access_token");
        const hasToken = token && token !== "undefined";

        setIsLoggedIn(hasToken);

        if (!hasToken) {
            // Якщо це гість, залишаємо на Appearance
            setActiveTab('appearance');
            setIsLoading(false);
            return;
        }

        // Якщо юзер авторизований
        setActiveTab('profile');
        const loadSettings = async () => {
            setIsLoading(true);
            try {
                const data = await fetchCurrentUser();
                setUserData({
                    username: data.username || "",
                    email: data.email || "",
                    bio: data.bio || "",
                    location: data.location || "",
                    website: data.website || ""
                });
                setCurrentUserId(data.id);
            } catch (err) {
                console.error("Помилка завантаження налаштувань:", err);
                setIsLoggedIn(false);
                setActiveTab('appearance');
            } finally {
                setIsLoading(false);
            }
        };
        loadSettings();
    }, []);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSave = async () => {
        if (!currentUserId) return;
        setIsSaving(true);
        try {
            await updateUser(currentUserId, userData);
            showToast("Settings saved successfully!", "success");
        } catch (error) {
            showToast("Failed to save settings. Please try again.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    // ОБРОБНИК КЛІКІВ ПО ВКЛАДКАХ
    const handleTabClick = (tabId: string) => {
        if (!isLoggedIn && tabId !== 'appearance') {
            setIsAuthModalOpen(true); // Показуємо модалку для гостей
            return;
        }
        setActiveTab(tabId);
    };

    // ==================== РЕНДЕРИНГ ВКЛАДОК ====================

    const renderProfileTab = () => (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Public Profile</h3>
                <p className="text-sm text-gray-500">This information will be displayed publicly so be careful what you share.</p>
            </div>

            <div className="flex items-center gap-6 pb-6 border-b border-gray-200 dark:border-gray-800">
                <div className={`w-24 h-24 rounded-full bg-${accentColor}-100 dark:bg-${accentColor}-900/30 flex items-center justify-center text-${accentColor}-600 text-3xl font-bold relative group cursor-pointer border-2 border-transparent hover:border-${accentColor}-500 transition-all overflow-hidden`}>
                    {userData.username ? userData.username.charAt(0).toUpperCase() : "U"}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="text-white" size={24} />
                    </div>
                </div>
                <div>
                    <button className={`px-4 py-2 bg-${accentColor}-600 hover:bg-${accentColor}-700 text-white rounded-lg font-medium transition-colors text-sm mb-2`}>
                        Change Avatar
                    </button>
                    <p className="text-xs text-gray-500">JPG, GIF or PNG. 1MB max.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username</label>
                    <input
                        type="text"
                        value={userData.username}
                        onChange={(e) => setUserData({...userData, username: e.target.value})}
                        className={`w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-${accentColor}-500 outline-none transition-all`}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                    <input
                        type="email"
                        value={userData.email}
                        onChange={(e) => setUserData({...userData, email: e.target.value})}
                        className={`w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-${accentColor}-500 outline-none transition-all`}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</label>
                <textarea
                    value={userData.bio}
                    onChange={(e) => setUserData({...userData, bio: e.target.value})}
                    rows={4}
                    className={`w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-${accentColor}-500 outline-none transition-all resize-none`}
                    placeholder="Write a few sentences about yourself..."
                ></textarea>
                <p className="text-xs text-gray-500 mt-2">Brief description for your profile.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
                    <input
                        type="text"
                        value={userData.location}
                        onChange={(e) => setUserData({...userData, location: e.target.value})}
                        className={`w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-${accentColor}-500 outline-none transition-all`}
                        placeholder="e.g. New York, USA"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Website</label>
                    <input
                        type="url"
                        value={userData.website}
                        onChange={(e) => setUserData({...userData, website: e.target.value})}
                        className={`w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-${accentColor}-500 outline-none transition-all`}
                        placeholder="https://yourwebsite.com"
                    />
                </div>
            </div>
        </div>
    );

    const renderAppearanceTab = () => (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Appearance</h3>
                <p className="text-sm text-gray-500">Customize how PAX looks on your device.</p>
            </div>

            <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Theme</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['Light', 'Dark', 'Auto'].map((themeName) => (
                        <button
                            key={themeName}
                            onClick={() => setTheme(themeName)}
                            className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                                selectedTheme === themeName
                                    ? `border-${accentColor}-500 bg-${accentColor}-50 dark:bg-${accentColor}-900/20`
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                        >
                            {themeName === 'Light' && <Sun size={24} className={selectedTheme === 'Light' ? `text-${accentColor}-500` : 'text-gray-500'} />}
                            {themeName === 'Dark' && <Moon size={24} className={selectedTheme === 'Dark' ? `text-${accentColor}-500` : 'text-gray-500'} />}
                            {themeName === 'Auto' && <Monitor size={24} className={selectedTheme === 'Auto' ? `text-${accentColor}-500` : 'text-gray-500'} />}
                            <span className={`font-medium ${selectedTheme === themeName ? `text-${accentColor}-600 dark:text-${accentColor}-400` : 'text-gray-600 dark:text-gray-400'}`}>
                                {themeName}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">Accent Color</h4>
                <div className="flex flex-wrap gap-4">
                    {['purple', 'blue', 'green', 'red', 'orange', 'pink', 'teal', 'indigo'].map((color) => (
                        <button
                            key={color}
                            onClick={() => setAccentColor(color)}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${
                                accentColor === color ? 'ring-4 ring-offset-2 dark:ring-offset-gray-900 ring-' + color + '-500' : ''
                            } bg-${color}-500`}
                            aria-label={`Select ${color} color`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );

    const renderNotificationsTab = () => (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Notifications</h3>
                <p className="text-sm text-gray-500">Manage what alerts you receive and how.</p>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Email Notifications</h4>
                        <p className="text-sm text-gray-500">Receive daily summaries and updates.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-${accentColor}-600`}></div>
                    </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Push Notifications</h4>
                        <p className="text-sm text-gray-500">Get alerts instantly on your device.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-${accentColor}-600`}></div>
                    </label>
                </div>
            </div>
        </div>
    );

    const renderPrivacyTab = () => (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Privacy & Security</h3>
                <p className="text-sm text-gray-500">Manage your password and profile privacy.</p>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">Change Password</h4>
                <div className="space-y-4 max-w-md">
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                        <div className="relative">
                            <input
                                type={showCurrentPassword ? "text" : "password"}
                                className={`w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-10 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-${accentColor}-500 outline-none`}
                                placeholder="••••••••"
                            />
                            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? "text" : "password"}
                                className={`w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-10 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-${accentColor}-500 outline-none`}
                                placeholder="••••••••"
                            />
                            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Private Profile</h4>
                        <p className="text-sm text-gray-500">Only approved followers can see your posts.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-${accentColor}-600`}></div>
                    </label>
                </div>
            </div>
        </div>
    );

    const renderPreferencesTab = () => (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Preferences</h3>
                <p className="text-sm text-gray-500">Manage your language, timezone, and general app behavior.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Language</label>
                    <select className={`w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-${accentColor}-500 outline-none transition-all`}>
                        <option value="en">English (US)</option>
                        <option value="uk">Ukrainian</option>
                        <option value="es">Spanish</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Timezone</label>
                    <select className={`w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-${accentColor}-500 outline-none transition-all`}>
                        <option value="gmt">GMT (Greenwich Mean Time)</option>
                        <option value="est">EST (Eastern Standard Time)</option>
                        <option value="pst">PST (Pacific Standard Time)</option>
                        <option value="eet">EET (Eastern European Time)</option>
                    </select>
                </div>
            </div>
        </div>
    );

    const textMain = "text-gray-900 dark:text-white";
    const bgMain = "bg-white dark:bg-gray-900";

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 pt-20">
                <Loader2 className={`animate-spin text-${accentColor}-600`} size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 pb-10 transition-colors duration-300 relative">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className={`text-3xl font-black ${textMain} mb-2`}>Settings</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage your account settings and preferences.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar */}
                    <div className="w-full md:w-64 shrink-0">
                        <div className={`${bgMain} border border-gray-200 dark:border-gray-800 rounded-2xl p-2 shadow-sm sticky top-24`}>
                            <nav className="space-y-1">
                                {[
                                    { id: 'profile', icon: User, label: 'Profile' },
                                    { id: 'appearance', icon: Palette, label: 'Appearance' },
                                    { id: 'notifications', icon: Bell, label: 'Notifications' },
                                    { id: 'privacy', icon: Shield, label: 'Privacy & Security' },
                                    { id: 'preferences', icon: Globe, label: 'Preferences' },
                                ].map((item) => {
                                    // Перевірка: чи заблокована вкладка для гостя
                                    const isRestricted = !isLoggedIn && item.id !== 'appearance';

                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handleTabClick(item.id)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                                activeTab === item.id
                                                    ? `bg-${accentColor}-50 dark:bg-${accentColor}-900/20 text-${accentColor}-600 dark:text-${accentColor}-400`
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                            } ${isRestricted ? 'opacity-60 cursor-pointer' : ''}`}
                                        >
                                            <item.icon size={18} />
                                            <span className="flex-1 text-left">{item.label}</span>
                                            {isRestricted && <Lock size={14} className="text-gray-400" />}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1">
                        <div className={`${bgMain} border border-gray-200 dark:border-gray-800 rounded-2xl p-6 md:p-8 shadow-sm`}>
                            {activeTab === 'profile' && renderProfileTab()}
                            {activeTab === 'appearance' && renderAppearanceTab()}
                            {activeTab === 'notifications' && renderNotificationsTab()}
                            {activeTab === 'privacy' && renderPrivacyTab()}
                            {activeTab === 'preferences' && renderPreferencesTab()}
                        </div>

                        {/* Кнопки збереження показуються ТІЛЬКИ авторизованим юзерам */}
                        {isLoggedIn && (
                            <div className="mt-6 flex justify-end gap-3">
                                <button className={`px-6 py-3 bg-white border border-gray-200 hover:bg-gray-50 dark:bg-gray-800/50 dark:border-transparent dark:hover:bg-gray-700 dark:text-white ${textMain} rounded-lg transition-colors font-medium`}>
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className={`px-6 py-3 bg-gradient-to-r from-${accentColor}-600 to-indigo-600 hover:opacity-90 text-white rounded-lg transition-all shadow-lg shadow-${accentColor}-500/20 font-medium flex items-center gap-2 disabled:opacity-50`}
                                >
                                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                    Save Changes
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* === МОДАЛКА АВТОРИЗАЦІЇ === */}
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                title="Authentication Required"
                message="You need to log in to your account to change these settings."
            />

            {/* === СПЛИВАЮЧЕ ВІКНО (TOAST) === */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl animate-fadeIn border ${
                    toast.type === 'success'
                        ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/90 dark:border-green-800 dark:text-green-300'
                        : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/90 dark:border-red-800 dark:text-red-300'
                }`}>
                    {toast.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                    <span className="font-semibold text-sm mr-2">{toast.message}</span>
                    <button
                        onClick={() => setToast(null)}
                        className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};