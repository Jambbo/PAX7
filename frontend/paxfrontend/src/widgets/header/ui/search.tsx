import React, {useEffect, useRef, useState} from 'react'
import {FaSearch} from "react-icons/fa";
import {apiClient} from "../../../shared/api/apiClient";
import {useNavigate} from "react-router-dom";

export interface GlobalSearchResponseDto {
    users: any[];
    groups: any[];
    posts: any[];
}

export const Search = () => {

    const [active, setActive] = useState(false)
    const inputRef = useRef<HTMLInputElement | null>(null)
    const wrapperRef = useRef<HTMLDivElement | null>(null)
    const [inputValue, setInputValue] = useState<string>('')
    const [results, setResults] = useState<GlobalSearchResponseDto | null>(null)
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'users' | 'groups' | 'posts'>('users')
    const navigate = useNavigate();

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

    useEffect(() => {
        if (inputValue.trim().length > 0) {
            setLoading(true);
            const debounceTimer = setTimeout(() => {
                apiClient.get(`/api/v1/search?query=${encodeURIComponent(inputValue)}`)
                    .then(res => {
                        setResults(res.data);
                    })
                    .catch(err => {
                        console.error('Search error', err);
                        setResults(null);
                    })
                    .finally(() => setLoading(false));
            }, 500);
            return () => clearTimeout(debounceTimer);
        } else {
            setResults(null);
            setLoading(false);
        }
    }, [inputValue]);

    useEffect(()=>{
        if(active && inputRef.current){
            inputRef.current.focus()
        }
    },[active])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setActive(false);
            }
        };

        if (active) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [active]);

    const resetInput = () => {
        setActive(false)
        setInputValue('')
        setResults(null)
        if (inputRef.current) {
            inputRef.current?.blur()
        }
    }

    const handleItemClick = (type: 'user' | 'group' | 'post', id: number) => {
        resetInput();
        if (type === 'user') {
            navigate(`/profile/${id}`);
        } else if (type === 'group') {
            navigate(`/groups/${id}`);
        } else if (type === 'post') {
            navigate(`/#post-${id}`); // scroll locally on home page
        }
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        switch (event.key) {
            case 'Enter':
                resetInput()
                break
            case 'Escape':
                setActive(false)
                if (inputRef.current) {
                    inputRef.current.blur()
                }
                break
        }
    }

    return (
        <div ref={wrapperRef} className="relative flex items-center">
            <input
                ref={inputRef}
                type='text'
                placeholder="What are you looking for?"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className={
                    `transition-all duration-300 rounded-2xl md:rounded-full 
                    placeholder-gray-500 dark:placeholder-gray-400 
                    text-gray-900 dark:text-white 
                    bg-transparent border-2 ` +
                    (active
                        ? `w-[600px] h-[43px] px-[10px] text-[16px] border-${accentColor}-600`
                        : 'w-[43px] h-[43px] p-0 text-[0px] border-transparent')
                }
                aria-label="Search input field"
                onFocus={()=>setActive(true)}
                onKeyDown={handleKeyDown}
            />

            {/* Search Dropdown Popup */}
            {active && inputValue.trim().length > 0 && (
                <div className="absolute top-[50px] left-0 right-0 w-full min-w-[300px] bg-white dark:bg-gray-800 rounded-b-2xl shadow-xl z-50 border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
                    <div className="flex border-b border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            className={`flex-1 py-2 text-sm font-semibold transition-colors ${activeTab === 'users' ? `text-${accentColor}-600 border-b-2 border-${accentColor}-600` : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                            onClick={(e) => {e.preventDefault(); e.stopPropagation(); setActiveTab('users');}}
                        >
                            Users
                        </button>
                        <button
                            type="button"
                            className={`flex-1 py-2 text-sm font-semibold transition-colors ${activeTab === 'groups' ? `text-${accentColor}-600 border-b-2 border-${accentColor}-600` : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                            onClick={(e) => {e.preventDefault(); e.stopPropagation(); setActiveTab('groups');}}
                        >
                            Groups
                        </button>
                        <button
                            type="button"
                            className={`flex-1 py-2 text-sm font-semibold transition-colors ${activeTab === 'posts' ? `text-${accentColor}-600 border-b-2 border-${accentColor}-600` : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                            onClick={(e) => {e.preventDefault(); e.stopPropagation(); setActiveTab('posts');}}
                        >
                            Posts
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[400px] p-2">
                        {loading && (
                            <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading...</div>
                        )}
                        {!loading && results && (
                            <>
                                {activeTab === 'users' && (
                                    results.users?.length > 0 ? (
                                        <ul className="flex flex-col gap-1">
                                            {results.users.map((user: any) => (
                                                <li key={user.id} onClick={() => handleItemClick('user', user.id)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded-lg flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                        {user.avatar ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-sm font-bold">{user.username?.charAt(0) || user.firstName?.charAt(0) || '?'}</span>}
                                                    </div>
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.firstName} {user.lastName}</span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">@{user.username}</span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">No users found for "{inputValue}"</div>
                                    )
                                )}

                                {activeTab === 'groups' && (
                                    results.groups?.length > 0 ? (
                                        <ul className="flex flex-col gap-1">
                                            {results.groups.map((group: any) => (
                                                <li key={group.id} onClick={() => handleItemClick('group', group.id)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded-lg flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-300 dark:bg-gray-600 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                        {group.avatar ? <img src={group.avatar} alt="group avatar" className="w-full h-full object-cover" /> : <span className="text-sm font-bold">{group.name?.charAt(0) || '?'}</span>}
                                                    </div>
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{group.name}</span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{group.description}</span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">No groups found for "{inputValue}"</div>
                                    )
                                )}

                                {activeTab === 'posts' && (
                                    results.posts?.length > 0 ? (
                                        <ul className="flex flex-col gap-1">
                                            {results.posts.map((post: any) => (
                                                <li key={post.id} onClick={() => handleItemClick('post', post.id)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded-lg flex flex-col gap-1">
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">{post.text || post.content}</span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">Post #{post.id}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">No posts found for "{inputValue}"</div>
                                    )
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Search icon (clickable when closed) */}
            {!active && (
                <button
                    type='button'
                    onClick={active ? resetInput : () => setActive(!active)}
                    className={`absolute left-0 w-[43px] h-[43px] flex items-center justify-center text-${accentColor}-600 hover:text-${accentColor}-800 transition-colors`}
                    aria-label="Open search bar"
                >
                    <FaSearch size={30} />
                </button>
            )}
        </div>
    )
}