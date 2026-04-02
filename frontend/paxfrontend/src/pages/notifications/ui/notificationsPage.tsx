import React, {useMemo, useState, useEffect} from 'react';
import {
    Bell,
    AtSign,
    Heart,
    UserPlus,
    MessageSquare,
    ShieldAlert,
    Check,
    CheckCheck,
    Search,
    Filter,
    Trash2,
    MoreVertical,
    Settings,
    Clock,
    UserCheck,
    X,
} from 'lucide-react';


import {useDispatch, useSelector} from 'react-redux';
import {RootState, AppDispatch} from '../../../app/layout/store';
import {
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotificationThunk,
    removeNotificationLocally
} from '../../../features/Notifications/notificationsSlice';
import { acceptFriendRequest, declineFriendRequest, fetchOutgoingRequests } from '../../profile/userService';

type NotificationType = 'mention' | 'like' | 'follow' | 'reply' | 'system' | 'friend_request';

const typeMeta: Record<
    NotificationType,
    {
        label: string;
        icon: React.ReactNode;
        pill: { bg: string; text: string; border: string };
        cardBorder: string;
        iconBg: string;
    }
> = {
    mention: {
        label: 'Mentions',
        icon: <AtSign size={18} className="text-white"/>,
        pill: {
            bg: 'bg-blue-100 dark:bg-blue-900/20',
            text: 'text-blue-700 dark:text-blue-300',
            border: 'border-blue-200 dark:border-blue-500/30'
        },
        cardBorder: 'border-blue-200 dark:border-blue-500/25',
        iconBg: 'from-blue-600 to-blue-700'
    },
    like: {
        label: 'Likes',
        icon: <Heart size={18} className="text-white"/>,
        pill: {
            bg: 'bg-pink-100 dark:bg-pink-900/20',
            text: 'text-pink-700 dark:text-pink-300',
            border: 'border-pink-200 dark:border-pink-500/30'
        },
        cardBorder: 'border-pink-200 dark:border-pink-500/25',
        iconBg: 'from-pink-600 to-pink-700'
    },
    follow: {
        label: 'Follows',
        icon: <UserPlus size={18} className="text-white"/>,
        pill: {
            bg: 'bg-green-100 dark:bg-green-900/20',
            text: 'text-green-700 dark:text-green-300',
            border: 'border-green-200 dark:border-green-500/30'
        },
        cardBorder: 'border-green-200 dark:border-green-500/25',
        iconBg: 'from-green-600 to-green-700'
    },
    friend_request: {
        label: 'Friend Requests',
        icon: <UserCheck size={18} className="text-white"/>,
        pill: {
            bg: 'bg-teal-100 dark:bg-teal-900/20',
            text: 'text-teal-700 dark:text-teal-300',
            border: 'border-teal-200 dark:border-teal-500/30'
        },
        cardBorder: 'border-teal-200 dark:border-teal-500/25',
        iconBg: 'from-teal-600 to-teal-700'
    },
    reply: {
        label: 'Replies',
        icon: <MessageSquare size={18} className="text-white"/>,
        pill: {
            bg: 'bg-purple-100 dark:bg-purple-900/20',
            text: 'text-purple-700 dark:text-purple-300',
            border: 'border-purple-200 dark:border-purple-500/30'
        },
        cardBorder: 'border-purple-200 dark:border-purple-500/25',
        iconBg: 'from-purple-600 to-purple-700'
    },
    system: {
        label: 'System',
        icon: <ShieldAlert size={18} className="text-white"/>,
        pill: {
            bg: 'bg-orange-100 dark:bg-orange-900/20',
            text: 'text-orange-700 dark:text-orange-300',
            border: 'border-orange-200 dark:border-orange-500/30'
        },
        cardBorder: 'border-orange-200 dark:border-orange-500/25',
        iconBg: 'from-orange-600 to-orange-700'
    }
};

export const NotificationsPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const notificationsRaw = useSelector((state: RootState) => state.notifications?.items || []);
    const unreadCount = useSelector((state: RootState) => state.notifications?.unreadCount || 0);

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

    const [activeFilter, setActiveFilter] = useState<'all' | NotificationType>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);
    const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
    const [toastMessage, setToastMessage] = useState<{title: string, message: string} | null>(null);

    const showToast = (title: string, message: string) => {
        setToastMessage({ title, message });
        setTimeout(() => setToastMessage(null), 3000);
    };

    useEffect(() => {
        if (activeFilter === 'friend_request') {
            fetchOutgoingRequests()
                .then(reqs => setOutgoingRequests(reqs))
                .catch(err => console.error(err));
        }
    }, [activeFilter, notificationsRaw]);

    const notifications = useMemo(() => {
        return notificationsRaw.map(n => {
            let mappedType: NotificationType = 'system';
            if (n.type === 'LIKE_POST' || n.type === 'LIKE_COMMENT') mappedType = 'like';
            else if (n.type === 'NEW_COMMENT' || n.type === 'NEW_MESSAGE') mappedType = 'reply';
            else if (n.type === 'GROUP_INVITE') mappedType = 'mention';
            else if (n.type === 'FOLLOW') mappedType = 'follow';
            else if (n.type === 'FRIEND_REQUEST') mappedType = 'friend_request';

            return {
                id: n.id,
                type: mappedType,
                title: n.type.replace('_', ' '),
                message: n.type === 'FRIEND_REQUEST' ? 'wants to be your friend' : '',
                time: new Intl.DateTimeFormat('en-US', {
                    dateStyle: 'short',
                    timeStyle: 'short'
                }).format(new Date(n.createdAt)),
                isRead: n.status === 'READ',
                actor: n.sender ? {
                    id: n.sender.id,
                    name: n.sender.username,
                    avatar: n.sender.username.substring(0, 2).toUpperCase()
                } : undefined,
                context: undefined as any,
                meta: undefined as any,
                originalType: n.type
            };
        });
    }, [notificationsRaw]);

    const filtered = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();

        return notifications.filter(n => {
            const matchesType = activeFilter === 'all' || n.type === activeFilter;
            const matchesUnread = !showUnreadOnly || !n.isRead;

            const haystack = [
                n.title,
                n.message,
                n.actor?.name ?? '',
                n.context?.label ?? '',
                n.meta?.postTitle ?? ''
            ]
                .join(' ')
                .toLowerCase();

            const matchesSearch = q.length === 0 || haystack.includes(q);
            return matchesType && matchesUnread && matchesSearch;
        });
    }, [notifications, activeFilter, showUnreadOnly, searchQuery]);

    const markAllAsRead = () => {
        dispatch(markAllNotificationsRead());
    };

    const toggleRead = (id: number) => {
        const item = notifications.find(n => n.id === id);
        if (item && !item.isRead) {
            dispatch(markNotificationRead(id));
        }
    };

    const removeNotification = (id: number) => {
        dispatch(deleteNotificationThunk(id));
    };

    const renderNotification = (n: any) => {
        const meta = typeMeta[n.type];
        const isFriendRequest = n.originalType === 'FRIEND_REQUEST';

        const handleAccept = async (e: React.MouseEvent) => {
            e.stopPropagation();
            if (!n.actor) return;
            try {
                await acceptFriendRequest(n.id, n.actor.id);
                dispatch(removeNotificationLocally(n.id));
                showToast("Accepted", "Friend request accepted!");
            } catch (err) {
                console.error(err);
                showToast("Error", "Error accepting friend request.");
            }
        };

        const handleDecline = async (e: React.MouseEvent) => {
            e.stopPropagation();
            try {
                await declineFriendRequest(n.id);
                dispatch(removeNotificationLocally(n.id));
                showToast("Filtered", "Friend request declined.");
            } catch (err) {
                console.error(err);
                showToast("Error", "Error declining friend request.");
            }
        };

        return (
            <div
                key={n.id}
                className={`group flex items-start gap-4 p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden cursor-pointer ${
                    n.isRead ? 'opacity-70 dark:opacity-90' : 'opacity-100'
                }`}
            >
                
                <div className="flex-shrink-0">
                    <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md bg-gradient-to-br ${meta.iconBg}`}
                    >
                        {meta.icon}
                    </div>
                </div>

                <div className="flex-1 min-w-0 pr-12">
                    <div className="flex items-center gap-2 mb-1 cursor-pointer">
                        <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${meta.pill.bg} ${meta.pill.text} ${meta.pill.border} uppercase tracking-wider`}
                        >
                            {meta.label}
                        </span>

                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {n.time}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                            {n.actor ? (
                                <div className="w-full h-full flex items-center justify-center text-white font-semibold bg-gray-700 dark:bg-gray-800">
                                    {n.actor.avatar}
                                </div>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100 dark:bg-gray-900">
                                    <UserCheck size={18}/>
                                </div>
                            )}
                        </div>

                        <h4 className="text-gray-900 dark:text-white font-medium text-base leading-snug">
                            {n.actor && <span className="font-bold mr-1">{n.actor.name}</span>}
                            {n.title}
                            {n.message && <span className="ml-1 text-gray-500 font-normal">{n.message}</span>}
                        </h4>
                    </div>

                    {n.context && (
                        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="text-gray-400 dark:text-gray-500">Context:</span>{' '}
                            <span className="text-gray-600 dark:text-gray-300 font-medium">{n.meta.postTitle}</span>
                        </div>
                    )}

                    {isFriendRequest && !n.isRead && (
                        <div className="mt-3 flex gap-2">
                            <button
                                onClick={handleAccept}
                                className={`px-4 py-1.5 bg-${accentColor}-600 hover:bg-${accentColor}-700 text-white text-sm font-medium rounded-lg flex items-center gap-1 transition-colors`}
                            >
                                <Check size={16} /> Accept
                            </button>
                            <button
                                onClick={handleDecline}
                                className="px-4 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-lg flex items-center gap-1 transition-colors"
                            >
                                <X size={16} /> Decline
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const token = localStorage.getItem("access_token");
    const isAuthenticated = token && token !== "undefined";

    if (!isAuthenticated) {
        return (
            <div className="max-w-4xl mx-auto py-20 text-center">
                <Bell size={64} className="mx-auto text-gray-300 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sign in to view notifications</h2>
                <p className="text-gray-500">You need to be logged in to see your notifications.</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            <div className="max-w-7xl mx-auto p-6">
                
                <div className="mb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3 transition-colors">
                            <Bell className={`text-${accentColor}-500`} size={40}/>
                            Notifications
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-lg transition-colors">Mentions, replies,
                            follows, and platform updates</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={markAllAsRead}
                            className={`px-4 py-2 rounded-lg bg-${accentColor}-100 dark:bg-${accentColor}-900/20 border border-${accentColor}-200 dark:border-${accentColor}-500/30 text-${accentColor}-700 dark:text-${accentColor}-200 hover:bg-${accentColor}-200 dark:hover:bg-${accentColor}-900/30 transition-all flex items-center gap-2 font-medium`}
                        >
                            <CheckCheck size={16}/>
                            Mark all as read
                        </button>
                        <button
                            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/50 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 transition-all flex items-center gap-2 font-medium">
                            <Settings size={16}/>
                            Settings
                        </button>
                    </div>
                </div>

                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div
                        className={`bg-${accentColor}-50 dark:bg-${accentColor}-900/10 border border-${accentColor}-200 dark:border-${accentColor}-500/20 rounded-xl p-4 shadow-sm transition-colors`}>
                        <div className="flex items-center gap-3">
                            <div
                                className={`w-10 h-10 bg-${accentColor}-600 rounded-lg flex items-center justify-center shadow-md shadow-${accentColor}-500/20`}>
                                <Bell size={20} className="text-white"/>
                            </div>
                            <div>
                                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Total</p>
                                <p className="text-gray-900 dark:text-white text-xl font-bold">{notifications.length}</p>
                            </div>
                        </div>
                    </div>

                    <div
                        className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4 shadow-sm transition-colors">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
                                <AtSign size={20} className="text-white"/>
                            </div>
                            <div>
                                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Mentions</p>
                                <p className="text-gray-900 dark:text-white text-xl font-bold">
                                    {notifications.filter(n => n.type === 'mention').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div
                        className="bg-pink-50 dark:bg-pink-900/10 border border-pink-200 dark:border-pink-500/20 rounded-xl p-4 shadow-sm transition-colors">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 bg-pink-600 rounded-lg flex items-center justify-center shadow-md shadow-pink-500/20">
                                <Heart size={20} className="text-white"/>
                            </div>
                            <div>
                                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Likes</p>
                                <p className="text-gray-900 dark:text-white text-xl font-bold">
                                    {notifications.filter(n => n.type === 'like').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div
                        className="bg-gray-100 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4 shadow-sm transition-colors">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 bg-gray-600 dark:bg-gray-700 rounded-lg flex items-center justify-center shadow-md">
                                <Clock size={20} className="text-white"/>
                            </div>
                            <div>
                                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Unread</p>
                                <p className="text-gray-900 dark:text-white text-xl font-bold">{unreadCount}</p>
                            </div>
                        </div>
                    </div>
                </div>

                
                <div
                    className="bg-white dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4 mb-6 shadow-sm transition-colors">
                    <div className="flex flex-col lg:flex-row gap-4">
                        
                        <div className="flex flex-wrap gap-2">
                            {(['all', 'mention', 'reply', 'like', 'follow', 'system'] as const).map(key => {
                                const isActive = activeFilter === key;
                                const label = key === 'all' ? 'All' : typeMeta[key].label;
                                const pill =
                                    key === 'all'
                                        ? {
                                            bg: `bg-${accentColor}-100 dark:bg-${accentColor}-900/20`,
                                            text: `text-${accentColor}-700 dark:text-${accentColor}-200`,
                                            border: `border-${accentColor}-200 dark:border-${accentColor}-500/30`
                                        }
                                        : typeMeta[key].pill;

                                return (
                                    <button
                                        key={key}
                                        onClick={() => setActiveFilter(key)}
                                        className={[
                                            'px-4 py-2 rounded-lg border transition-all text-sm font-medium',
                                            isActive
                                                ? `${pill.bg} ${pill.text} ${pill.border} shadow-sm`
                                                : 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700/40 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                                        ].join(' ')}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex-1 flex flex-col sm:flex-row gap-3">
                            
                            <div className="relative flex-1">
                                <Search
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search notifications..."
                                    className={`w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-${accentColor}-500 transition-colors`}
                                />
                            </div>

                            
                            <button
                                onClick={() => setShowUnreadOnly(v => !v)}
                                className={[
                                    'px-4 py-2 rounded-lg border transition-all flex items-center gap-2 font-medium',
                                    showUnreadOnly
                                        ? `bg-${accentColor}-100 dark:bg-${accentColor}-900/20 border-${accentColor}-200 dark:border-${accentColor}-500/30 text-${accentColor}-700 dark:text-${accentColor}-200`
                                        : 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700/50 text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                                ].join(' ')}
                            >
                                <Filter size={16}/>
                                Unread only
                            </button>
                        </div>
                    </div>
                </div>

                
                <div className="space-y-3">
                    {filtered.length === 0 ? (
                        <div
                            className="bg-white dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700/50 rounded-xl p-10 text-center shadow-sm">
                            <div
                                className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 mx-auto flex items-center justify-center mb-4">
                                <Bell size={24} className="text-gray-400 dark:text-gray-300"/>
                            </div>
                            <p className="text-gray-900 dark:text-white text-lg font-semibold mb-1">No notifications
                                found</p>
                            <p className="text-gray-500 dark:text-gray-400">Try changing filters or clearing your
                                search.</p>
                        </div>
                    ) : (
                        filtered.map(n => {
                            const meta = typeMeta[n.type];
                            const isFriendRequest = n.originalType === 'FRIEND_REQUEST';

                            return (
                                <div
                                    key={n.id}
                                    className={[
                                        'bg-white dark:bg-gray-800/30 border rounded-xl p-4 shadow-sm transition-all',
                                        n.isRead ? 'border-gray-200 dark:border-gray-800/60' : meta.cardBorder,
                                        n.isRead ? 'opacity-70 dark:opacity-90' : 'opacity-100'
                                    ].join(' ')}
                                >
                                    <div className="flex items-start gap-4">
                                        
                                        <div className="relative">
                                            <div
                                                className={[
                                                    'w-11 h-11 rounded-xl flex items-center justify-center shadow-md bg-gradient-to-br',
                                                    meta.iconBg
                                                ].join(' ')}
                                            >
                                                {meta.icon}
                                            </div>
                                            {!n.isRead && (
                                                <span
                                                    className={`absolute -top-1 -right-1 w-3 h-3 rounded-full bg-${accentColor}-500 ring-2 ring-white dark:ring-gray-900`}/>
                                            )}
                                        </div>

                                        
                                        <div className="flex-1 min-w-0">
                                            <div
                                                className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="text-gray-900 dark:text-white font-semibold truncate">{n.title}</h3>
                                                        <span
                                                            className={[
                                                                'text-xs px-2 py-1 rounded border font-medium',
                                                                meta.pill.bg,
                                                                meta.pill.text,
                                                                meta.pill.border
                                                            ].join(' ')}
                                                        >
                                                            {meta.label}
                                                        </span>

                                                        {n.context && (
                                                            <span
                                                                className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700/50 text-gray-600 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/30 flex items-center gap-2 font-medium"
                                                                title={n.context.label}
                                                            >
                                                                <span
                                                                    className={[
                                                                        'w-2.5 h-2.5 rounded-full bg-gradient-to-br',
                                                                        n.context.color
                                                                    ].join(' ')}
                                                                />
                                                                {n.context.label}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="text-gray-600 dark:text-gray-300 mt-1 leading-relaxed text-sm">
                                                        {n.actor ? (
                                                            <>
                                                                <span
                                                                    className="text-gray-900 dark:text-white font-medium">{n.actor.name}</span>{' '}
                                                                {n.message.replace(`${n.actor.name} `, '')}
                                                            </>
                                                        ) : (
                                                            n.message
                                                        )}
                                                    </p>

                                                    {n.meta?.postTitle && (
                                                        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                                            <span
                                                                className="text-gray-400 dark:text-gray-500">Context:</span>{' '}
                                                            <span
                                                                className="text-gray-600 dark:text-gray-300 font-medium">{n.meta.postTitle}</span>
                                                        </div>
                                                    )}

                                                    {isFriendRequest && !n.isRead && (
                                                        <div className="mt-3 flex gap-2">
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    if (!n.actor) return;
                                                                    try {
                                                                        await acceptFriendRequest(n.id, n.actor.id);
                                                                        dispatch(removeNotificationLocally(n.id));
                                                                        showToast("Accepted", "Friend request accepted!");
                                                                    } catch (err) {
                                                                        console.error(err);
                                                                        showToast("Error", "Error accepting friend request.");
                                                                    }
                                                                }}
                                                                className={`px-4 py-1.5 bg-${accentColor}-600 hover:bg-${accentColor}-700 text-white text-sm font-medium rounded-lg flex items-center gap-1 transition-colors`}
                                                            >
                                                                <Check size={16} /> Accept
                                                            </button>
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    try {
                                                                        await declineFriendRequest(n.id);
                                                                        dispatch(removeNotificationLocally(n.id));
                                                                        showToast("Declined", "Request has been declined.");
                                                                    } catch (err) {
                                                                        console.error(err);
                                                                        showToast("Error", "Error declining friend request.");
                                                                    }
                                                                }}
                                                                className="px-4 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-lg flex items-center gap-1 transition-colors"
                                                            >
                                                                <X size={16} /> Decline
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span
                                                        className="text-xs text-gray-500 dark:text-gray-400">{n.time}</span>
                                                    <button
                                                        className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700/50 text-gray-500 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all">
                                                        <MoreVertical size={16}/>
                                                    </button>
                                                </div>
                                            </div>

                                            
                                            <div className="mt-3 flex items-center gap-2">
                                                <button
                                                    onClick={() => toggleRead(n.id)}
                                                    className={[
                                                        'px-3 py-2 rounded-lg border transition-all text-sm flex items-center gap-2 font-medium',
                                                        n.isRead
                                                            ? 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700/50 text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                                                            : `bg-${accentColor}-100 dark:bg-${accentColor}-900/20 border-${accentColor}-200 dark:border-${accentColor}-500/30 text-${accentColor}-700 dark:text-${accentColor}-200 hover:bg-${accentColor}-200 dark:hover:bg-${accentColor}-900/30`
                                                    ].join(' ')}
                                                >
                                                    <Check size={16}/>
                                                    {n.isRead ? 'Mark unread' : 'Mark read'}
                                                </button>

                                                <button
                                                    onClick={() => removeNotification(n.id)}
                                                    className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-500/25 text-red-600 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-600/25 transition-all text-sm flex items-center gap-2 font-medium"
                                                >
                                                    <Trash2 size={16}/>
                                                    Delete
                                                </button>
                                            </div>
                                        </div>

                                        
                                        {n.actor && (
                                            <div
                                                className="hidden md:flex items-center justify-center w-11 h-11 rounded-xl bg-gray-100 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700/50 text-gray-700 dark:text-white font-semibold text-sm">
                                                {n.actor.avatar}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {activeFilter === 'friend_request' && outgoingRequests.length > 0 && (
                    <div className="mt-10">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <UserPlus className={`text-${accentColor}-500`} size={24}/>
                            Outgoing Friend Requests
                        </h2>
                        <div className="space-y-3">
                            {outgoingRequests.map(req => (
                                <div key={req.id} className="bg-white dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full bg-${accentColor}-100 dark:bg-${accentColor}-900/30 text-${accentColor}-600 flex items-center justify-center font-bold`}>
                                            {req.username.substring(0, 1).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">{req.username}</p>
                                            <p className="text-sm text-gray-500">Request pending...</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs font-bold rounded-full border border-yellow-200 dark:border-yellow-800">
                                        PENDING
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            
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

