import React, {
    FC,
    useEffect,
    useState,
    FormEvent,
    ChangeEvent,
} from "react";
import {
    Globe,
    Lock,
    Eye,
    Gamepad2,
    Book,
    Music,
    Dumbbell,
    Palette,
    Briefcase,
    X,
    Laptop,
    Camera,
    Utensils,
    Bitcoin,
    Rocket
} from "lucide-react";

import { CreateCommunityFormData } from "../model/types";

interface CreateCommunityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateCommunityFormData) => void | Promise<void>;
    isSubmitting?: boolean;
    serverError?: string | null;
}

export const CreateCommunityModal: FC<CreateCommunityModalProps> = ({
                                                                        isOpen,
                                                                        onClose,
                                                                        onSubmit,
                                                                        isSubmitting = false,
                                                                        serverError = null,
                                                                    }) => {
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

    const [form, setForm] = useState<CreateCommunityFormData>({
        name: "",
        description: "",
        visibility: "public",
        isNsfw: false,
        category: "General",
    });

    const [nameError, setNameError] = useState<string | null>(null);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setForm({
                name: "",
                description: "",
                visibility: "public",
                isNsfw: false,
                category: "General",
            });
            setNameError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange =
        (field: keyof CreateCommunityFormData) =>
            (
                e: ChangeEvent<
                    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
                >
            ) => {
                if (field === "isNsfw") {
                    const input = e.target as HTMLInputElement;
                    setForm((prev) => ({ ...prev, isNsfw: input.checked }));
                    return;
                }

                const value = e.target.value;
                setForm((prev) => ({ ...prev, [field]: value as any }));

                if (field === "name" && nameError) {
                    setNameError(null);
                }
            };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!form.name.trim()) {
            setNameError("Community name is required");
            return;
        }

        onSubmit({
            ...form,
            name: form.name.trim(),
            description: form.description.trim(),
        });
    };

    const categories = [
        { label: "General", icon: <Globe size={16} /> },
        { label: "Gaming", icon: <Gamepad2 size={16} /> },
        { label: "Art & Design", icon: <Palette size={16} /> },
        { label: "Music", icon: <Music size={16} /> },
        { label: "Study", icon: <Book size={16} /> },
        { label: "Technology", icon: <Laptop size={16} /> },
        { label: "Finance", icon: <Briefcase size={16} /> },
        { label: "Sports", icon: <Dumbbell size={16} /> },
        { label: "Movies", icon: <Eye size={16} /> },
        { label: "Crypto", icon: <Bitcoin size={16} /> },
        { label: "Photography", icon: <Camera size={16} /> },
        { label: "Cooking", icon: <Utensils size={16} /> },
        { label: "Startups", icon: <Rocket size={16} /> },
    ];

    const visibilityOptions = [
        {
            value: "public",
            label: "Public",
            description: "Visible to everyone",
            icon: <Globe size={18} />,
        },
        {
            value: "private",
            label: "Private",
            description: "Join request required",
            icon: <Lock size={18} />,
        },
        {
            value: "hidden",
            label: "Hidden",
            description: "Invite only, not listed",
            icon: <Eye size={18} />,
        },
    ] as const;

    return (
        // Backdrop з високим Z-Index та розмиттям
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh] transition-all border border-gray-200 dark:border-gray-800"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Community</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Build a new space for people to connect</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* NAME */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Community name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={handleChange("name")}
                            placeholder="e.g. React Developers, Sunday Hikers..."
                            disabled={isSubmitting}
                            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all 
                                bg-gray-50 dark:bg-gray-800 
                                text-gray-900 dark:text-white
                                placeholder-gray-400 dark:placeholder-gray-500
                                ${nameError
                                ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                : `border-gray-200 dark:border-gray-700 focus:border-${accentColor}-500 focus:ring-2 focus:ring-${accentColor}-500/20`
                            }
                            `}
                        />
                        {nameError && (
                            <p className="text-xs text-red-500 font-medium">{nameError}</p>
                        )}
                    </div>

                    {/* DESCRIPTION */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                        <textarea
                            value={form.description}
                            onChange={handleChange("description")}
                            placeholder="What is this community about?"
                            disabled={isSubmitting}
                            className={`h-28 w-full resize-none rounded-xl border border-gray-200 dark:border-gray-700 
                                bg-gray-50 dark:bg-gray-800 
                                px-4 py-3 text-sm text-gray-900 dark:text-white 
                                placeholder-gray-400 dark:placeholder-gray-500
                                outline-none transition-all focus:border-${accentColor}-500 focus:ring-2 focus:ring-${accentColor}-500/20`}
                        />
                    </div>

                    {/* CATEGORY — GRID */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 pr-1">
                            {categories.map((c) => {
                                const active = form.category === c.label;
                                return (
                                    <button
                                        type="button"
                                        key={c.label}
                                        disabled={isSubmitting}
                                        onClick={() =>
                                            setForm((prev) => ({ ...prev, category: c.label }))
                                        }
                                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all text-sm font-medium ${
                                            active
                                                ? `bg-${accentColor}-600 border-${accentColor}-600 text-white shadow-md shadow-${accentColor}-500/20`
                                                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                        }`}
                                    >
                                        {c.icon}
                                        <span className="truncate">{c.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* VISIBILITY */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Visibility</label>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            {visibilityOptions.map((option) => {
                                const active = form.visibility === option.value;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={() =>
                                            setForm((prev) => ({
                                                ...prev,
                                                visibility: option.value,
                                            }))
                                        }
                                        className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
                                            active
                                                ? `border-${accentColor}-500 bg-${accentColor}-50 dark:bg-${accentColor}-900/20 ring-1 ring-${accentColor}-500`
                                                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750"
                                        }`}
                                    >
                                        <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${
                                            active
                                                ? `bg-${accentColor}-600 text-white`
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                        }`}>
                                            {option.icon}
                                        </div>
                                        <span className={`text-sm font-semibold mb-0.5 ${active ? `text-${accentColor}-900 dark:text-${accentColor}-100` : 'text-gray-900 dark:text-white'}`}>
                                            {option.label}
                                        </span>
                                        <span className={`text-xs ${active ? `text-${accentColor}-700 dark:text-${accentColor}-300` : 'text-gray-500 dark:text-gray-400'}`}>
                                            {option.description}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* NSFW Checkbox */}
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                id="nsfw-check"
                                checked={form.isNsfw}
                                onChange={handleChange("isNsfw")}
                                disabled={isSubmitting}
                                className={`h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-${accentColor}-600 focus:ring-${accentColor}-500 cursor-pointer`}
                            />
                        </div>
                        <label htmlFor="nsfw-check" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                            NSFW Content (18+)
                        </label>
                    </div>

                    {/* SERVER ERROR */}
                    {serverError && (
                        <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"/>
                            {serverError}
                        </div>
                    )}

                    {/* BUTTONS */}
                    <div className="pt-2 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="rounded-lg px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`rounded-lg px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all disabled:opacity-50
                                bg-gradient-to-r from-${accentColor}-600 to-indigo-600 hover:from-${accentColor}-700 hover:to-indigo-700 shadow-${accentColor}-500/20
                            `}
                        >
                            {isSubmitting ? "Creating..." : "Create Community"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};