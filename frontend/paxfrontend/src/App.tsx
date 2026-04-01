import {Outlet} from 'react-router-dom';
import React, {useState, useEffect} from 'react';
import {Header} from "./widgets/header";
import {Sidebar} from "./widgets/sidebar";
import {useTokenRefresh} from "./features/Auth/useTokenRefresh";
import {useAuth} from "./features/Auth/useAuth";

const App: React.FC = () => {
    useTokenRefresh();
    const {authenticated} = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        const savedTheme = localStorage.getItem('site_theme') || 'Dark';
        const root = window.document.documentElement;

        root.classList.remove('dark');

        if (savedTheme === 'Dark') {
            root.classList.add('dark');
        } else if (savedTheme === 'Auto') {
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                root.classList.add('dark');
            }
        }
    }, []);

    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

    return (
        <div
            className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-300">

            <Header isAuthenticated={authenticated}/>

            <Sidebar
                isOpen={isSidebarOpen}
                toggleMenu={toggleSidebar}
                isAuthenticated={authenticated}
            />

            <main
                className={`transition-all duration-300 pt-16 ${
                    isSidebarOpen ? 'ml-72' : 'ml-20'
                }`}
            >
                <div className="p-6">
                    <Outlet/>
                </div>
            </main>
        </div>
    );
};

export default App;