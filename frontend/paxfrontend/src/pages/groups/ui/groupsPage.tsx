import React, {useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import {fetchAllGroups, fetchMyGroups, createGroup, joinGroup, leaveGroup, fetchUsersCount} from '../groupsService';
import {
    Users,
    Search,
    Plus,
    TrendingUp,
    Lock,
    Globe,
    Star,
    MessageSquare,
    Eye,
    UserPlus,
    Check,
    Crown,
    Shield
} from 'lucide-react';
import {categories, Community} from "../index";
import {
    CreateCommunityModal,
    CreateCommunityFormData
} from "../createCommunity";

import { AuthModal } from "../../..//widgets/AuthModal/AuthModal";

export const GroupsPage: React.FC = () => {
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

    const [authModal, setAuthModal] = useState({
        isOpen: false,
        title: "",
        message: ""
    });

    const requireAuth = (title: string, message: string) => {
        const token = localStorage.getItem("access_token");
        if (!token || token === "undefined") {
            setAuthModal({ isOpen: true, title, message });
            return false;
        }
        return true;
    };

    const [activeTab, setActiveTab] = useState<'discover' | 'joined' | 'myGroups'>('discover');
    const [searchQuery, setSearchQuery] = useState('');
    const [communities, setCommunities] = useState<Community[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const [allGroupsCount, setAllGroupsCount] = useState(0);
    const [joinedGroupsCount, setJoinedGroupsCount] = useState(0);
    const [totalMembersCount, setTotalMembersCount] = useState<Number>(0);
    const [totalPostsCount, setTotalPostsCount] = useState(0);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const token = localStorage.getItem("access_token");

                const all = await fetchAllGroups();
                setAllGroupsCount(all.length);

                if (token && token !== "undefined") {
                    const joined = await fetchMyGroups();
                    setJoinedGroupsCount(joined.length);
                } else {
                    setJoinedGroupsCount(0);
                }

                const membersCount = await fetchUsersCount();
                setTotalMembersCount(membersCount);

                try {
                    const postsResponse = await fetch(`http://localhost:8081/api/v1/posts/all?t=${new Date().getTime()}`);
                    if (postsResponse.ok) {
                        const allPostsData = await postsResponse.json();
                        setTotalPostsCount(allPostsData.length);
                    }
                } catch (postErr) {
                    console.error("Failed to load post count", postErr);
                }

            } catch (e) {
                console.error("Stats load failed", e);
            }
        };

        loadStats();
    }, []);

    useEffect(() => {
        const loadGroups = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem("access_token");
                let backendGroups = [];

                let currentUserId: string | null = null;
                if (token && token !== "undefined") {
                    try {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        currentUserId = payload.sub;
                    } catch (e) {
                        console.error("Token parsing error", e);
                    }
                }

                if (activeTab === 'joined') {
                    if (!token || token === "undefined") {
                        setCommunities([]);
                        setIsLoading(false);
                        return;
                    }
                    backendGroups = await fetchMyGroups();

                } else if (activeTab === 'myGroups') {
                    if (!token || token === "undefined" || !currentUserId) {
                        setCommunities([]);
                        setIsLoading(false);
                        return;
                    }
                    try {
                        const ownerRes = await fetch(`http://localhost:8081/api/v1/groups/owner/${currentUserId}`, {
                            headers: { "Authorization": `Bearer ${token}` }
                        });

                        if (ownerRes.ok) {
                            backendGroups = await ownerRes.json();
                        } else {
                            const allGroups = await fetchAllGroups();
                            backendGroups = allGroups.filter((bg: any) =>
                                String(bg.ownerId) === String(currentUserId) || String(bg.creatorId) === String(currentUserId)
                            );
                        }
                    } catch (err) {
                        const allGroups = await fetchAllGroups();
                        backendGroups = allGroups.filter((bg: any) =>
                            String(bg.ownerId) === String(currentUserId) || String(bg.creatorId) === String(currentUserId)
                        );
                    }

                } else {
                    backendGroups = await fetchAllGroups();
                }

                const formattedGroups = backendGroups.map((bg: any) => ({
                    id: bg.id,
                    name: bg.name,
                    description: bg.description,
                    avatar: bg.name.substring(0, 2).toUpperCase(),
                    banner: "from-purple-500 to-pink-600",
                    members: bg.memberCount || bg.membersCount || 0,
                    posts: bg.postCount || 0,
                    category: "General",
                    isJoined: activeTab === 'joined' || activeTab === 'myGroups',
                    isVerified: false,
                    onlineMembers: 1,
                    ownerId: bg.ownerId || bg.creatorId
                }));

                setCommunities(formattedGroups);

            } catch (error) {
                console.error("Error loading communities:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadGroups();
    }, [activeTab]);

    const [selectedCategory, setSelectedCategory] = useState("All Categories");

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const openCreateModal = () => {
        if (!requireAuth(
            "Create Community",
            "Only registered members can create and manage new communities. Please log in to continue."
        )) {
            return;
        }

        setServerError(null);
        setIsCreateOpen(true);
    };

    const closeCreateModal = () => {
        if (isSubmitting) return;
        setIsCreateOpen(false);
        setServerError(null);
    };

    const handleCreateCommunity = async (data: CreateCommunityFormData) => {
        setIsSubmitting(true);
        setServerError(null);

        try {
            const payload = {
                name: data.name,
                description: data.description,
                groupPrivacy: data.visibility.toUpperCase() as any,
                location: ""
            };

            const newBackendGroup = await createGroup(payload);

            const token = localStorage.getItem("access_token");
            let currentUserId = null;
            if (token && token !== "undefined") {
                const tokenPayload = JSON.parse(atob(token.split('.')[1]));
                currentUserId = tokenPayload.sub;
            }

            const newCommunity: Community = {
                id: newBackendGroup.id,
                name: newBackendGroup.name,
                description: newBackendGroup.description,
                avatar: newBackendGroup.name.substring(0, 2).toUpperCase(),
                banner: data.visibility === 'public' ? "from-blue-500 to-cyan-600" : "from-orange-500 to-red-600",
                members: 1,
                posts: 0,
                category: data.category || "General",
                isPrivate: data.visibility !== 'public',
                isJoined: true,
                isVerified: false,
                onlineMembers: 1,
                ownerId: currentUserId
            };

            setIsCreateOpen(false);
            setCommunities(prev => [newCommunity, ...prev]);

            setAllGroupsCount(prev => prev + 1);
            setJoinedGroupsCount(prev => prev + 1);

            setActiveTab('myGroups');

        } catch (err: any) {
            setServerError("Failed to create community. Check data format or server.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleJoin = async (communityId: number) => {
        if (!requireAuth(
            "Join Community",
            "You need to log in to your account to join communities and interact with members."
        )) {
            return;
        }

        const community = communities.find(c => c.id === communityId);
        if (!community) return;

        try {
            if (community.isJoined) {
                await leaveGroup(communityId);
                setJoinedGroupsCount(prev => Math.max(0, prev - 1));
            } else {
                await joinGroup(communityId);
                setJoinedGroupsCount(prev => prev + 1);
            }

            setCommunities(prev =>
                prev.map(c =>
                    c.id === communityId
                        ? {
                            ...c,
                            isJoined: !c.isJoined,
                            members: c.isJoined ? c.members - 1 : c.members + 1
                        }
                        : c
                )
            );

        } catch (err) {
            console.error("Error:", err);
        }
    };

    const filteredCommunities = communities.filter(community => {
        const matchesSearch =
            community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            community.description.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory =
            selectedCategory === "All Categories" ||
            community.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    return (
        <div className="max-w-7xl mx-auto">
            
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3 transition-colors">
                    <Users className={`text-${accentColor}-500`} size={40}/>
                    Groups
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-lg transition-colors">
                    Join groups and connect with people who share your interests
                </p>
            </div>

            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className={`bg-${accentColor}-50 dark:bg-${accentColor}-900/10 border border-${accentColor}-200 dark:border-${accentColor}-500/20 rounded-xl p-4 transition-colors`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 bg-${accentColor}-600 rounded-lg flex items-center justify-center shadow-md shadow-${accentColor}-500/20`}>
                            <Users size={20} className="text-white"/>
                        </div>
                        <div>
                            <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Available groups</p>
                            <p className="text-gray-900 dark:text-white text-xl font-bold">{allGroupsCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
                            <Check size={20} className="text-white"/>
                        </div>
                        <div>
                            <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Joined</p>
                            <p className="text-gray-900 dark:text-white text-xl font-bold">{joinedGroupsCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-500/20 rounded-xl p-4 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center shadow-md shadow-green-500/20">
                            <TrendingUp size={20} className="text-white"/>
                        </div>
                        <div>
                            <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Total Members</p>
                            <p className="text-gray-900 dark:text-white text-xl font-bold">
                                {Number(totalMembersCount)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-500/20 rounded-xl p-4 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center shadow-md shadow-orange-500/20">
                            <MessageSquare size={20} className="text-white"/>
                        </div>
                        <div>
                            <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Total Posts</p>
                            <p className="text-gray-900 dark:text-white text-xl font-bold">
                                {totalPostsCount}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            
            <div className="bg-white dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4 mb-6 shadow-sm transition-colors">
                <div className="flex flex-col lg:flex-row gap-4">
                    
                    <div className="flex gap-2">
                        {[
                            {id: 'discover', label: 'Discover'},
                            {id: 'joined', label: 'Joined'},
                            {id: 'myGroups', label: 'My Groups'}
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    if ((tab.id === 'joined' || tab.id === 'myGroups') && !requireAuth(tab.label, `Please log in to view ${tab.label.toLowerCase()}.`)) return;
                                    setActiveTab(tab.id as 'discover' | 'joined' | 'myGroups');
                                }}
                                className={`px-4 py-2 rounded-lg transition-all font-medium ${
                                    activeTab === tab.id
                                        ? `bg-${accentColor}-600 text-white shadow-lg shadow-${accentColor}-500/20`
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                        <input
                            type="text"
                            placeholder="Search communities..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg pl-10 pr-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-${accentColor}-500 transition-colors`}
                        />
                    </div>

                    
                    <button
                        onClick={openCreateModal}
                        className={`px-4 py-2 bg-${accentColor}-600 hover:bg-${accentColor}-700 text-white rounded-lg transition-all shadow-lg shadow-${accentColor}-500/20 font-medium flex items-center gap-2 whitespace-nowrap`}
                    >
                        <Plus size={18}/>
                        Create Community
                    </button>
                </div>

                
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                                selectedCategory === category
                                    ? `bg-${accentColor}-600 text-white shadow-md shadow-${accentColor}-500/20`
                                    : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            
            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <div className={`animate-spin rounded-full h-12 w-12 border-b-2 border-${accentColor}-600`}></div>
                </div>
            ) : (
                <>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCommunities.map((community) => (
                            <div
                                key={community.id}
                                onClick={() => navigate(`/groups/${community.id}`)}
                                className="bg-white dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700/50 rounded-xl overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 transition-all group shadow-sm hover:shadow-md cursor-pointer"
                            >
                                
                                <div className={`h-24 bg-gradient-to-r ${community.banner} relative`}>
                                    <div className="absolute top-3 right-3 flex gap-2">
                                        {activeTab === 'myGroups' && (
                                            <div className="bg-black/40 backdrop-blur-sm rounded-full p-1.5" title="You are the owner">
                                                <Crown size={14} className="text-yellow-400"/>
                                            </div>
                                        )}
                                        {community.isVerified && (
                                            <div className="bg-white/20 backdrop-blur-sm rounded-full p-1.5"
                                                 title="Verified Community">
                                                <Shield size={14} className="text-white"/>
                                            </div>
                                        )}
                                        {community.isPrivate && (
                                            <div className="bg-white/20 backdrop-blur-sm rounded-full p-1.5"
                                                 title="Private Community">
                                                <Lock size={14} className="text-white"/>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                
                                <div className="p-5">
                                    
                                    <div className="flex items-start justify-between mb-3 -mt-12">
                                        <div className={`z-10 w-20 h-20 bg-gradient-to-r ${community.banner} rounded-xl flex items-center justify-center font-bold text-white text-2xl border-4 border-white dark:border-gray-800 shadow-md`}>
                                            {community.avatar}
                                        </div>
                                        
                                        {activeTab !== 'myGroups' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleJoin(community.id);
                                                }}
                                                className={`z-10 px-4 py-2 rounded-lg transition-all font-medium flex items-center gap-2 ${
                                                    community.isJoined
                                                        ? 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                                                        : `bg-${accentColor}-600 hover:bg-${accentColor}-700 text-white shadow-lg shadow-${accentColor}-500/20`
                                                }`}
                                            >
                                                {community.isJoined ? (
                                                    <>
                                                        <Check size={16}/>
                                                        Joined
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserPlus size={16}/>
                                                        Join
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>

                                    
                                    <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-1 flex items-center gap-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                        {community.name}
                                        {community.isVerified && (
                                            <Star size={16} className="text-yellow-500 fill-yellow-500"/>
                                        )}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                        {community.description}
                                    </p>

                                    
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center gap-1" title="Members">
                                                <Users size={14}/>
                                                <span>{(community.members / 1000).toFixed(1)}k</span>
                                            </div>
                                            <div className="flex items-center gap-1" title="Posts">
                                                <MessageSquare size={14}/>
                                                <span>{(community.posts / 1000).toFixed(1)}k</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-green-500">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                                            <span className="text-xs font-medium">{community.onlineMembers} online</span>
                                        </div>
                                    </div>

                                    
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                                        <span className={`inline-block px-3 py-1 bg-${accentColor}-50 dark:bg-${accentColor}-900/20 text-${accentColor}-700 dark:text-${accentColor}-300 rounded-full text-xs font-medium transition-colors`}>
                                            {community.category}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    
                    {filteredCommunities.length === 0 && (
                        <div className="bg-white dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700/50 rounded-xl p-12 text-center shadow-sm">
                            <Users size={48} className="text-gray-400 mx-auto mb-4"/>
                            <h3 className="text-gray-900 dark:text-white font-bold text-xl mb-2">
                                {activeTab === 'myGroups' ? "You haven't created any communities yet" : "No communities found"}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                {activeTab === 'myGroups' ? "Start your own community and invite others." : "Try adjusting your search or filters"}
                            </p>
                            {activeTab === 'myGroups' ? (
                                <button
                                    onClick={openCreateModal}
                                    className={`px-6 py-3 bg-${accentColor}-600 hover:bg-${accentColor}-700 text-white rounded-lg transition-all shadow-lg shadow-${accentColor}-500/20 font-medium`}
                                >
                                    Create Your First Community
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedCategory("All Categories");
                                        setActiveTab('discover');
                                    }}
                                    className={`px-6 py-3 bg-${accentColor}-600 hover:bg-${accentColor}-700 text-white rounded-lg transition-all shadow-lg shadow-${accentColor}-500/20 font-medium`}
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}

            
            <CreateCommunityModal
                isOpen={isCreateOpen}
                onClose={closeCreateModal}
                onSubmit={handleCreateCommunity}
                isSubmitting={isSubmitting}
                serverError={serverError}
            />

            
            <AuthModal
                isOpen={authModal.isOpen}
                onClose={() => setAuthModal({ ...authModal, isOpen: false })}
                title={authModal.title}
                message={authModal.message}
            />
        </div>
    );
};