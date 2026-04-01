import React, { useState, useEffect } from 'react';
import { Bookmark, Search, Loader2, MessageSquare, X, AlertTriangle } from 'lucide-react';
import { PostItem } from '../../main/PostItem'; // ПЕРЕВІР ШЛЯХ
import { Post, fetchBookmarks, likePost, deletePost, updatePost, removeBookmark } from '../../main/postServise'; // ПЕРЕВІР ШЛЯХ


interface ImageModalProps {
    imageUrl: string;
    onClose: () => void;
}
const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose }) => {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
                <X size={24} />
            </button>
            <img src={imageUrl} alt="Full size" className="max-w-full max-h-[90vh] rounded-lg shadow-2xl animate-zoomIn" onClick={e => e.stopPropagation()} />
        </div>
    );
};
// ----------------------------------

export const BookmarksPage = () => {
    const [accentColor, setAccentColor] = useState(() => localStorage.getItem('site_accent_color') || 'purple');

    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Стейт лайків та закладок (для відображення сердечок та прапорців)
    const [likedPosts, setLikedPosts] = useState<Set<number>>(() => {
        const saved = localStorage.getItem('pax_liked_posts');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const validIds = parsed.filter((id: any) => typeof id === 'number' && !isNaN(id));
                return new Set<number>(validIds);
            } catch (e) { return new Set<number>(); }
        }
        return new Set<number>();
    });

    // Модалки
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [postToDeleteId, setPostToDeleteId] = useState<number | null>(null);
    const [isDeletingPost, setIsDeletingPost] = useState(false);

    useEffect(() => {
        localStorage.setItem('pax_liked_posts', JSON.stringify(Array.from(likedPosts)));
    }, [likedPosts]);

    // ЗАВАНТАЖЕННЯ ЗАКЛАДОК З БЕКЕНДУ
    useEffect(() => {
        const loadBookmarks = async () => {
            setIsLoading(true);
            const token = localStorage.getItem("access_token");
            if (token && token !== "undefined") {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    setCurrentUserId(payload.sub);
                } catch (e) { console.error(e); }
            } else {
                setIsLoading(false);
                return; // Не авторизований
            }

            try {
                const data = await fetchBookmarks();
                setPosts(data.reverse()); // Найновіші збережені зверху

                // Також синхронізуємо localStorage для закладок
                const bookmarkedIds = data.map(p => p.id);
                localStorage.setItem('pax_saved_posts', JSON.stringify(bookmarkedIds));
            } catch (error) {
                console.error("Помилка завантаження закладок", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadBookmarks();
    }, []);

    // --- ОБРОБНИКИ ДІЙ ---
    const handleLike = async (postId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const isLiked = likedPosts.has(postId);

        if (isLiked) {
            setLikedPosts(prev => { const next = new Set(prev); next.delete(postId); return next; });
            setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: Math.max(0, p.likes - 1) } : p));
        } else {
            setLikedPosts(prev => new Set(prev).add(postId));
            setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
        }
        try { await likePost(postId); } catch (err) { console.error(err); }
    };

    const handleSaveToggle = async (postId: number, e: React.MouseEvent) => {
        e.stopPropagation();

        // Візуально миттєво прибираємо пост зі списку (Оптимістичний UI)
        setPosts(prev => prev.filter(p => p.id !== postId));

        // Оновлюємо localStorage
        const saved = localStorage.getItem('pax_saved_posts');
        if (saved) {
            try {
                let parsed = JSON.parse(saved);
                parsed = parsed.filter((id: number) => id !== postId);
                localStorage.setItem('pax_saved_posts', JSON.stringify(parsed));
            } catch (e) {}
        }

        try {
            await removeBookmark(postId);
        } catch (err) {
            console.error("Помилка видалення закладки", err);
        }
    };

    const handleSaveEdit = async (postId: number, newText: string) => {
        const updatedPost = await updatePost(postId, { id: postId, text: newText });
        setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));
    };

    const confirmDeletePost = async () => {
        if (postToDeleteId === null) return;
        setIsDeletingPost(true);
        try {
            await deletePost(postToDeleteId);
            setPosts(prev => prev.filter(p => p.id !== postToDeleteId));
            setPostToDeleteId(null);
        } catch (err) { alert("Помилка видалення."); }
        finally { setIsDeletingPost(false); }
    };

    const filteredPosts = posts.filter(post =>
        post.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.authorUsername?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className={`animate-spin text-${accentColor}-600`} size={40} /></div>;
    }

    if (!currentUserId) {
        return (
            <div className="max-w-4xl mx-auto py-20 text-center">
                <Bookmark size={64} className="mx-auto text-gray-300 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sign in to view bookmarks</h2>
                <p className="text-gray-500">You need to be logged in to save and view your favorite posts.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                    <Bookmark className={`text-${accentColor}-500`} size={40} />
                    Bookmarks
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                    Your personal collection of saved posts and discussions
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700/50 rounded-2xl p-4 mb-8 flex gap-4 shadow-sm">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search in your bookmarks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-11 pr-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-${accentColor}-500`}
                    />
                </div>
            </div>

            <div className="space-y-6">
                {filteredPosts.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700/50 rounded-xl p-12 text-center shadow-sm">
                        <Bookmark size={48} className={`text-${accentColor}-500/50 mx-auto mb-4`} />
                        <h3 className="text-gray-900 dark:text-white font-bold text-xl mb-2">No bookmarks found</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            {searchQuery ? "Try adjusting your search terms" : "Start bookmarking posts you want to save for later"}
                        </p>
                    </div>
                ) : (
                    filteredPosts.map(post => (
                        <PostItem
                            key={post.id}
                            post={post}
                            currentUserId={currentUserId}
                            isPageOwner={currentUserId !== null && String(post.authorId) === String(currentUserId)}
                            accentColor={accentColor}
                            isLiked={currentUserId !== null && likedPosts.has(post.id)}
                            onLikeToggle={handleLike}
                            isSaved={true} // На цій сторінці всі пости - збережені
                            onSaveToggle={handleSaveToggle}
                            onDeleteClick={(id) => setPostToDeleteId(id)}
                            onEditSave={handleSaveEdit}
                            onImageClick={(url) => setSelectedImage(url)}
                        />
                    ))
                )}
            </div>

            {/* Модалки */}
            {selectedImage && <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />}

            {postToDeleteId !== null && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn" onClick={() => setPostToDeleteId(null)}>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-zoomIn relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setPostToDeleteId(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X size={24} /></button>
                        <div className="flex flex-col items-center text-center mt-4">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-4"><AlertTriangle size={32} /></div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Delete Post?</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">Are you sure you want to delete this post? This action cannot be undone.</p>
                            <div className="flex gap-3 w-full">
                                <button onClick={() => setPostToDeleteId(null)} className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-medium transition-colors">Cancel</button>
                                <button onClick={confirmDeletePost} disabled={isDeletingPost} className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-lg flex justify-center items-center gap-2 disabled:opacity-50">
                                    {isDeletingPost ? <Loader2 size={18} className="animate-spin" /> : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};