import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    User, Mail, MapPin, Calendar, Link as LinkIcon, Edit3, Settings,
    Camera, Heart, MessageSquare, Eye, Bookmark, Users, Award, TrendingUp,
    Globe, Hash, Loader2, Trash2, AlertTriangle, X, Image as ImageIcon
} from 'lucide-react';

// ПЕРЕВІР ЦІ ШЛЯХИ ДО СВОЇХ СЕРВІСІВ!
import { fetchUserById } from '../userService';
import {
    fetchAllPosts, deletePost, updatePost, likePost, sortPosts, Post,
    addBookmark, removeBookmark
} from '../../main/postServise';

// ШЛЯХ ДО НОВОГО КОМПОНЕНТА POST ITEM
import { PostItem } from '../../main/PostItem';

// --- Модалка для перегляду фото ---
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

export const ProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const profileId = String(id);

    const [accentColor, setAccentColor] = useState(() => localStorage.getItem('site_accent_color') || 'purple');
    const [user, setUser] = useState<any>(null);
    const [posts, setPosts] = useState<Post[]>([]); // Власні пости юзера
    const [profileLikedPosts, setProfileLikedPosts] = useState<Post[]>([]); // Пости, які лайкнув САМЕ ЦЕЙ юзер
    const [isLoading, setIsLoading] = useState(true);

    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Стейт для перемикання вкладок
    const [activeTab, setActiveTab] = useState<'Posts' | 'Media' | 'Likes'>('Posts');

    // Модалки
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [postToDeleteId, setPostToDeleteId] = useState<number | null>(null);
    const [isDeletingPost, setIsDeletingPost] = useState(false);

    // Локальні лайки поточного користувача (щоб кнопочка "сердечко" світилась червоним)
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
        localStorage.setItem('pax_liked_posts', JSON.stringify(Array.from(likedPosts)));
    }, [likedPosts]);

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
        const loadData = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem("access_token");
                let myId = null;

                if (token && token !== "undefined") {
                    try {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        myId = payload.sub; // username або email
                        setCurrentUserId(myId);
                    } catch (e) {
                        console.error("Помилка парсингу токена", e);
                    }
                }

                // 1. Завантажуємо профіль
                let userData = null;

                if (profileId === 'me' || profileId === 'undefined') {
                    if (myId) {
                        try {
                            userData = await fetchUserById(myId);
                        } catch (err) {
                            console.warn("Не вдалося знайти юзера напряму, шукаємо в базі...");
                        }

                        if (!userData) {
                            try {
                                const allRes = await fetch("http://localhost:8081/api/v1/users/all", {
                                    headers: { "Authorization": `Bearer ${token}` }
                                });
                                if (allRes.ok) {
                                    const allData = await allRes.json();
                                    const usersList = Array.isArray(allData) ? allData : (allData.content || []);
                                    userData = usersList.find((u: any) =>
                                        String(u.id) === String(myId) ||
                                        u.username === myId ||
                                        u.email === myId
                                    );
                                }
                            } catch (e) {
                                console.error("Помилка при резервному пошуку юзера", e);
                            }
                        }

                        if (userData && userData.id) {
                            setCurrentUserId(String(userData.id));
                        }
                    }
                } else {
                    userData = await fetchUserById(profileId);
                }

                setUser(userData);

                // 2. Завантажуємо пости
                const fetchedAllPosts = await fetchAllPosts().catch(() => []);

                if (userData) {
                    // Власні пости (СОРТУЄМО ПО ДАТІ)
                    const userPosts = fetchedAllPosts.filter(p => String(p.authorId) === String(userData.id));
                    setPosts(sortPosts(userPosts, 'date'));

                    // --- НОВЕ: Завантажуємо пости, які лайкнув саме ВЛАСНИК ПРОФІЛЮ ---
                    try {
                        const headers: HeadersInit = { "Content-Type": "application/json" };
                        if (token && token !== "undefined") headers["Authorization"] = `Bearer ${token}`;

                        // Запит на бекенд: отримати лайки конкретного юзера (userData.id)
                        const likesRes = await fetch(`http://localhost:8081/api/v1/users/${userData.id}/likedPosts`, { headers });

                        if (likesRes.ok) {
                            const likedData = await likesRes.json();
                            // СОРТУЄМО ЛАЙКНУТІ ПОСТИ
                            setProfileLikedPosts(sortPosts(likedData, 'date'));
                        } else {
                            // FALLBACK: Якщо ендпоінту на бекенді ще немає, а профіль мій - показуємо з локал сторедж
                            if (String(userData.id) === String(currentUserId) || myId === profileId || profileId === 'me') {
                                const myLocalLikes = fetchedAllPosts.filter(p => likedPosts.has(p.id));
                                setProfileLikedPosts(sortPosts(myLocalLikes, 'date'));
                            } else {
                                setProfileLikedPosts([]);
                            }
                        }
                    } catch (e) {
                        // FALLBACK на випадок помилки мережі
                        if (String(userData.id) === String(currentUserId) || myId === profileId || profileId === 'me') {
                            const myLocalLikes = fetchedAllPosts.filter(p => likedPosts.has(p.id));
                            setProfileLikedPosts(sortPosts(myLocalLikes, 'date'));
                        } else {
                            setProfileLikedPosts([]);
                        }
                    }
                }

            } catch (err) {
                console.error("Помилка завантаження профілю:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [profileId]);

    const isOwner = currentUserId !== null && user !== null && String(user.id) === String(currentUserId);

    // === ЛОГІКА ПОСТІВ ===

    // 1. Окремий обробник для лайків
    const handleLike = async (postId: number, e: React.MouseEvent) => {
        e.stopPropagation();

        const token = localStorage.getItem("access_token");
        if (!token || token === "undefined") {
            alert("Please log in to like posts.");
            return;
        }

        const isLiked = likedPosts.has(postId);
        const postToUpdate = posts.find(p => p.id === postId) || profileLikedPosts.find(p => p.id === postId);
        if (!postToUpdate) return;

        // Оптимістичний UI для лайків
        if (isLiked) {
            setLikedPosts(prev => {
                const next = new Set(prev);
                next.delete(postId);
                return next;
            });
            setPosts(posts.map(p => p.id === postId ? { ...p, likes: Math.max(0, p.likes - 1) } : p));
            setProfileLikedPosts(profileLikedPosts.map(p => p.id === postId ? { ...p, likes: Math.max(0, p.likes - 1) } : p));
        } else {
            setLikedPosts(prev => new Set(prev).add(postId));
            setPosts(posts.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
            setProfileLikedPosts(profileLikedPosts.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
        }

        try {
            await likePost(postId);
        } catch (err) {
            console.error("Помилка лайку", err);
        }
    };

    // 2. Окремий обробник для закладок (ВИГНАННИЙ З handleLike)
    const handleSaveToggle = async (postId: number, e: React.MouseEvent) => {
        e.stopPropagation();

        const token = localStorage.getItem("access_token");
        if (!token || token === "undefined") {
            alert("Please log in to save posts.");
            return;
        }

        const isSaved = savedPosts.has(postId);

        // Оптимістичний UI для закладок
        if (isSaved) {
            setSavedPosts(prev => {
                const next = new Set(prev);
                next.delete(postId);
                return next;
            });
            try { await removeBookmark(postId); } catch (err) { console.error(err); }
        } else {
            setSavedPosts(prev => new Set(prev).add(postId));
            try { await addBookmark(postId); } catch (err) { console.error(err); }
        }
    };

    const handleSaveEdit = async (postId: number, newText: string) => {
        const postToEdit = posts.find(p => p.id === postId) || profileLikedPosts.find(p => p.id === postId);
        if (!postToEdit) return;

        const updatedPost = await updatePost(postId, {
            id: postId,
            text: newText,
            groupId: postToEdit.groupId
        });

        setPosts(posts.map(p => p.id === postId ? updatedPost : p));
        setProfileLikedPosts(profileLikedPosts.map(p => p.id === postId ? updatedPost : p));
    };

    const confirmDeletePost = async () => {
        if (postToDeleteId === null) return;
        setIsDeletingPost(true);
        try {
            await deletePost(postToDeleteId);
            setPosts(posts.filter(p => p.id !== postToDeleteId));
            setProfileLikedPosts(profileLikedPosts.filter(p => p.id !== postToDeleteId));
            setPostToDeleteId(null);
        } catch (err) {
            alert("Помилка видалення поста.");
        } finally {
            setIsDeletingPost(false);
        }
    };

    if (isLoading) {
        return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className={`animate-spin text-${accentColor}-600`} size={40} /></div>;
    }

    if (!user) {
        return <div className="text-center py-20"><h2 className="text-2xl font-bold dark:text-white">User not found</h2></div>;
    }

    const avatarLetter = user.username ? user.username.substring(0, 1).toUpperCase() : '?';

    // Відфільтрований масив для вкладки Media (Тільки власні пости з фотографіями)
    const mediaPosts = posts.filter(post => post.images && post.images.length > 0);

    return (
        <div className="max-w-7xl mx-auto pb-10">
            {/* Banner */}
            <div className={`h-48 md:h-64 rounded-b-3xl md:rounded-3xl bg-gradient-to-r from-${accentColor}-500 to-${accentColor}-700 relative shadow-lg mb-20`}>
                <div className="absolute top-4 right-4 flex gap-2">
                    {isOwner && (
                        <button className="bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl p-2 text-white transition-colors" title="Change Banner">
                            <Camera size={20} />
                        </button>
                    )}
                </div>

                {/* Avatar */}
                <div className="absolute -bottom-16 left-8 flex items-end gap-6">
                    <div className="relative group">
                        <div className={`w-32 h-32 rounded-2xl bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-900 flex items-center justify-center text-5xl font-bold text-${accentColor}-600 shadow-xl overflow-hidden`}>
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                            ) : (
                                avatarLetter
                            )}
                        </div>
                        {isOwner && (
                            <button className="absolute bottom-2 right-2 p-2 bg-gray-900/70 hover:bg-gray-900 text-white rounded-lg backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100">
                                <Camera size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="absolute -bottom-14 right-8 flex gap-3">
                    {isOwner ? (
                        <Link
                            to="/settings"
                            className={`px-5 py-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all border border-gray-200 dark:border-gray-700`}
                        >
                            <Edit3 size={18} /> Edit Profile
                        </Link>
                    ) : (
                        <>
                            <button className={`px-5 py-2.5 bg-${accentColor}-600 hover:bg-${accentColor}-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-${accentColor}-500/30 transition-all`}>
                                <MessageSquare size={18} /> Message
                            </button>
                            <button className="px-5 py-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all border border-gray-200 dark:border-gray-700">
                                <Users size={18} /> Follow
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4">
                {/* Left Sidebar (Info) */}
                <div className="lg:col-span-1 space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {user.firstName} {user.lastName}
                        </h1>
                        <p className="text-lg text-gray-500 dark:text-gray-400 mb-4">@{user.username}</p>
                        {user.bio ? (
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">{user.bio}</p>
                        ) : (
                            <p className="text-gray-400 dark:text-gray-600 italic mb-6">No bio provided yet.</p>
                        )}
                    </div>

                    <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-6 rounded-2xl shadow-sm">
                        <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">About</h3>
                        <div className="space-y-4 text-sm">
                            {user.email && (
                                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                                    <Mail size={18} className={`text-${accentColor}-500`} />
                                    <span>{user.email}</span>
                                </div>
                            )}
                            {user.location && (
                                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                                    <MapPin size={18} className={`text-${accentColor}-500`} />
                                    <span>{user.location}</span>
                                </div>
                            )}
                            {user.website && (
                                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                                    <LinkIcon size={18} className={`text-${accentColor}-500`} />
                                    <a href={user.website} target="_blank" rel="noopener noreferrer" className={`hover:text-${accentColor}-500 transition-colors`}>
                                        {user.website.replace(/^https?:\/\//, '')}
                                    </a>
                                </div>
                            )}
                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                                <Calendar size={18} className={`text-${accentColor}-500`} />
                                <span>Joined {new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column (Posts & Activity) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tabs */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar border-b border-gray-200 dark:border-gray-800 pb-px">
                        {(['Posts', 'Media', 'Likes'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                                    activeTab === tab
                                        ? `border-${accentColor}-500 text-${accentColor}-600 dark:text-${accentColor}-400`
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Вміст залежно від вибраної вкладки */}

                    {/* Вкладка: POSTS */}
                    {activeTab === 'Posts' && (
                        <div className="space-y-6 animate-fadeIn">
                            {posts.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/20 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                                    <MessageSquare size={48} className="mx-auto text-gray-400 mb-3 opacity-50" />
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">No posts yet</h3>
                                    <p className="text-gray-500">This user hasn't posted anything.</p>
                                </div>
                            ) : (
                                posts.map(post => (
                                    <PostItem
                                        key={post.id}
                                        post={post}
                                        currentUserId={currentUserId}
                                        isPageOwner={isOwner}
                                        accentColor={accentColor}
                                        isLiked={currentUserId !== null && likedPosts.has(post.id)}
                                        onLikeToggle={handleLike}
                                        isSaved={currentUserId !== null && savedPosts.has(post.id)}
                                        onSaveToggle={handleSaveToggle}
                                        onDeleteClick={(id) => setPostToDeleteId(id)}
                                        onEditSave={handleSaveEdit}
                                        onImageClick={(url) => setSelectedImage(url)}
                                    />
                                ))
                            )}
                        </div>
                    )}

                    {/* Вкладка: MEDIA */}
                    {activeTab === 'Media' && (
                        <div className="space-y-6 animate-fadeIn">
                            {mediaPosts.length === 0 ? (
                                <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/20 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                                    <ImageIcon size={48} className="mx-auto text-gray-400 mb-4 opacity-50" />
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Media</h3>
                                    <p className="text-gray-500">This user hasn't posted any photos yet.</p>
                                </div>
                            ) : (
                                mediaPosts.map(post => (
                                    <PostItem
                                        key={post.id}
                                        post={post}
                                        currentUserId={currentUserId}
                                        isPageOwner={isOwner}
                                        accentColor={accentColor}
                                        isLiked={currentUserId !== null && likedPosts.has(post.id)}
                                        onLikeToggle={handleLike}
                                        isSaved={currentUserId !== null && savedPosts.has(post.id)}
                                        onSaveToggle={handleSaveToggle}
                                        onDeleteClick={(id) => setPostToDeleteId(id)}
                                        onEditSave={handleSaveEdit}
                                        onImageClick={(url) => setSelectedImage(url)}
                                    />
                                ))
                            )}
                        </div>
                    )}

                    {/* Вкладка: LIKES */}
                    {activeTab === 'Likes' && (
                        <div className="space-y-6 animate-fadeIn">
                            {profileLikedPosts.length === 0 ? (
                                <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/20 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                                    <Heart size={48} className="mx-auto text-gray-400 mb-4 opacity-50" />
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Liked Posts</h3>
                                    <p className="text-gray-500">Posts liked by this user will be displayed here.</p>
                                </div>
                            ) : (
                                profileLikedPosts.map(post => (
                                    <PostItem
                                        key={post.id}
                                        post={post}
                                        currentUserId={currentUserId}
                                        isPageOwner={isOwner} // Дозволяємо видалення/ред. тільки якщо це мій пост
                                        accentColor={accentColor}
                                        isLiked={likedPosts.has(post.id)} // Перевіряємо, чи Я лайкнув цей пост
                                        onLikeToggle={handleLike}
                                        isSaved={currentUserId !== null && savedPosts.has(post.id)}
                                        onSaveToggle={handleSaveToggle}
                                        onDeleteClick={(id) => setPostToDeleteId(id)}
                                        onEditSave={handleSaveEdit}
                                        onImageClick={(url) => setSelectedImage(url)}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Модалка перегляду фото */}
            {selectedImage && (
                <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
            )}

            {/* Модалка підтвердження видалення поста */}
            {postToDeleteId !== null && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn" onClick={() => setPostToDeleteId(null)}>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-zoomIn relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setPostToDeleteId(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                            <X size={24} />
                        </button>
                        <div className="flex flex-col items-center text-center mt-4">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle size={32} />
                            </div>
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