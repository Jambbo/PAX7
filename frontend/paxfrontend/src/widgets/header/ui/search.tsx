import React, {useEffect, useRef, useState} from 'react'
import {FaSearch} from "react-icons/fa";

export const Search = () => {

    const [active, setActive] = useState(false)
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [inputValue, setInputValue] = useState<string>('')

    // --- ЛОГІКА КОЛЬОРІВ ---
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
    // -----------------------

    useEffect(()=>{
        if(active && inputRef.current){
            inputRef.current.focus()
        }
    },[active])

    const resetInput = () => {
        setActive(false)
        setInputValue('')
        if (inputRef.current) {
            inputRef.current?.blur()
        }
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        switch (event.key) {
            case 'Enter':
                resetInput()
                break
            case 'Escape':
                setActive(false)
                break
        }
    }

    return (
        <div className="relative flex items-center">
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
                onBlur={() => setActive(false)}
            />

            {/* Search icon (clickable when closed) */}
            {!active && (
                <button
                    type='button'
                    onClick={active ? resetInput : () => setActive(!active)}
                    // Тут ми використовуємо динамічний колір для іконки
                    className={`absolute left-0 w-[43px] h-[43px] flex items-center justify-center text-${accentColor}-600 hover:text-${accentColor}-800 transition-colors`}
                    aria-label="Open search bar"
                >
                    <FaSearch size={30} />
                </button>
            )}
        </div>
    )
}