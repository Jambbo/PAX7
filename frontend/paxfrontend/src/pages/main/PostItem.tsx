import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Heart, Eye, MessageSquare, Bookmark, Edit3, Trash2, Loader2,
    Send, ThumbsDown, AlertTriangle, X, CheckCircle, AlertCircle } from 'lucide-react';

import { AuthModal } from '../../widgets/AuthModal/AuthModal';

import {
    Post,
    Comment,
    fetchComments,
    createComment,
    updateComment,
    deleteComment,
    likeComment,
    dislikeComment,
    removeCommentInteraction
} from './postServise';

interface PostItemProps {
    post: Post;
    currentUserId: string | null;
    isPageOwner: boolean;
    accentColor: string;
    isLiked: boolean;
    onLikeToggle: (postId: number, e: React.MouseEvent) => void;
    onDeleteClick: (postId: number) => void;
    onEditSave: (postId: number, newText: string) => Promise<void>;
    onImageClick: (imageUrl: string) => void;
    isSaved?: boolean;
    onSaveToggle?: (postId: number, e: React.MouseEvent) => void;
}

export const PostItem: React.FC<PostItemProps> = ({
                                                      post,
                                                      currentUserId,
                                                      isPageOwner,
                                                      accentColor,
                                                      isLiked,
                                                      onLikeToggle,
                                                      onDeleteClick,
                                                      onEditSave,
                                                      onImageClick,
                                                      isSaved,
                                                      onSaveToggle
                                                  }) => {
    const navigate = useNavigate();

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const [isEditing, setIsEditing] = useState(false);
    const [editPostText, setEditPostText] = useState(post.text);
    const [isUpdatingPost, setIsUpdatingPost] = useState(false);
    const [isTextExpanded, setIsTextExpanded] = useState(false);

    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [newCommentText, setNewCommentText] = useState("");
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editCommentText, setEditCommentText] = useState("");
    const [isUpdatingComment, setIsUpdatingComment] = useState(false);

    const [commentInteractions, setCommentInteractions] = useState<Record<number, 'LIKE' | 'DISLIKE'>>(() => {
        const saved = localStorage.getItem('pax_comment_interactions');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem('pax_comment_interactions', JSON.stringify(commentInteractions));
    }, [commentInteractions]);

    const [authModal, setAuthModal] = useState({ isOpen: false, title: "", message: "" });
    const [deleteCommentId, setDeleteCommentId] = useState<number | null>(null);
    const [isDeletingComment, setIsDeletingComment] = useState(false);

    const canEditOrDelete = isPageOwner || post.authorId === currentUserId;

    const requireAuth = (title: string, message: string) => {
        if (!currentUserId) {
            setAuthModal({ isOpen: true, title, message });
            return false;
        }
        return true;
    };

    const handlePostLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (requireAuth("Authentication Required", "You need to log in to like this post.")) {
            onLikeToggle(post.id, e);
        }
    };

    const handlePostSave = (e: React.MouseEvent) => {
        e.stopPropagation();

        const token = localStorage.getItem("access_token");

        if (!token || token === "undefined") {
            setIsAuthModalOpen(true);
            return;
        }

        if (onSaveToggle) {
            onSaveToggle(post.id, e);
            setToast({
                message: isSaved ? "Removed from bookmarks" : "Added to bookmarks",
                type: 'success'
            });
        }
    };

    const handleSavePostEdit = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!editPostText.trim()) return;
        setIsUpdatingPost(true);
        try {
            await onEditSave(post.id, editPostText);
            setIsEditing(false);
        } catch (err) {
            console.error("Error saving post", err);
        } finally {
            setIsUpdatingPost(false);
        }
    };


    const toggleComments = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isCommentsOpen) {
            setIsCommentsOpen(true);
            setIsLoadingComments(true);
            try {
                const fetchedComments = await fetchComments(post.id);
                setComments(fetchedComments.reverse());
            } catch (err) {
                console.error("Error loading comments", err);
            } finally {
                setIsLoadingComments(false);
            }
        } else {
            setIsCommentsOpen(false);
        }
    };

    const handleCreateComment = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!newCommentText.trim() || !currentUserId) return;
        setIsSubmittingComment(true);
        try {
            const newComment = await createComment(post.id, newCommentText);
            setComments([newComment, ...comments]);
            setNewCommentText("");
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleDeleteCommentClick = (commentId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteCommentId(commentId);
    };

    const confirmDeleteComment = async () => {
        if (deleteCommentId === null) return;
        setIsDeletingComment(true);
        try {
            await deleteComment(post.id, deleteCommentId);
            setComments(comments.filter(c => c.id !== deleteCommentId));
            setDeleteCommentId(null);
        } catch (err) {
            console.error("Error deleting comment", err);
        } finally {
            setIsDeletingComment(false);
        }
    };

    const handleStartEditComment = (comment: Comment, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingCommentId(comment.id);
        setEditCommentText(comment.content);
    };

    const handleSaveEditComment = async (commentId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!editCommentText.trim()) return;
        setIsUpdatingComment(true);
        try {
            const updatedComment = await updateComment(post.id, commentId, editCommentText);
            setComments(comments.map(c => c.id === commentId ? updatedComment : c));
            setEditingCommentId(null);
        } catch (err) {
            console.error("Error updating comment", err);
        } finally {
            setIsUpdatingComment(false);
        }
    };

    const handleLikeComment = async (commentId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!requireAuth("Authentication Required", "Please log in to like comments.")) return;

        const currentInteraction = commentInteractions[commentId];

        try {
            let updatedComment;
            if (currentInteraction === 'LIKE') {
                updatedComment = await removeCommentInteraction(post.id, commentId);
                setCommentInteractions(prev => {
                    const next = { ...prev };
                    delete next[commentId];
                    return next;
                });
            } else {
                updatedComment = await likeComment(post.id, commentId);
                setCommentInteractions(prev => ({ ...prev, [commentId]: 'LIKE' }));
            }
            setComments(comments.map(c => c.id === commentId ? updatedComment : c));
        } catch (err) {
            console.error("Error liking comment", err);
        }
    };

    const handleDislikeComment = async (commentId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!requireAuth("Authentication Required", "Please log in to dislike comments.")) return;

        const currentInteraction = commentInteractions[commentId];

        try {
            let updatedComment;
            if (currentInteraction === 'DISLIKE') {
                updatedComment = await removeCommentInteraction(post.id, commentId);
                setCommentInteractions(prev => {
                    const next = { ...prev };
                    delete next[commentId];
                    return next;
                });
            } else {
                updatedComment = await dislikeComment(post.id, commentId);
                setCommentInteractions(prev => ({ ...prev, [commentId]: 'DISLIKE' }));
            }
            setComments(comments.map(c => c.id === commentId ? updatedComment : c));
        } catch (err) {
            console.error("Error disliking comment", err);
        }
    };

    const renderImages = (images?: string[]) => {
        if (!images || images.length === 0) return null;
        const count = images.length;
        const gridClass = count === 1 ? "grid-cols-1" : count === 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3";

        return (
            <div className={`grid ${gridClass} gap-2 mb-4 rounded-xl overflow-hidden`}>
                {images.map((imgUrl, index) => (
                    <div
                        key={index}
                        className="relative aspect-video group overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            onImageClick(imgUrl);
                        }}
                    >
                        <img src={imgUrl} alt={`Post image ${index + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="text-white" size={24} />
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const handleProfileClick = (e: React.MouseEvent, userId: string | undefined) => {
        e.stopPropagation();
        if (userId) {
            navigate(`/profile/${userId}`);
        }
    };

    return (
        <div
            className={`bg-white dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700/50 rounded-2xl p-5 hover:border-gray-300 transition-all shadow-sm group relative cursor-pointer ${
                isTextExpanded ? `ring-1 ring-${accentColor}-500/50 bg-gray-50 dark:bg-gray-800/50` : ''
            }`}
        >
            
            <div className="flex items-start justify-between mb-3">
                
                <div
                    className="flex items-center gap-3 cursor-pointer group/author hover:opacity-80 transition-opacity"
                    onClick={(e) => handleProfileClick(e, post.authorId)}
                    title="View Profile"
                >
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-500 uppercase text-xs border border-gray-300 dark:border-gray-600">
                        {post.authorUsername ? post.authorUsername[0] : '?'}
                    </div>
                    <div>
                        <p className={`font-bold text-gray-900 dark:text-white text-sm group-hover/author:text-${accentColor}-600 dark:group-hover/author:text-${accentColor}-400 transition-colors`}>
                            {post.authorUsername || `User ID: ${post.authorId}`}
                        </p>
                        <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>

                {canEditOrDelete && (
                    <div className="flex items-center gap-2">
                        {String(post.authorId) === String(currentUserId) && (
                            <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); setIsCommentsOpen(false); }} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-800/50 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors" title="Edit Post">
                                <Edit3 size={18} />
                            </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); onDeleteClick(post.id); }} className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/10 dark:hover:bg-red-900/30 dark:text-red-400 transition-colors" title="Delete Post">
                            <Trash2 size={18} />
                        </button>
                    </div>
                )}
            </div>

            
            {renderImages(post.images)}

            
            <div className="w-full mb-4">
                {isEditing ? (
                    <div onClick={e => e.stopPropagation()} className="mt-2 w-full animate-fadeIn">
                        <textarea
                            value={editPostText}
                            onChange={(e) => setEditPostText(e.target.value)}
                            className={`w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-${accentColor}-500 outline-none resize-none min-h-[100px]`}
                        />
                        <div className="flex justify-end gap-2 mt-3">
                            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
                            <button onClick={handleSavePostEdit} disabled={isUpdatingPost} className={`px-4 py-2 text-sm bg-${accentColor}-600 text-white rounded-lg hover:bg-${accentColor}-700 transition-colors disabled:opacity-50`}>
                                {isUpdatingPost ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <p onClick={() => setIsTextExpanded(!isTextExpanded)} className={`text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed ${isTextExpanded ? '' : 'line-clamp-3'}`}>
                        {post.text}
                    </p>
                )}
            </div>

            
            
            <div className="flex items-center gap-6 pt-4 border-t border-gray-100 dark:border-gray-700 text-gray-500">
                <button
                    onClick={handlePostLike}
                    className={`flex items-center gap-2 transition-colors ${isLiked ? `text-red-500` : `hover:text-red-500`}`}
                    title={isLiked ? 'Unlike' : 'Like'}
                >
                    <Heart size={18} className={isLiked ? "fill-current" : ""} />
                    <span className="font-medium text-sm">{post.likes || 0}</span>
                </button>

                <button
                    onClick={toggleComments}
                    className={`flex items-center gap-2 transition-colors ${isCommentsOpen ? `text-${accentColor}-500` : `hover:text-${accentColor}-500`}`}
                    title="Comments"
                >
                    <MessageSquare size={18} className={isCommentsOpen ? "fill-current" : ""} />
                </button>

                <button
                    onClick={handlePostSave}
                    className={`flex items-center gap-2 transition-colors ${isSaved ? `text-${accentColor}-500` : `hover:text-${accentColor}-500`}`}
                    title={isSaved ? "Remove Bookmark" : "Save"}
                >
                    <Bookmark size={18} className={isSaved ? "fill-current" : ""} />
                </button>

                
                <AuthModal
                    isOpen={isAuthModalOpen}
                    onClose={() => setIsAuthModalOpen(false)}
                    title="Bookmark Post"
                    message="You need to be logged in to save this post to your bookmarks."
                />

                
                {toast && (
                    <div className={`fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl animate-fadeIn border ${
                        toast.type === 'success'
                            ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/90 dark:border-green-800 dark:text-green-300'
                            : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/90 dark:border-red-800 dark:text-red-300'
                    }`}>
                        {toast.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                        <span className="font-semibold text-sm mr-2">{toast.message}</span>
                        <button
                            onClick={(e) => { e.stopPropagation(); setToast(null); }}
                            className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}
            </div>
            
            {isCommentsOpen && (
                <div className="pt-5 mt-5 border-t border-gray-200 dark:border-gray-700 animate-fadeIn" onClick={e => e.stopPropagation()}>

                    {currentUserId ? (
                        <div className="flex gap-3 mb-6 items-center">
                            <div className={`w-9 h-9 rounded-full bg-${accentColor}-100 dark:bg-${accentColor}-900/30 flex-shrink-0 flex items-center justify-center text-sm font-bold text-${accentColor}-600`}>
                                Me
                            </div>
                            <div className="flex-1 flex items-center bg-gray-100 dark:bg-gray-900 rounded-full px-4 py-1.5 focus-within:ring-2 focus-within:ring-${accentColor}-500/50 transition-all">
                                <input
                                    type="text"
                                    value={newCommentText}
                                    onChange={(e) => setNewCommentText(e.target.value)}
                                    placeholder="Write a comment..."
                                    className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleCreateComment(e as any);
                                    }}
                                />
                                <button
                                    onClick={handleCreateComment}
                                    disabled={!newCommentText.trim() || isSubmittingComment}
                                    className={`ml-2 p-1.5 text-${accentColor}-600 hover:text-${accentColor}-700 dark:text-${accentColor}-500 disabled:opacity-40 transition-colors`}
                                    title="Send"
                                >
                                    {isSubmittingComment ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-3 mb-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-sm text-gray-500">
                            Please <span className={`text-${accentColor}-500 font-medium cursor-pointer`} onClick={() => setAuthModal({ isOpen: true, title: "Authentication Required", message: "Please log in to leave a comment." })}>log in</span> to leave a comment.
                        </div>
                    )}

                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                        {isLoadingComments ? (
                            <div className="text-center py-6"><Loader2 size={28} className={`animate-spin text-${accentColor}-500 mx-auto`} /></div>
                        ) : comments.length === 0 ? (
                            <div className="text-center py-6 text-sm text-gray-500 italic">No comments yet. Be the first to start the discussion!</div>
                        ) : (
                            comments.map(comment => {
                                const isLiked = commentInteractions[comment.id] === 'LIKE';
                                const isDisliked = commentInteractions[comment.id] === 'DISLIKE';

                                return (
                                    <div key={comment.id} className="flex gap-3 group/comment">
                                        
                                        <div
                                            className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={(e) => handleProfileClick(e, comment.authorId)}
                                            title="View Profile"
                                        >
                                            {comment.authorUsername ? comment.authorUsername[0].toUpperCase() : '?'}
                                        </div>
                                        <div className="flex-1">
                                            <div className="bg-gray-100 dark:bg-gray-800/60 rounded-2xl rounded-tl-sm p-3 relative shadow-sm">
                                                <div className="flex justify-between items-start mb-1">
                                                    
                                                    <span
                                                        className={`font-bold text-[13px] text-gray-900 dark:text-white cursor-pointer hover:text-${accentColor}-600 dark:hover:text-${accentColor}-400 transition-colors`}
                                                        onClick={(e) => handleProfileClick(e, comment.authorId)}
                                                    >
                                                        {comment.authorUsername || `User ${comment.authorId}`}
                                                    </span>
                                                    <span className="text-[11px] text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                                </div>

                                                {editingCommentId === comment.id ? (
                                                    <div className="mt-2">
                                                    <textarea
                                                        value={editCommentText}
                                                        onChange={(e) => setEditCommentText(e.target.value)}
                                                        className={`w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-${accentColor}-500 outline-none resize-none min-h-[60px]`}
                                                    />
                                                        <div className="flex justify-end gap-2 mt-2">
                                                            <button onClick={() => setEditingCommentId(null)} className="px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors">Cancel</button>
                                                            <button onClick={(e) => handleSaveEditComment(comment.id, e)} disabled={isUpdatingComment} className={`px-3 py-1 text-xs font-medium bg-${accentColor}-600 hover:bg-${accentColor}-700 text-white rounded-md transition-colors disabled:opacity-50`}>
                                                                {isUpdatingComment ? "Saving..." : "Save"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{comment.content}</p>
                                                )}
                                            </div>

                                            {!editingCommentId && (
                                                <div className="flex items-center gap-4 mt-1.5 ml-2 text-xs font-medium text-gray-500">
                                                    <button onClick={(e) => handleLikeComment(comment.id, e)} className={`hover:text-red-500 transition-colors flex items-center gap-1 ${isLiked ? 'text-red-500' : ''}`}>
                                                        <Heart size={14} className={isLiked ? "fill-current" : ""} />
                                                        {comment.likes > 0 ? comment.likes : 'Like'}
                                                    </button>

                                                    <button onClick={(e) => handleDislikeComment(comment.id, e)} className={`hover:text-blue-500 transition-colors flex items-center gap-1 ${isDisliked ? 'text-blue-500' : ''}`}>
                                                        <ThumbsDown size={14} className={isDisliked ? "fill-current" : ""} />
                                                        {(comment.dislikes && comment.dislikes > 0) ? comment.dislikes : 'Dislike'}
                                                    </button>

                                                    {(comment.authorId === currentUserId || isPageOwner) && (
                                                        <div className="flex items-center gap-3 opacity-0 group-hover/comment:opacity-100 transition-opacity ml-auto mr-2">
                                                            {comment.authorId === currentUserId && (
                                                                <button onClick={(e) => handleStartEditComment(comment, e)} className="hover:text-gray-900 dark:hover:text-white transition-colors">Edit</button>
                                                            )}
                                                            <button onClick={(e) => handleDeleteCommentClick(comment.id, e)} className="hover:text-red-500 transition-colors">Delete</button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            
            <AuthModal
                isOpen={authModal.isOpen}
                onClose={() => setAuthModal({ ...authModal, isOpen: false })}
                title={authModal.title}
                message={authModal.message}
            />

            
            {deleteCommentId !== null && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn" onClick={() => setDeleteCommentId(null)}>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-zoomIn relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setDeleteCommentId(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                            <X size={24} />
                        </button>

                        <div className="flex flex-col items-center text-center mt-4">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle size={32} />
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                Delete Comment?
                            </h3>

                            <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                                Are you sure you want to delete this comment? This action cannot be undone.
                            </p>

                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setDeleteCommentId(null)}
                                    className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeleteComment}
                                    disabled={isDeletingComment}
                                    className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-red-500/30 flex justify-center items-center gap-2 disabled:opacity-50"
                                >
                                    {isDeletingComment ? <Loader2 size={18} className="animate-spin" /> : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};