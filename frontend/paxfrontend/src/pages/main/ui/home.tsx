import React, {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import {
    TrendingUp,
    MessageSquare,
    Users,
    Loader2,
    X,
    Image as ImageIcon,
    Send,
    AlertTriangle
} from 'lucide-react';

// ІМПОРТИ СЕРВІСІВ (Переконайся, що шляхи правильні)
import {fetchAllPosts, createPost, deletePost, likePost, updatePost, sortPosts, unlikePost, addBookmark,
    removeBookmark, Post} from '../postServise';
import {fetchUsersCount, Group, fetchMyGroups} from '../../groups/groupsService';


// ШЛЯХ ДО НОВОГО КОМПОНЕНТА POST ITEM (Перевір, чи правильний імпорт!)
import { PostItem } from '../PostItem';

// ============================================================================
// КОМПОНЕНТ МОДАЛЬНОГО ВІКНА ДЛЯ ПЕРЕГЛЯДУ ФОТОГРАФІЙ (LIGHTBOX)
// ============================================================================
interface ImageModalProps {
    imageUrl: string;
    onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({imageUrl, onClose}) => {
    // Закриття вікна по кнопці Escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn"
            onClick={onClose} // Закриття при кліку на фон
        >
            <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
                <X size={24}/>
            </button>

            <img
                src={imageUrl}
                alt="Full size"
                className="max-w-full max-h-[90vh] rounded-lg shadow-2xl animate-zoomIn"
                onClick={(e) => e.stopPropagation()} // Щоб клік по самому фото не закривав його
            />
        </div>
    );
};

// ============================================================================
// ГОЛОВНИЙ КОМПОНЕНТ HOME
// ============================================================================
export const Home: React.FC = () => {
    // --- 1. СТЕЙТИ ТА ЛОГІКА КОЛЬОРІВ ---
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

    // --- 2. СТЕЙТИ ДЛЯ СТАТИСТИКИ (КІЛЬКІСТЬ ЮЗЕРІВ) ---
    const [membersCount, setMembersCount] = useState<number | string>("...");

    useEffect(() => {
        const loadMembers = async () => {
            try {
                const count = await fetchUsersCount();
                setMembersCount(Number(count));
            } catch (err) {
                console.error("Не вдалося завантажити кількість юзерів", err);
                setMembersCount("?");
            }
        };

        loadMembers();
    }, []);

    // --- 3. ГОЛОВНІ СТЕЙТИ ДЛЯ ПОСТІВ ТА UI ---
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // --- 4. СТЕЙТИ АВТОРИЗАЦІЇ ТА СТВОРЕННЯ ПОСТА ---
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const [isCreating, setIsCreating] = useState(false);
    const [newPostText, setNewPostText] = useState("");
    const [myGroups, setMyGroups] = useState<Group[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<number | "">("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- 5. СТЕЙТИ ДЛЯ ВИДАЛЕННЯ ПОСТА ---
    const [postToDeleteId, setPostToDeleteId] = useState<number | null>(null);
    const [isDeletingPost, setIsDeletingPost] = useState(false);

    // --- 6. СТЕЙТ ДЛЯ ЛАЙКІВ (ЗБЕРЕЖЕННЯ В LOCALSTORAGE) ---
    const [likedPosts, setLikedPosts] = useState<Set<number>>(() => {
        const saved = localStorage.getItem('pax_liked_posts');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // ФІЛЬТРУЄМО ЖОРСТКО: пропускаємо ТІЛЬКИ справжні числа!
                const validIds = parsed.filter((id: any) => typeof id === 'number' && !isNaN(id));
                return new Set<number>(validIds);
            } catch (e) {
                return new Set<number>();
            }
        }
        return new Set<number>();
    });
    // Стейт для збережених постів (закладок)
    const [savedPosts, setSavedPosts] = useState<Set<number>>(() => {
        const saved = localStorage.getItem('pax_saved_posts');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const validIds = parsed.filter((id: any) => typeof id === 'number' && !isNaN(id));
                return new Set<number>(validIds);
            } catch (e) {
                return new Set<number>();
            }
        }
        return new Set<number>();
    });

    useEffect(() => {
        localStorage.setItem('pax_saved_posts', JSON.stringify(Array.from(savedPosts)));
    }, [savedPosts]);

    useEffect(() => {
        // Оновлюємо localStorage щоразу, коли змінюється набір лайків
        localStorage.setItem('pax_liked_posts', JSON.stringify(Array.from(likedPosts)));
    }, [likedPosts]);

    // --- 7. ЗАВАНТАЖЕННЯ ДАНИХ ПРИ СТАРТІ ---
    useEffect(() => {
        // Перевіряємо, чи юзер авторизований
        const token = localStorage.getItem("access_token");
        if (token && token !== "undefined") {
            setIsLoggedIn(true);
            try {
                // Дістаємо ID поточного юзера з токена
                const payload = JSON.parse(atob(token.split('.')[1]));
                setCurrentUserId(payload.sub);
            } catch (e) {
                console.error("Помилка парсингу токена", e);
            }

            // Завантажуємо групи юзера для випадаючого списку при створенні поста
            fetchMyGroups().then(groups => {
                setMyGroups(groups);
                if (groups.length > 0) {
                    setSelectedGroupId(groups[0].id);
                }
            }).catch(console.error);
        } else {
            setIsLoggedIn(false);
            setCurrentUserId(null);
        }

        // Завантажуємо всі пости з бекенду
        const loadPosts = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await fetchAllPosts();
                setPosts(sortPosts(data, 'date'));
            } catch (err: any) {
                console.error("Помилка завантаження постів:", err);
                setError("Не вдалося завантажити останні обговорення.");
            } finally {
                setIsLoading(false);
            }
        };

        loadPosts();
    }, []);

    // ============================================================================
    // ОБРОБНИКИ ДІЙ (HANDLERS)
    // ============================================================================

    // СТВОРЕННЯ ПОСТА
    const handleCreatePost = async () => {
        if (!newPostText.trim()) return alert("Пост не може бути порожнім!");
        if (!selectedGroupId) return alert("Оберіть спільноту для публікації!");

        setIsSubmitting(true);
        try {
            const createdPost = await createPost({
                text: newPostText,
                groupId: Number(selectedGroupId)
            });

            // Find group name locally
            const group = myGroups.find(g => g.id === Number(selectedGroupId));

            const newPost = {
                ...createdPost,
                groupName: group?.name || "" // ensure it's always defined
            };

            setPosts([newPost, ...posts]);

            // Очищаємо форму і згортаємо її
            setNewPostText("");
            setIsCreating(false);
        } catch (err) {
            console.error(err);
            alert("Помилка при створенні поста. Можливо, сервер відхилив запит.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ЛАЙК ТА ЗНЯТТЯ ЛАЙКУ (UNLIKE)
    const handleLike = async (postId: number, e: React.MouseEvent) => {
        e.stopPropagation();

        const token = localStorage.getItem("access_token");
        if (!token || token === "undefined") {
            alert("Please log in to like posts.");
            return;
        }

        const isLiked = likedPosts.has(postId);
        const postToUpdate = posts.find(p => p.id === postId);
        if (!postToUpdate) return;

        // 1. МИТТЄВА ВІЗУАЛЬНА ЗМІНА (Оптимістичний UI)
        if (isLiked) {
            // Візуально забираємо лайк
            setLikedPosts(prev => {
                const next = new Set(prev);
                next.delete(postId);
                return next;
            });
            setPosts(posts.map(p => p.id === postId ? { ...p, likes: Math.max(0, p.likes - 1) } : p));

            if (typeof setProfileLikedPosts !== 'undefined') {
                setProfileLikedPosts(prev => prev.filter(p => p.id !== postId));
            }
        } else {
            // Візуально ставимо лайк
            setLikedPosts(prev => new Set(prev).add(postId));
            setPosts(posts.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));

            if (typeof setProfileLikedPosts !== 'undefined') {
                setProfileLikedPosts(prev => [{ ...postToUpdate, likes: postToUpdate.likes + 1 }, ...prev]);
            }
        }

        // 2. ВІДПРАВЛЯЄМО ЄДИНИЙ ЗАПИТ НА БЕКЕНД
        try {
            // Ми завжди викликаємо likePost, бо бекенд сам знає, що це Toggle (перемикач)
            const updatedPostFromServer = await likePost(postId);

            // Опціонально: оновлюємо пост реальними даними з сервера, щоб цифри 100% збігалися
            if (updatedPostFromServer && updatedPostFromServer.id) {
                setPosts(prev => prev.map(p => p.id === postId ? updatedPostFromServer : p));
            }
        } catch (err) {
            console.error("Помилка при зміні лайку на сервері", err);
        }
    };
    const handleSaveToggle = async (postId: number, e: React.MouseEvent) => {
        e.stopPropagation();

        const token = localStorage.getItem("access_token");
        if (!token || token === "undefined") {
            alert("Please log in to save posts.");
            return;
        }

        const isSaved = savedPosts.has(postId);

        // Візуально миттєво додаємо або забираємо прапорець (Оптимістичний UI)
        if (isSaved) {
            setSavedPosts(prev => { const next = new Set(prev); next.delete(postId); return next; });
            try { await removeBookmark(postId); } catch (err) { console.error("Помилка видалення закладки"); }
        } else {
            setSavedPosts(prev => new Set(prev).add(postId));
            try { await addBookmark(postId); } catch (err) { console.error("Помилка додавання закладки"); }
        }
    };

    // ЗБЕРЕЖЕННЯ РЕДАГОВАНОГО ПОСТА
    const handleSaveEdit = async (postId: number, newText: string) => {
        const postToEdit = posts.find(p => p.id === postId);
        if (!postToEdit) return;

        try {
            const updatedPost = await updatePost(postId, {
                id: postId,
                text: newText,
                groupId: postToEdit.groupId // Відправляємо оригінальний groupId
            });

            setPosts(posts.map(p => p.id === postId ? updatedPost : p));
        } catch (err) {
            console.error(err);
            alert("Помилка збереження! Відкрий консоль (F12), щоб побачити точну причину від бекенду.");
            throw err; // Прокидаємо помилку далі, щоб PostItem зняв стан завантаження
        }
    };

    // ВИДАЛЕННЯ ПОСТА (Після підтвердження у модалці)
    const confirmDeletePost = async () => {
        if (postToDeleteId === null) return;
        setIsDeletingPost(true);
        try {
            await deletePost(postToDeleteId);
            setPosts(posts.filter(p => p.id !== postToDeleteId));
            setPostToDeleteId(null);
        } catch (err) {
            alert("Помилка при видаленні поста. Можливо, у вас немає прав.");
        } finally {
            setIsDeletingPost(false);
        }
    };

    // ============================================================================
    // РЕНДЕР ГОЛОВНОЇ СТОРІНКИ
    // ============================================================================
    return (
        <div className="max-w-7xl mx-auto pb-10">
            {/* --- ВІТАЛЬНА СЕКЦІЯ --- */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">
                    Welcome to <span className={`text-${accentColor}-600`}>PAX</span> Community
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-lg transition-colors">
                    Connect, share, and engage with thousands of members worldwide
                </p>
            </div>

            {/* --- КАРТКИ СТАТИСТИКИ --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div
                    className={`bg-${accentColor}-50 dark:bg-${accentColor}-900/10 border border-${accentColor}-200 dark:border-${accentColor}-500/20 rounded-xl p-6 transition-colors`}>
                    <div className="flex items-center gap-4">
                        <div
                            className={`w-12 h-12 bg-${accentColor}-600 rounded-lg flex items-center justify-center shadow-lg shadow-${accentColor}-500/30`}>
                            <MessageSquare size={24} className="text-white"/>
                        </div>
                        <div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Discussions</p>
                            <p className="text-gray-900 dark:text-white text-2xl font-bold">{posts.length}</p>
                        </div>
                    </div>
                </div>

                <div
                    className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-6 transition-colors">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <Users size={24} className="text-white"/>
                        </div>
                        <div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Active Members</p>
                            <p className="text-gray-900 dark:text-white text-2xl font-bold">
                                {membersCount}
                            </p>
                        </div>
                    </div>
                </div>

                <div
                    className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-500/20 rounded-xl p-6 transition-colors">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/30">
                            <TrendingUp size={24} className="text-white"/>
                        </div>
                        <div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Online Now</p>
                            <p className="text-gray-900 dark:text-white text-2xl font-bold">1,423</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- БЛОК СТВОРЕННЯ ПОСТА (Тільки для авторизованих) --- */}
            {isLoggedIn && (
                <div
                    className={`bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800/50 rounded-xl mb-8 shadow-sm overflow-hidden transition-all duration-300 ease-in-out ${isCreating ? `ring-2 ring-${accentColor}-500/50` : ''}`}>
                    {!isCreating ? (
                        <div
                            onClick={() => setIsCreating(true)}
                            className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                            <div
                                className={`w-10 h-10 rounded-full bg-${accentColor}-100 dark:bg-${accentColor}-900/30 flex items-center justify-center font-bold text-${accentColor}-600`}>
                                Me
                            </div>
                            <div
                                className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2.5 text-gray-500 dark:text-gray-400 text-sm">
                                Create a new post...
                            </div>
                            <div className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <ImageIcon size={20}/>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 animate-fadeIn">
                            <div className="flex gap-4">
                                <div
                                    className={`w-10 h-10 rounded-full bg-${accentColor}-100 dark:bg-${accentColor}-900/30 flex items-center justify-center font-bold text-${accentColor}-600 shrink-0`}>
                                    Me
                                </div>
                                <div className="flex-1">
                                    <textarea
                                        autoFocus
                                        value={newPostText}
                                        onChange={(e) => setNewPostText(e.target.value)}
                                        placeholder="What's on your mind?"
                                        className="w-full bg-transparent border-none outline-none focus:ring-0 text-gray-900 dark:text-white text-lg resize-none min-h-[100px] p-0"
                                    />
                                </div>
                            </div>

                            <div
                                className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <select
                                        value={selectedGroupId}
                                        onChange={(e) => setSelectedGroupId(Number(e.target.value))}
                                        className={`bg-gray-100 dark:bg-gray-800 border-none outline-none text-sm rounded-lg text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-${accentColor}-500 py-2 px-3`}
                                    >
                                        <option value="" disabled>Select Community</option>
                                        {myGroups.map(group => (
                                            <option key={group.id} value={group.id}>{group.name}</option>
                                        ))}
                                    </select>

                                    <button
                                        className={`p-2 text-gray-400 hover:text-${accentColor}-500 hover:bg-${accentColor}-50 dark:hover:bg-${accentColor}-900/20 rounded-lg transition-colors`}
                                        title="Attach Image">
                                        <ImageIcon size={20}/>
                                    </button>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setIsCreating(false);
                                            setNewPostText("");
                                        }}
                                        className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreatePost}
                                        disabled={isSubmitting || !newPostText.trim() || !selectedGroupId}
                                        className={`px-5 py-2 bg-${accentColor}-600 hover:bg-${accentColor}-700 text-white rounded-lg font-medium flex items-center gap-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {isSubmitting ? <Loader2 size={18} className="animate-spin"/> :
                                            <Send size={18}/>}
                                        Post
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* --- СТРІЧКА ПОСТІВ --- */}
            <div
                className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800/50 rounded-xl p-6 shadow-sm transition-colors">
                <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className={`text-${accentColor}-500`} size={24}/>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">Recent
                        Discussions</h2>
                </div>

                {isLoading && (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className={`animate-spin text-${accentColor}-500`} size={32}/>
                    </div>
                )}

                {error && (
                    <div className="text-center py-8 text-red-500 bg-red-50 dark:bg-red-900/10 rounded-lg">
                        <p>{error}</p>
                    </div>
                )}

                {!isLoading && !error && posts.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <MessageSquare size={48} className="mx-auto mb-3 opacity-20"/>
                        <p>No discussions yet. Be the first to post!</p>
                    </div>
                )}

                {/* --- СПИСОК ПОСТІВ (ЧЕРЕЗ КОМПОНЕНТ) --- */}
                <div className="space-y-6">
                    {!isLoading && !error && posts.map((post) => {
                        const isLiked = likedPosts.has(post.id);

                        return (
                            <div key={post.id} className="flex flex-col mb-4">
                                {/* Назва групи акуратно НАД постом */}
                                {post.groupName && (
                                    <Link to={`/groups/${post.groupId}`} className="w-fit mb-2 ml-2 z-10">
            <span className={`inline-block text-xs font-bold bg-${accentColor}-100 dark:bg-${accentColor}-900/30 text-${accentColor}-700 dark:text-${accentColor}-300 px-3 py-1 rounded-full shadow-sm hover:bg-${accentColor}-200 dark:hover:bg-${accentColor}-900/50 transition-colors`}>
                {post.groupName}
            </span>
                                    </Link>
                                )}

                                <PostItem
                                    key={post.id}
                                    post={post}
                                    currentUserId={currentUserId}
                                    // Замість isOwner перевіряємо, чи є юзер автором цього поста
                                    isPageOwner={currentUserId !== null && String(post.authorId) === String(currentUserId)}
                                    accentColor={accentColor}
                                    isLiked={currentUserId !== null && likedPosts.has(post.id)}
                                    onLikeToggle={handleLike}
                                    isSaved={currentUserId !== null && savedPosts.has(post.id)}
                                    onSaveToggle={handleSaveToggle}
                                    onDeleteClick={(id) => setPostToDeleteId(id)}
                                    onEditSave={handleSaveEdit}
                                    onImageClick={(url) => setSelectedImage(url)}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* --- МОДАЛЬНЕ ВІКНО: ПЕРЕГЛЯД ЗОБРАЖЕНЬ --- */}
            {selectedImage && (
                <ImageModal
                    imageUrl={selectedImage}
                    onClose={() => setSelectedImage(null)}
                />
            )}

            {/* --- МОДАЛЬНЕ ВІКНО: ПІДТВЕРДЖЕННЯ ВИДАЛЕННЯ --- */}
            {postToDeleteId !== null && (
                <div
                    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn"
                    onClick={() => setPostToDeleteId(null)}
                >
                    <div
                        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-zoomIn relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setPostToDeleteId(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <X size={24}/>
                        </button>

                        <div className="flex flex-col items-center text-center mt-4">
                            <div
                                className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle size={32}/>
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                Delete Post?
                            </h3>

                            <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                                Are you sure you want to delete this post? This action cannot be undone.
                            </p>

                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setPostToDeleteId(null)}
                                    className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeletePost}
                                    disabled={isDeletingPost}
                                    className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-red-500/30 flex justify-center items-center gap-2 disabled:opacity-50"
                                >
                                    {isDeletingPost ? <Loader2 size={18} className="animate-spin"/> : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};