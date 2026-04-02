import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { TrendingUp, Flame, ArrowUp, Award, Users, Hash, Loader2, X, AlertTriangle } from 'lucide-react';

import { fetchAllPosts, sortPosts, likePost, deletePost, updatePost, Post } from '../../main/postServise';
import { PostItem } from '../../main/PostItem';
import { AuthModal } from '../../../widgets/AuthModal/AuthModal';

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

export const TrendingPage: React.FC = () => {
    const [accentColor, setAccentColor] = useState(() => localStorage.getItem('site_accent_color') || 'purple');

    useEffect(() => {
        const handleStorageChange = () => setAccentColor(localStorage.getItem('site_accent_color') || 'purple');
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('accent-color-change', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('accent-color-change', handleStorageChange);
        };
    }, []);

    const location = useLocation();

    const [activeFilter, setActiveFilter] = useState<'hot' | 'rising' | 'top' | 'hashtag'>('hot');
    const [searchHashtag, setSearchHashtag] = useState<string>('');

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const hashtagParam = queryParams.get('hashtag');
        if (hashtagParam) {
            setSearchHashtag(hashtagParam);
            setActiveFilter('hashtag');
        }
    }, [location.search]);

    const [allPosts, setAllPosts] = useState<Post[]>([]);
    const [displayedPosts, setDisplayedPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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

    useEffect(() => {
        localStorage.setItem('pax_liked_posts', JSON.stringify(Array.from(likedPosts)));
    }, [likedPosts]);

    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [postToDeleteId, setPostToDeleteId] = useState<number | null>(null);
    const [isDeletingPost, setIsDeletingPost] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            const token = localStorage.getItem("access_token");
            if (token && token !== "undefined") {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    setCurrentUserId(payload.sub);
                } catch (e) { console.error(e); }
            }

            try {
                const data = await fetchAllPosts();
                setAllPosts(data);
            } catch (error) {
                console.error("Error loading trends", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        if (allPosts.length === 0) return;

        let filtered = [...allPosts];
        const now = new Date().getTime();

        if (activeFilter === 'hot') {
            const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
            const recentPosts = filtered.filter(p => new Date(p.createdAt).getTime() > sevenDaysAgo);
            const postsToSort = recentPosts.length > 0 ? recentPosts : filtered;
            setDisplayedPosts(sortPosts(postsToSort, 'likes'));
        } else if (activeFilter === 'top') {
            setDisplayedPosts(sortPosts(filtered, 'likes'));
        } else if (activeFilter === 'rising') {
            setDisplayedPosts(sortPosts(filtered, 'date'));
        } else if (activeFilter === 'hashtag') {
            const lowerSearch = searchHashtag.toLowerCase().replace('#', '');
            if (!lowerSearch) {
                setDisplayedPosts([]);
            } else {
                setDisplayedPosts(sortPosts(filtered.filter(p => p.text.toLowerCase().includes(`#${lowerSearch}`)), 'date'));
            }
        }
    }, [activeFilter, allPosts, searchHashtag]);

    const uniqueAuthors = new Set(allPosts.map(p => p.authorId)).size;
    const today = new Date().toDateString();
    const postsToday = allPosts.filter(p => new Date(p.createdAt).toDateString() === today).length;
    const totalLikes = allPosts.reduce((acc, p) => acc + (p.likes || 0), 0);
    const engagementRate = Math.min(100, Math.round((totalLikes / Math.max(1, allPosts.length)) * 15));

    const extractHashtags = () => {
        const counts: Record<string, number> = {};
        allPosts.forEach(post => {
            const tags = post.text.match(/#[a-zA-Z0-9_а-яА-ЯіІїЇєЄ]+/g) || [];
            tags.forEach(tag => {
                const cleanTag = tag.substring(1).toLowerCase();
                counts[cleanTag] = (counts[cleanTag] || 0) + 1;
            });
        });
        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    };
    const trendingHashtags = extractHashtags();

    const handleLike = async (postId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const token = localStorage.getItem("access_token");
        if (!token || token === "undefined") {
            alert("Please log in to like posts.");
            return;
        }

        const isLiked = likedPosts.has(postId);

        if (isLiked) {
            setLikedPosts(prev => { const next = new Set(prev); next.delete(postId); return next; });
            setDisplayedPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: Math.max(0, p.likes - 1) } : p));
            setAllPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: Math.max(0, p.likes - 1) } : p));
        } else {
            setLikedPosts(prev => new Set(prev).add(postId));
            setDisplayedPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
            setAllPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
        }

        try {
            await likePost(postId);
        } catch (err) {
            console.error("Error changing like status on server", err);
        }
    };

    const handleSaveEdit = async (postId: number, newText: string) => {
        const updatedPost = await updatePost(postId, { id: postId, text: newText });
        setDisplayedPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));
        setAllPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));
    };

    const confirmDeletePost = async () => {
        if (postToDeleteId === null) return;
        setIsDeletingPost(true);
        try {
            await deletePost(postToDeleteId);
            setDisplayedPosts(prev => prev.filter(p => p.id !== postToDeleteId));
            setAllPosts(prev => prev.filter(p => p.id !== postToDeleteId));
            setPostToDeleteId(null);
        } catch (err) {
            alert("Error deleting post.");
        } finally {
            setIsDeletingPost(false);
        }
    };

    const filters = [
        { id: 'hot', label: 'Hot', icon: Flame, color: 'text-orange-500' },
        { id: 'rising', label: 'Rising', icon: TrendingUp, color: 'text-green-500' },
        { id: 'top', label: 'Top', icon: Award, color: 'text-purple-500' },
        { id: 'hashtag', label: 'Hashtag', icon: Hash, color: 'text-blue-500' }
    ];

    if (isLoading) {
        return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className={`animate-spin text-${accentColor}-600`} size={40} /></div>;
    }

    return (
        <div className="max-w-7xl mx-auto pb-10">
            
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3 transition-colors">
                    <TrendingUp className={`text-${accentColor}-500`} size={40} />
                    Trending Now
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-lg transition-colors">
                    Discover what's hot in the community right now
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                
                <div className="flex-1">
                    
                    <div className="bg-white dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700/50 rounded-xl p-2 flex gap-2 mb-6 transition-colors shadow-sm">
                        {filters.map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setActiveFilter(filter.id as 'hot' | 'rising' | 'top' | 'hashtag')}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all font-medium ${
                                    activeFilter === filter.id
                                        ? `bg-${accentColor}-600 text-white shadow-lg shadow-${accentColor}-500/20`
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                }`}
                            >
                                <filter.icon size={20} className={activeFilter === filter.id ? 'text-white' : filter.color} />
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    {activeFilter === 'hashtag' && (
                        <div className="mb-6 relative animate-fadeIn">
                            <Hash className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-400`} size={20} />
                            <input
                                type="text"
                                placeholder="Search by hashtag... (e.g. #news)"
                                value={searchHashtag}
                                onChange={(e) => setSearchHashtag(e.target.value)}
                                className={`w-full bg-white dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700/50 rounded-xl pl-12 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 transition-shadow`}
                            />
                        </div>
                    )}

                    
                    <div className="space-y-6">
                        {displayedPosts.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/20 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                                {activeFilter === 'hashtag' ? (
                                    <>
                                        <Hash size={48} className="mx-auto text-gray-400 mb-3 opacity-50" />
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">No posts match your search</h3>
                                        <p className="text-gray-500">Try searching for a different hashtag</p>
                                    </>
                                ) : (
                                    <>
                                        <Flame size={48} className="mx-auto text-gray-400 mb-3 opacity-50" />
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nothing trending right now</h3>
                                        <p className="text-gray-500">Be the first to post something amazing!</p>
                                    </>
                                )}
                            </div>
                        ) : (
                            displayedPosts.map((post, index) => (
                                <div key={post.id} className="flex gap-4 items-start animate-fadeIn">
                                    
                                    <div className={`hidden md:flex flex-shrink-0 w-12 h-12 bg-white dark:bg-gray-800 border-2 border-${accentColor}-500/30 rounded-2xl items-center justify-center shadow-sm text-${accentColor}-600 dark:text-${accentColor}-400 font-bold text-xl mt-4`}>
                                        #{index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <PostItem
                                            post={post}
                                            currentUserId={currentUserId}
                                            isPageOwner={currentUserId !== null && String(post.authorId) === String(currentUserId)}
                                            accentColor={accentColor}
                                            isLiked={currentUserId !== null && likedPosts.has(post.id)}
                                            onLikeToggle={handleLike}
                                            onDeleteClick={(id) => setPostToDeleteId(id)}
                                            onEditSave={handleSaveEdit}
                                            onImageClick={(url) => setSelectedImage(url)}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                
                <div className="lg:w-80 space-y-6">
                    
                    <div className="bg-white dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700/50 rounded-xl p-6 shadow-sm transition-colors">
                        <div className="flex items-center gap-2 mb-4">
                            <Hash className={`text-${accentColor}-500`} size={20} />
                            <h3 className="text-gray-900 dark:text-white font-bold text-lg transition-colors">Trending Topics</h3>
                        </div>
                        <div className="space-y-3">
                            {trendingHashtags.length > 0 ? (
                                trendingHashtags.map((topic, index) => (
                                    <button
                                        key={topic.name}
                                        onClick={() => {
                                            setSearchHashtag(topic.name);
                                            setActiveFilter('hashtag');
                                        }}
                                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all group"
                                    >
                                        <div className={`w-8 h-8 bg-${accentColor}-100 dark:bg-${accentColor}-900/30 rounded-lg flex items-center justify-center text-${accentColor}-600 dark:text-${accentColor}-400 font-bold text-sm shadow-sm`}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className={`text-gray-900 dark:text-white font-semibold group-hover:text-${accentColor}-600 dark:group-hover:text-${accentColor}-400 transition-colors`}>
                                                #{topic.name}
                                            </p>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm">{topic.count} mentions</p>
                                        </div>
                                        {index < 3 && <ArrowUp className="text-green-500" size={16} />}
                                    </button>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4">No hashtags trending yet. Use #tags in your posts!</p>
                            )}
                        </div>
                    </div>

                    
                    <div className={`bg-${accentColor}-50 dark:bg-${accentColor}-900/10 border border-${accentColor}-200 dark:border-${accentColor}-500/20 rounded-xl p-6 transition-colors`}>
                        <div className="flex items-center gap-2 mb-4">
                            <Users className={`text-${accentColor}-600 dark:text-${accentColor}-400`} size={20} />
                            <h3 className="text-gray-900 dark:text-white font-bold text-lg transition-colors">Community Stats</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-gray-600 dark:text-gray-400 text-sm">Active Creators</span>
                                    <span className="text-gray-900 dark:text-white font-bold">{uniqueAuthors}</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700/50 rounded-full h-2">
                                    <div className={`bg-${accentColor}-600 h-2 rounded-full`} style={{ width: `${Math.min(100, uniqueAuthors * 10)}%` }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-gray-600 dark:text-gray-400 text-sm">Posts Today</span>
                                    <span className="text-gray-900 dark:text-white font-bold">{postsToday}</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700/50 rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min(100, postsToday * 5)}%` }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-gray-600 dark:text-gray-400 text-sm">Engagement Rate</span>
                                    <span className="text-gray-900 dark:text-white font-bold">{engagementRate}%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700/50 rounded-full h-2">
                                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${engagementRate}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            
            {selectedImage && <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />}

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