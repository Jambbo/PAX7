import React, { useState, useEffect } from 'react';
import { X, Hash, Search, Plus, Trash2, ArrowUp } from 'lucide-react';

interface HashtagModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (hashtags: string[]) => void;
    currentLinks: string[];
    accentColor: string;
}

export const HashtagModal: React.FC<HashtagModalProps> = ({ isOpen, onClose, onSave, currentLinks, accentColor }) => {
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<string[]>(currentLinks);

    useEffect(() => {
        if (isOpen) {
            setSelected(currentLinks);
            setSearch("");
        }
    }, [isOpen, currentLinks]);

    const handleToggle = (tag: string) => {
        const cleanTag = tag.replace('#', '').toLowerCase();
        if (selected.includes(cleanTag)) {
            setSelected(selected.filter(t => t !== cleanTag));
        } else {
            if (selected.length >= 5) {
                alert("You can only choose up to 5 quick links.");
                return;
            }
            setSelected([...selected, cleanTag]);
        }
    };

    const handleSave = () => {
        onSave(selected);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                    <X size={24} />
                </button>

                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Hash className={`text-${accentColor}-500`} size={24} /> Edit Quick Links
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        Choose up to 5 hashtags to pin to your sidebar.
                    </p>
                </div>

                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Type a hashtag (e.g. gaming, news)..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={`w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 transition-all`}
                    />
                </div>

                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Selected ({selected.length}/5)</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm">
                        {selected.length === 0 && <span className="text-gray-400 italic">None selected</span>}
                        {selected.map(tag => (
                            <span key={tag} className={`flex items-center gap-1 bg-${accentColor}-100 dark:bg-${accentColor}-900/30 text-${accentColor}-700 dark:text-${accentColor}-300 px-3 py-1.5 rounded-full font-medium`}>
                                #{tag}
                                <button onClick={() => handleToggle(tag)} className="hover:text-red-500 transition-colors"><X size={14} /></button>
                            </span>
                        ))}
                    </div>
                </div>

                {search && (
                    <div className="mt-4">
                         <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Search Result</span>
                         <button
                            onClick={() => handleToggle(search)}
                            className={`w-full flex justify-between items-center px-4 py-3 rounded-xl border ${selected.includes(search.toLowerCase().replace('#', '')) ? `border-${accentColor}-500 bg-${accentColor}-50 dark:bg-${accentColor}-900/20` : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                         >
                            <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Hash size={16} />{search.toLowerCase().replace('#', '')}</span>
                            {selected.includes(search.toLowerCase().replace('#', '')) ? <X size={18} className="text-red-500" /> : <Plus size={18} className={`text-${accentColor}-500`} />}
                         </button>
                    </div>
                )}

                <div className="mt-6 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-medium transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSave} className={`flex-1 py-3 bg-${accentColor}-600 hover:bg-${accentColor}-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-${accentColor}-500/30`}>
                        Save Links
                    </button>
                </div>
            </div>
        </div>
    );
};
