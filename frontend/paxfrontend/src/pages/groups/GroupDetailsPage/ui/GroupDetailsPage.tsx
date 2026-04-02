import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Users, MessageSquare, Shield, Lock, Check, UserPlus, Loader2, Eye, Heart, Globe, X, Image as ImageIcon, Send, Trash2, AlertTriangle, Settings, Edit3, Bookmark } from 'lucide-react';
import { fetchGroupById, joinGroup, leaveGroup, fetchMyGroups, deleteGroup, updateGroup, Group } from '../../groupsService';
import { fetchGroupPosts, createPost, deletePost, updatePost, likePost, unlikePost, sortPosts, addBookmark,
    removeBookmark, Post } from '../../../main/postServise';
import { AuthModal } from '../../../../widgets/AuthModal/AuthModal';

import { PostItem } from '../../../main/PostItem';

interface ImageModalProps {
    imageUrl: string;
    onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose }) => {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
                <X size={24} />
            </button>
            <img
                src={imageUrl}
                alt="Full size"
                className="max-w-full max-h-[90vh] rounded-lg shadow-2xl animate-zoomIn"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
};

interface UserData {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
}

const MembersModal: React.FC<{ groupId: number, onClose: () => void, accentColor: string }> = ({ groupId, onClose, accentColor }) => {
    const [members, setMembers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const token = localStorage.getItem("access_token");
                const headers = token && token !== "undefined" ? { "Authorization": `Bearer ${token}` } : {};

                let res = await fetch(`http://localhost:8081/api/v1/users/group/${groupId}`, { headers: headers as any });

                if (res.ok) {
                    const data = await res.json();
                    const list = Array.isArray(data) ? data : (data.content || []);
                    setMembers(list);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchMembers();

        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [groupId, onClose]);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl animate-zoomIn relative flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="font-bold text-xl text-gray-900 dark:text-white flex items-center gap-2">
                        <Users size={22} className={`text-${accentColor}-500`} /> Members
                    </h3>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="overflow-y-auto p-3 flex-1">
                    {loading ? (
                        <div className="flex justify-center py-10"><Loader2 className={`animate-spin text-${accentColor}-500`} size={30} /></div>
                    ) : members.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">No members found.</div>
                    ) : (
                        <div className="space-y-1">
                            {members.map(user => (
                                <Link to={`/profile/${user.id}`} key={user.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <div className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-white font-bold bg-${accentColor}-600 flex-shrink-0`}>
                                        {user.avatarUrl ? <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover"/> : user.username.substring(0, 1).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-900 dark:text-white text-base">{user.firstName} {user.lastName}</span>
                                        <span className="text-sm text-gray-500">@{user.username}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const GroupDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const groupId = Number(id);

    const [accentColor, setAccentColor] = useState(() => localStorage.getItem('site_accent_color') || 'purple');
    const [group, setGroup] = useState<Group | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [postToDeleteId, setPostToDeleteId] = useState<number | null>(null);
    const [isDeletingPost, setIsDeletingPost] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({ name: "", description: "", visibility: "public", location: "" });
    const [isUpdating, setIsUpdating] = useState(false);

    const [isCreating, setIsCreating] = useState(false);
    const [newPostText, setNewPostText] = useState("");
    const [isSubmittingPost, setIsSubmittingPost] = useState(false);

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

    const [authModal, setAuthModal] = useState({ isOpen: false, title: "", message: "" });
    const requireAuth = (title: string, message: string) => {
        const token = localStorage.getItem("access_token");
        if (!token || token === "undefined") {
            setAuthModal({ isOpen: true, title, message });
            return false;
        }
        return true;
    };

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem("access_token");

                if (token && token !== "undefined") {
                    setIsLoggedIn(true);
                    try {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        setCurrentUserId(payload.sub);
                    } catch (e) {
                        console.error("Token parsing error", e);
                    }
                } else {
                    setIsLoggedIn(false);
                    setCurrentUserId(null);
                }

                const groupPromise = fetchGroupById(groupId);
                const postsPromise = fetchGroupPosts(groupId).catch(() => []);
                const myGroupsPromise = token ? fetchMyGroups().catch(() => []) : Promise.resolve([]);

                const [groupData, postsData, myGroupsData] = await Promise.all([
                    groupPromise,
                    postsPromise,
                    myGroupsPromise
                ]);

                const isUserJoined = myGroupsData.some((myGroup: Group) => myGroup.id === groupId);
                setGroup({ ...groupData, isJoined: isUserJoined });

                setEditFormData({
                    name: groupData.name || "",
                    description: groupData.description || "",
                    visibility: groupData.groupPrivacy ? String(groupData.groupPrivacy).toLowerCase() : "public",
                    location: groupData.location || ""
                });

                setPosts(sortPosts(postsData, 'date'));

            } catch (err) {
                console.error("Error loading community page:", err);
            } finally {
                setIsLoading(false);
            }
        };
        if (groupId) loadData();
    }, [groupId]);

    const isOwner = group?.ownerId === currentUserId;

    const handleUpdateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            const updatedGroup = await updateGroup(groupId, editFormData);
            setGroup(prev => prev ? { ...prev, ...updatedGroup, isJoined: prev.isJoined } : null);
            setIsEditModalOpen(false);
        } catch (err) {
            alert("Error updating community");
        } finally {
            setIsUpdating(false);
        }
    };

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

        if (isLiked) {
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
            setLikedPosts(prev => new Set(prev).add(postId));
            setPosts(posts.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));

            if (typeof setProfileLikedPosts !== 'undefined') {
                setProfileLikedPosts(prev => [{ ...postToUpdate, likes: postToUpdate.likes + 1 }, ...prev]);
            }
        }

        try {
            const updatedPostFromServer = await likePost(postId);

            if (updatedPostFromServer && updatedPostFromServer.id) {
                setPosts(prev => prev.map(p => p.id === postId ? updatedPostFromServer : p));
            }
        } catch (err) {
            console.error("Error changing like status on server", err);
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
            setSavedPosts(prev => { const next = new Set(prev); next.delete(postId); return next; });
            try { await removeBookmark(postId); } catch (err) { console.error("Error deleting bookmark", err); }
        } else {
            setSavedPosts(prev => new Set(prev).add(postId));
            try { await addBookmark(postId); } catch (err) { console.error("Error adding bookmark", err); }
        }
    };

    const handleSaveEdit = async (postId: number, newText: string) => {
        const postToEdit = posts.find(p => p.id === postId);
        if (!postToEdit) return;

        try {
            const updatedPost = await updatePost(postId, {
                id: postId,
                text: newText,
                groupId: postToEdit.groupId || groupId
            });
            setPosts(posts.map(p => p.id === postId ? updatedPost : p));
        } catch (err) {
            console.error(err);
            alert("Save error! Open console (F12) to see exact reason from backend.");
            throw err;
        }
    };

    const confirmDeletePost = async () => {
        if (postToDeleteId === null) return;
        setIsDeletingPost(true);
        try {
            await deletePost(postToDeleteId);
            setPosts(posts.filter(p => p.id !== postToDeleteId));
            setPostToDeleteId(null);
        } catch (err) {
            alert("Error! Backend might not allow community owner to delete others posts. Tell a friend to fix PostController.");
        } finally {
            setIsDeletingPost(false);
        }
    };

    const toggleJoin = async () => {
        if (!group) return;
        if (!requireAuth("Join Community", "You need to log in to join communities and interact.")) return;

        try {
            if (group.isJoined) {
                await leaveGroup(groupId);
                setGroup({ ...group, isJoined: false, memberCount: Math.max(0, (group.memberCount || 1) - 1) });
            } else {
                await joinGroup(groupId);
                setGroup({ ...group, isJoined: true, memberCount: (group.memberCount || 0) + 1 });
            }
        } catch (err) {
            console.error("Error:", err);
            alert("Error changing status. Check the console.");
        }
    };

    const handleDeleteGroup = async () => {
        setIsDeleting(true);
        try {
            await deleteGroup(groupId);
            navigate('/groups');
        } catch (err) {
            console.error("Deletion error:", err);
            alert("Failed to delete community. Check console.");
            setIsDeleting(false);
        }
    };

    const handleCreatePost = async () => {
        if (!newPostText.trim()) return alert("Post cannot be empty!");
        if (!requireAuth("Create Post", "You need to log in to create a post.")) return;

        setIsSubmittingPost(true);
        try {
            const newPost = await createPost({
                text: newPostText,
                groupId: groupId
            });

            setPosts([newPost, ...posts]);
            setNewPostText("");
            setIsCreating(false);
        } catch (err) {
            console.error(err);
            alert("Error creating post. Server rejected request.");
        } finally {
            setIsSubmittingPost(false);
        }
    };

    if (isLoading) {
        return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className={`animate-spin text-${accentColor}-600`} size={40} /></div>;
    }

    if (!group) {
        return <div className="text-center py-20"><h2 className="text-2xl font-bold">Group not found</h2></div>;
    }

    const bannerClass = group.groupPrivacy === 'PUBLIC' ? "from-blue-500 to-cyan-600" : "from-orange-500 to-red-600";
    const avatar = group.name.substring(0, 2).toUpperCase();

    return (
        <div className="max-w-7xl mx-auto pb-10">
            <button
                onClick={() => navigate('/groups')}
                className={`flex items-center gap-2 text-gray-500 hover:text-${accentColor}-600 mb-6 transition-colors`}
            >
                <ArrowLeft size={20} /> Back to Communities
            </button>

            <div className={`h-48 md:h-64 rounded-3xl bg-gradient-to-r ${bannerClass} relative shadow-lg mb-20`}>
                <div className="absolute -bottom-12 left-8 flex items-end gap-6">
                    <div className={`w-28 h-28 rounded-2xl bg-gradient-to-r ${bannerClass} border-4 border-white dark:border-gray-900 flex items-center justify-center text-4xl font-bold text-white shadow-xl`}>
                        {avatar}
                    </div>
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                    {group.groupPrivacy === 'PRIVATE' && (
                        <div className="bg-black/30 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-2 text-white text-sm font-medium">
                            <Lock size={14} /> Private
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4">
                <div className="lg:col-span-1 space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{group.name}</h1>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">{group.description}</p>

                        
                        {isOwner ? (
                            <button
                                onClick={() => {
                                    if (group) {
                                        setEditFormData({
                                            name: group.name || "",
                                            description: group.description || "",
                                            visibility: group.groupPrivacy ? String(group.groupPrivacy).toLowerCase() : "public",
                                            location: group.location || ""
                                        });
                                    }
                                    setIsEditModalOpen(true);
                                }}
                                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-${accentColor}-100 dark:bg-${accentColor}-900/20 text-${accentColor}-600 dark:text-${accentColor}-400 hover:bg-${accentColor}-200 dark:hover:bg-${accentColor}-900/40 transition-all shadow-sm`}
                            >
                                <Settings size={20} /> Edit Settings
                            </button>
                        ) : (
                            <button
                                onClick={toggleJoin}
                                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center transition-all group ${
                                    group.isJoined
                                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400'
                                        : `bg-${accentColor}-600 hover:bg-${accentColor}-700 text-white shadow-lg shadow-${accentColor}-500/20`
                                }`}
                            >
                                {group.isJoined ? (
                                    <>
                                        <div className="flex items-center gap-2 group-hover:hidden"><Check size={20} /> Joined</div>
                                        <div className="hidden items-center gap-2 group-hover:flex"><X size={20} /> Leave Community</div>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2"><UserPlus size={20} /> Join Community</div>
                                )}
                            </button>
                        )}
                    </div>

                    <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-6 rounded-2xl shadow-sm">
                        <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">About</h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 flex items-center gap-2"><Globe size={16}/> Privacy</span>
                                <span className="font-medium text-gray-900 dark:text-white">{group.groupPrivacy}</span>
                            </div>
                            <div
                                className="flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 -mx-2 rounded-lg transition-colors group"
                                onClick={() => setIsMembersModalOpen(true)}
                            >
                                <span className="text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300 flex items-center gap-2 transition-colors"><Users size={16}/> Members</span>
                                <span className="font-medium text-gray-900 bg-gray-100 dark:bg-gray-800 dark:text-white px-2 py-0.5 rounded-md group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">{group.memberCount || 0}</span>
                            </div>
                            {group.location && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Location</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{group.location}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    
                    {isLoggedIn && (
                        <div className={`bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden transition-all duration-300 ease-in-out ${isCreating ? `ring-2 ring-${accentColor}-500/50` : ''}`}>
                            {!isCreating ? (
                                <div
                                    onClick={() => {
                                        if (requireAuth("Create Post", "You need to log in to create a post.")) setIsCreating(true);
                                    }}
                                    className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <div className={`w-10 h-10 rounded-full bg-${accentColor}-100 dark:bg-${accentColor}-900/30 flex items-center justify-center font-bold text-${accentColor}-600`}>Me</div>
                                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2.5 text-gray-500 dark:text-gray-400 text-sm">Write something in this community...</div>
                                    <div className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><ImageIcon size={20} /></div>
                                </div>
                            ) : (
                                <div className="p-4 animate-fadeIn">
                                    <div className="flex gap-4">
                                        <div className={`w-10 h-10 rounded-full bg-${accentColor}-100 dark:bg-${accentColor}-900/30 flex items-center justify-center font-bold text-${accentColor}-600 shrink-0`}>Me</div>
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

                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <button className={`p-2 text-gray-400 hover:text-${accentColor}-500 hover:bg-${accentColor}-50 dark:hover:bg-${accentColor}-900/20 rounded-lg transition-colors`} title="Attach Image">
                                                <ImageIcon size={20} />
                                            </button>
                                        </div>

                                        <div className="flex gap-2">
                                            <button onClick={() => { setIsCreating(false); setNewPostText(""); }} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors">Cancel</button>
                                            <button onClick={handleCreatePost} disabled={isSubmittingPost || !newPostText.trim()} className={`px-5 py-2 bg-${accentColor}-600 hover:bg-${accentColor}-700 text-white rounded-lg font-medium flex items-center gap-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}>
                                                {isSubmittingPost ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Post
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    
                    <div className="space-y-6">
                        {posts.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/20 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                                <MessageSquare size={48} className="mx-auto text-gray-400 mb-3 opacity-50" />
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">No posts yet</h3>
                                <p className="text-gray-500">Be the first to start a discussion in {group.name}!</p>
                            </div>
                        ) : (
                            posts.map(post => {
                                const isLiked = likedPosts.has(post.id);
                                return (
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
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn" onClick={() => setIsEditModalOpen(false)}>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-zoomIn relative" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Edit3 className={`text-${accentColor}-500`} /> Edit Community</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleUpdateGroup} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Community Name</label>
                                <input required type="text" value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} className={`w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent outline-none`} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                <textarea required value={editFormData.description} onChange={(e) => setEditFormData({...editFormData, description: e.target.value})} className={`w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent outline-none resize-none h-24`} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location (Optional)</label>
                                <input type="text" value={editFormData.location} onChange={(e) => setEditFormData({...editFormData, location: e.target.value})} className={`w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent outline-none`} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Privacy</label>
                                <select value={editFormData.visibility} onChange={(e) => setEditFormData({...editFormData, visibility: e.target.value})} className={`w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent outline-none`}>
                                    <option value="public">Public - Anyone can see posts</option>
                                    <option value="private">Private - Only members can see posts</option>
                                </select>
                            </div>

                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 mt-6 space-y-3">
                                <button type="submit" disabled={isUpdating} className={`w-full py-3 bg-${accentColor}-600 hover:bg-${accentColor}-700 text-white rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-${accentColor}-500/30 disabled:opacity-50`}>
                                    {isUpdating ? <Loader2 size={20} className="animate-spin" /> : "Save Changes"}
                                </button>

                                <button type="button" onClick={() => { setIsEditModalOpen(false); setShowDeleteConfirm(true); }} className="w-full py-3 bg-red-50 dark:bg-red-900/10 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl font-bold transition-colors">
                                    Delete Community
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <AuthModal isOpen={authModal.isOpen} onClose={() => setAuthModal({...authModal, isOpen: false})} title={authModal.title} message={authModal.message} />

            {selectedImage && (
                <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
            )}

            
            {showDeleteConfirm && (
                <div
                    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn"
                    onClick={() => setShowDeleteConfirm(false)}
                >
                    <div
                        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-zoomIn relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <X size={24} />
                        </button>

                        <div className="flex flex-col items-center text-center mt-4">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle size={32} />
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                Delete Community?
                            </h3>

                            <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                                Are you sure you want to delete <strong>{group.name}</strong>? This action cannot be undone. All posts and members will be removed.
                            </p>

                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteGroup}
                                    disabled={isDeleting}
                                    className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-red-500/30 flex justify-center items-center gap-2 disabled:opacity-50"
                                >
                                    {isDeleting ? <Loader2 size={18} className="animate-spin" /> : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            
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
                            <X size={24} />
                        </button>

                        <div className="flex flex-col items-center text-center mt-4">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle size={32} />
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
                                    {isDeletingPost ? <Loader2 size={18} className="animate-spin" /> : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isMembersModalOpen && (
                <MembersModal
                    groupId={groupId}
                    onClose={() => setIsMembersModalOpen(false)}
                    accentColor={accentColor}
                />
            )}
        </div>
    );
};



