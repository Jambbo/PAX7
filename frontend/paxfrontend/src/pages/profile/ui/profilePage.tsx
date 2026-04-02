import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    User, Mail, MapPin, Calendar, Link as LinkIcon, Edit3, Settings,
    Camera, Heart, MessageSquare, Eye, Bookmark, Users, Award, TrendingUp,
    Globe, Hash, Loader2, Trash2, AlertTriangle, X, Image as ImageIcon, Check
} from 'lucide-react';

import { fetchUserById, UserData, sendFriendRequest, checkFriendshipStatus, fetchMyFriends, removeFriendCall } from '../userService';
import { fetchAllPosts, updatePost, sortPosts, likePost, fetchBookmarks, addBookmark, removeBookmark, deletePost, Post } from '../../main/postServise';

import { PostItem } from '../../main/PostItem';

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

export const ProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const profileId = String(id);

    const [accentColor, setAccentColor] = useState(() => localStorage.getItem('site_accent_color') || 'purple');
    const [user, setUser] = useState<any>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [wallPosts, setWallPosts] = useState<Post[]>([]);
    const [wallGroupId, setWallGroupId] = useState<number | null>(null);
    const [profileLikedPosts, setProfileLikedPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [newWallPostText, setNewWallPostText] = useState("");
    const [isPostingToWall, setIsPostingToWall] = useState(false);

    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<'Wall' | 'Posts' | 'Media' | 'Likes' | 'Friends'>('Wall');
    
    const [friendshipStatus, setFriendshipStatus] = useState<string>('NONE');
    const [myFriends, setMyFriends] = useState<UserData[]>([]);
    const [toastMessage, setToastMessage] = useState<{title: string, message: string} | null>(null);

    const showToast = (title: string, message: string) => {
        setToastMessage({ title, message });
        setTimeout(() => setToastMessage(null), 3000);
    };

    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [postToDeleteId, setPostToDeleteId] = useState<number | null>(null);
    const [isDeletingPost, setIsDeletingPost] = useState(false);

    const [likedPosts, setLikedPosts] = useState<Set<number>>(() => {
        const saved = localStorage.getItem('pax_liked_posts');
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
        const handleStorageChange = () => {
            setAccentColor(localStorage.getItem('site_accent_color') || 'blue');
        };
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
                        myId = payload.sub;
                        setCurrentUserId(myId);
                    } catch (e) {
                        console.error("Token parsing error", e);
                    }
                }

                let userData = null;

                if (profileId === 'me' || profileId === 'undefined') {
                    if (myId) {
                        try {
                            userData = await fetchUserById(myId);
                        } catch (err) {
                            console.warn("Failed to find user directly, searching in DB...");
                        }

                        if (!userData) {
                            try {
                                const allRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/all`, {
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
                                console.error("Error on fallback user search", e);
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

                const fetchedAllPosts = await fetchAllPosts().catch(() => []);

                if (userData) {
                    try {
                        const tokenHeader = token && token !== "undefined" ? { "Authorization": `Bearer ${token}` } : {};
                        const wallRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/${userData.id}/wall`, { headers: tokenHeader as any });
                        if (wallRes.ok) {
                            const wallData = await wallRes.json();
                            const wgId = wallData.groupId;
                            setWallGroupId(wgId);
                            try {
                                const wallPostsRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/posts/group/${wgId}?t=${Date.now()}`, {
                                    headers: tokenHeader as any
                                });
                                if (wallPostsRes.ok) {
                                    const groupPosts = await wallPostsRes.json();
                                    setWallPosts(sortPosts(groupPosts, 'date'));
                                } else {
                                    setWallPosts(sortPosts(fetchedAllPosts.filter(p => p.groupId === wgId), 'date'));
                                }
                            } catch (e) {
                                setWallPosts(sortPosts(fetchedAllPosts.filter(p => p.groupId === wgId), 'date'));
                            }
                        }
                    } catch (e) {
                        console.error("Failed to fetch wall group id", e);
                    }

                    const userPosts = fetchedAllPosts.filter(p => String(p.authorId) === String(userData.id));
                    setPosts(sortPosts(userPosts, 'date'));


                    if (String(userData.id) !== String(myId)) {
                        const res = await checkFriendshipStatus(String(userData.id)).catch(() => ({ status: 'NONE' }));
                        setFriendshipStatus(res.status);
                    } else {
                        const friendsRes = await fetchMyFriends().catch(() => []);
                        setMyFriends(friendsRes);
                    }

                    try {
                        const headers: HeadersInit = { "Content-Type": "application/json" };
                        if (token && token !== "undefined") headers["Authorization"] = `Bearer ${token}`;

                        const likesRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/${userData.id}/likedPosts`, { headers });

                        if (likesRes.ok) {
                            const likedData = await likesRes.json();
                            setProfileLikedPosts(sortPosts(likedData, 'date'));
                        } else {
                            if (String(userData.id) === String(currentUserId) || myId === profileId || profileId === 'me') {
                                const myLocalLikes = fetchedAllPosts.filter(p => likedPosts.has(p.id) && !p.groupId);
                                setProfileLikedPosts(sortPosts(myLocalLikes, 'date'));
                            } else {
                                setProfileLikedPosts([]);
                            }
                        }
                    } catch (e) {
                        if (String(userData.id) === String(currentUserId) || myId === profileId || profileId === 'me') {
                            const myLocalLikes = fetchedAllPosts.filter(p => likedPosts.has(p.id) && !p.groupId);
                            setProfileLikedPosts(sortPosts(myLocalLikes, 'date'));
                        } else {
                            setProfileLikedPosts([]);
                        }
                    }
                }

            } catch (err) {
                console.error("Error loading profile:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [profileId]);

    const isOwner = currentUserId !== null && user !== null && String(user.id) === String(currentUserId);


    const handleLike = async (postId: number, e: React.MouseEvent) => {
        e.stopPropagation();

        const token = localStorage.getItem("access_token");
        if (!token || token === "undefined") {
            alert("Please log in to like posts.");
            return;
        }

        const isLiked = likedPosts.has(postId);
        const postToUpdate = posts.find(p => p.id === postId) || profileLikedPosts.find(p => p.id === postId) || wallPosts.find(p => p.id === postId);
        if (!postToUpdate) return;

        if (isLiked) {
            setLikedPosts(prev => {
                const next = new Set(prev);
                next.delete(postId);
                return next;
            });
            setPosts(posts.map(p => p.id === postId ? { ...p, likes: Math.max(0, p.likes - 1) } : p));
            setProfileLikedPosts(profileLikedPosts.map(p => p.id === postId ? { ...p, likes: Math.max(0, p.likes - 1) } : p));
            setWallPosts(wallPosts.map(p => p.id === postId ? { ...p, likes: Math.max(0, p.likes - 1) } : p));
        } else {
            setLikedPosts(prev => new Set(prev).add(postId));
            setPosts(posts.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
            setProfileLikedPosts(profileLikedPosts.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
            setWallPosts(wallPosts.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
        }

        try {
            await likePost(postId);
        } catch (err) {
            console.error("Like error", err);
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
        const postToEdit = posts.find(p => p.id === postId) || profileLikedPosts.find(p => p.id === postId) || wallPosts.find(p => p.id === postId);
        if (!postToEdit) return;

        const updatedPost = await updatePost(postId, {
            id: postId,
            text: newText,
            groupId: postToEdit.groupId
        });

        setPosts(posts.map(p => p.id === postId ? updatedPost : p));
        setWallPosts(wallPosts.map(p => p.id === postId ? updatedPost : p));
        setProfileLikedPosts(profileLikedPosts.map(p => p.id === postId ? updatedPost : p));
    };

    const confirmDeletePost = async () => {
        if (!postToDeleteId) return;
        setIsDeletingPost(true);
        try {
            await deletePost(postToDeleteId);
            setPosts(prev => prev.filter(p => p.id !== postToDeleteId));
            setWallPosts(prev => prev.filter(p => p.id !== postToDeleteId));
            setProfileLikedPosts(prev => prev.filter(p => p.id !== postToDeleteId));
            showToast("Deleted", "Post was removed successfully.");
        } catch (err) {
            console.error("Failed to delete post", err);
            showToast("Error", "Could not delete the post.");
        } finally {
            setIsDeletingPost(false);
            setPostToDeleteId(null);
        }
    };

    const handleAddFriend = async () => {
        if (!user) return;
        try {
            if (friendshipStatus === 'NONE' || friendshipStatus === 'PENDING_INCOMING') {
                await sendFriendRequest(user.id);
                setFriendshipStatus('PENDING_OUTGOING');
                showToast("Request Sent", "Friend request sent successfully!");
            } else if (friendshipStatus === 'FRIENDS' || friendshipStatus === 'PENDING_OUTGOING') {
                await removeFriendCall(user.id);
                setFriendshipStatus('NONE');
                const isUnfriend = friendshipStatus === 'FRIENDS';
                showToast(isUnfriend ? "Removed" : "Canceled", isUnfriend ? "User has been removed from friends." : "Friend request canceled.");
            }
        } catch (error) {
            console.error('Error handling friendship:', error);
            showToast("Error", "Could not complete the action.");
        }
    };

    const handleRemoveFriendFromList = async (friendId: string) => {
        try {
            await removeFriendCall(friendId);
            setMyFriends(prev => prev.filter(f => f.id !== friendId));
            showToast("Removed", "Friend removed successfully!");
        } catch (error) {
            console.error('Error removing friend:', error);
            showToast("Error", "Could not remove friend.");
        }
    };

    if (isLoading) {
        return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className={`animate-spin text-${accentColor}-600`} size={40} /></div>;
    }

    if (!user) {
        return <div className="text-center py-20"><h2 className="text-2xl font-bold dark:text-white">User not found</h2></div>;
    }

    const avatarLetter = user.username ? user.username.substring(0, 1).toUpperCase() : '?';

    const mediaPosts = posts.filter(post => post.images && post.images.length > 0);

    return (
        <div className="max-w-7xl mx-auto pb-10">
            
            <div className={`h-48 md:h-64 rounded-b-3xl md:rounded-3xl bg-gradient-to-r from-${accentColor}-500 to-${accentColor}-700 relative shadow-lg mb-20`}>
                <div className="absolute top-4 right-4 flex gap-2">
                    {isOwner && (
                        <button className="bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl p-2 text-white transition-colors" title="Change Banner">
                            <Camera size={20} />
                        </button>
                    )}
                </div>

                
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
                            <button
                                onClick={handleAddFriend}
                                className={`px-6 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-lg ${
                                    friendshipStatus === 'PENDING_OUTGOING' ? `bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600` 
                                    : friendshipStatus === 'FRIENDS' ? `bg-red-600 text-white hover:bg-red-700`
                                    : `bg-${accentColor}-600 hover:bg-${accentColor}-700 text-white shadow-${accentColor}-500/30`
                                }`}
                            >
                                {friendshipStatus === 'FRIENDS' ? <User size={18} /> : friendshipStatus === 'PENDING_OUTGOING' ? <X size={18} /> : <Users size={18} />}
                                {friendshipStatus === 'NONE' && "Add a friend"}
                                {friendshipStatus === 'PENDING_OUTGOING' && "Cancel Request"}
                                {friendshipStatus === 'PENDING_INCOMING' && "Review Request"}
                                {friendshipStatus === 'FRIENDS' && "Remove"}
                            </button>
                            <button className="p-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <Bookmark size={18} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4">
                
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

                
                <div className="lg:col-span-2 space-y-6">
                    
                    <div className="flex gap-2 overflow-x-auto no-scrollbar border-b border-gray-200 dark:border-gray-800 pb-px">
                        {(isOwner ? ['Wall', 'Posts', 'Media', 'Likes', 'Friends'] : ['Wall', 'Posts', 'Media', 'Likes']).map((tab: any) => (
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

                    

                    
                    {activeTab === 'Wall' && (
                        <div className="space-y-6 animate-fadeIn">
                            
                            {currentUserId && wallGroupId && (
                                <div className="bg-white dark:bg-gray-800/30 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700/50 mb-6">
                                    <div className="flex gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-${accentColor}-600 bg-gray-100 dark:bg-gray-700 flex-shrink-0 overflow-hidden`}>
                                            Me
                                        </div>
                                        <div className="flex-1">
                                            <textarea
                                                className="w-full bg-transparent border-none outline-none resize-none text-gray-900 dark:text-white placeholder-gray-500 mb-2"
                                                placeholder={isOwner ? "Write something on your wall..." : `Write on ${user.username}'s wall...`}
                                                rows={2}
                                                value={newWallPostText}
                                                onChange={e => setNewWallPostText(e.target.value)}
                                            />
                                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                                <button className={`p-2 text-gray-400 hover:text-${accentColor}-500 hover:bg-${accentColor}-50 dark:hover:bg-${accentColor}-900/20 rounded-lg transition-colors`} title="Attach Photo (Coming soon)">
                                                    <ImageIcon size={20} />
                                                </button>
                                                <button
                                                    disabled={!newWallPostText.trim() || isPostingToWall}
                                                    onClick={async () => {
                                                        if (!newWallPostText.trim()) return;
                                                        setIsPostingToWall(true);
                                                        try {
                                                            const token = localStorage.getItem("access_token");
                                                            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/posts`, {
                                                                method: 'POST',
                                                                headers: {
                                                                    'Content-Type': 'application/json',
                                                                    'Authorization': `Bearer ${token}`
                                                                },
                                                                body: JSON.stringify({
                                                                    text: newWallPostText,
                                                                    groupId: wallGroupId
                                                                })
                                                            });
                                                            if (res.ok) {
                                                                const created = await res.json();
                                                                setWallPosts(prev => [created, ...prev]);
                                                                setNewWallPostText("");
                                                                showToast("Success", "Post added to wall!");
                                                            }
                                                        } catch (e) {
                                                            console.error("Error creating wall post", e);
                                                        } finally {
                                                            setIsPostingToWall(false);
                                                        }
                                                    }}
                                                    className={`px-4 py-1.5 bg-${accentColor}-600 hover:bg-${accentColor}-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50`}
                                                >
                                                    {isPostingToWall ? "Posting..." : "Post"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {wallPosts.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/20 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                                    <MessageSquare size={48} className="mx-auto text-gray-400 mb-3 opacity-50" />
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Wall is empty</h3>
                                    <p className="text-gray-500">No one has posted here yet.</p>
                                </div>
                            ) : (
                                wallPosts.map(post => (
                                    <PostItem
                                        key={post.id}
                                        post={post}
                                        currentUserId={currentUserId}
                                        isPageOwner={isOwner || String(post.authorId) === currentUserId}
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
                                        isPageOwner={isOwner}
                                        accentColor={accentColor}
                                        isLiked={likedPosts.has(post.id)}
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

                    
                    {activeTab === 'Friends' && (
                        <div className="space-y-6 animate-fadeIn">
                            {myFriends.length === 0 ? (
                                <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/20 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                                    <Users size={48} className="mx-auto text-gray-400 mb-4 opacity-50" />
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Friends List</h3>
                                    <p className="text-gray-500">Manage your friends and friend requests.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {myFriends.map(friend => (
                                        <div key={friend.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full overflow-hidden">
                                                {friend.avatarUrl ? (
                                                    <img src={friend.avatarUrl} alt={friend.username} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className={`w-full h-full flex items-center justify-center text-xl font-bold text-${accentColor}-600`}>
                                                        {friend.username.substring(0, 1).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <Link to={`/profile/${friend.id}`} className="font-medium text-gray-900 dark:text-white hover:underline">
                                                    {friend.firstName} {friend.lastName}
                                                </Link>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">@{friend.username}</p>
                                            </div>
                                            <button onClick={() => handleRemoveFriendFromList(friend.id)} className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 bg-red-600 text-white hover:bg-red-700`}>
                                                <User size={16} /> 
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            
            {selectedImage && (
                <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
            )}

            
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

            
            {toastMessage && (
                <div className="fixed bottom-6 right-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-fadeInFromBottom z-50">
                    <Check size={20} className={`text-${accentColor}-500 dark:text-${accentColor}-500`} />
                    <div>
                        <h4 className="font-bold text-sm">{toastMessage.title}</h4>
                        <p className="text-xs opacity-80">{toastMessage.message}</p>
                    </div>
                    <button onClick={() => setToastMessage(null)} className="ml-4 p-1 hover:bg-white/20 dark:hover:bg-black/10 rounded-lg transition-colors">
                        <X size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

