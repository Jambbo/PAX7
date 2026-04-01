import React, { useEffect, useState, useRef } from "react";
import { Client } from "@stomp/stompjs";
import { Send, Search, MoreVertical, Phone, Video, Paperclip, Smile, MessageSquare } from "lucide-react";

interface User {
    id: string;
    username: string;
}

interface ChatMessage {
    id?: string;
    conversationId: string;
    senderId: string;
    content: string;
    createdAt?: string;
}

// Масив з популярними емодзі (понад 60 штук)
const EMOJIS = [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "🥲", "☺️",
    "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗",
    "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸",
    "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️",
    "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵",
    "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🫣", "🤭",
    "👍", "👎", "✌️", "🤞", "🫶", "❤️", "🔥", "✨", "🎉", "💯"
];

export const MessagesPage: React.FC = () => {
    // =========================================================================
    // UI СТЕЙТИ ТА ЛОГІКА ДИЗАЙНУ
    // =========================================================================
    const [accentColor, setAccentColor] = useState(() => localStorage.getItem('site_accent_color') || 'purple');
    const [searchQuery, setSearchQuery] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Стейт та реф для меню емодзі
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleStorageChange = () => setAccentColor(localStorage.getItem('site_accent_color') || 'purple');
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('accent-color-change', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('accent-color-change', handleStorageChange);
        };
    }, []);

    // Закриття меню емодзі при кліку поза ним
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiContainerRef.current && !emojiContainerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // =========================================================================
    // ОРИГІНАЛЬНА ЛОГІКА
    // =========================================================================
    const [users, setUsers] = useState<User[]>([]);
    const [conversationUsers, setConversationUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const selectedUserRef = useRef<User | null>(null);

    useEffect(() => {
        selectedUserRef.current = selectedUser;
    }, [selectedUser]);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [client, setClient] = useState<Client | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string>("");

    const [conversationMap, setConversationMap] = useState<Record<string, string>>({});

    const getUserIdFromToken = () => {
        const token = localStorage.getItem("access_token")!;
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.sub;
    };

    const fetchConversations = (userId: string) => {
        fetch("http://localhost:8081/api/chat/conversations", {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("access_token")}`
            }
        })
            .then(async res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    const loadedUsers: User[] = [];
                    const newConvMap: Record<string, string> = {};

                    data.forEach(conv => {
                        const otherUser = Array.isArray(conv.members)
                            ? conv.members.find((p: any) => p.id !== userId)
                            : null;

                        if (otherUser) {
                            if (!loadedUsers.some(u => u.id === otherUser.id)) {
                                loadedUsers.push({
                                    id: otherUser.id,
                                    username: otherUser.username
                                });
                            }
                            newConvMap[otherUser.id] = conv.id;
                        }
                    });

                    setConversationUsers(loadedUsers);
                    setConversationMap(prev => ({ ...prev, ...newConvMap }));
                }
            })
            .catch(err => console.error("Error fetching conversations:", err));
    };

    useEffect(() => {
        if (currentUserId) fetchConversations(currentUserId);
    }, [currentUserId]);

    useEffect(() => {
        const token = localStorage.getItem("access_token")!;
        const userId = getUserIdFromToken();
        setCurrentUserId(userId);

        const stompClient = new Client({
            brokerURL: "ws://localhost:8081/ws",
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            reconnectDelay: 5000
        });

        stompClient.onConnect = () => {
            stompClient.subscribe("/user/queue/messages", (msg) => {
                const body: ChatMessage = JSON.parse(msg.body);

                setMessages(prev => {
                    const exists = prev.find(m => m.id === body.id);
                    if (exists) return prev;
                    return [...prev, body];
                });

                if (body.senderId !== userId) {
                    setConversationMap(prev => {
                        if (prev[body.senderId] !== body.conversationId) {
                            return { ...prev, [body.senderId]: body.conversationId };
                        }
                        return prev;
                    });
                } else {
                    setConversationMap(prev => {
                        const isKnown = Object.values(prev).includes(body.conversationId);
                        if (!isKnown) {
                            setTimeout(() => fetchConversations(userId), 100);

                            if (selectedUserRef.current && !prev[selectedUserRef.current.id]) {
                                return { ...prev, [selectedUserRef.current.id]: body.conversationId };
                            }
                        }
                        return prev;
                    });
                }
            });
        };

        stompClient.activate();
        setClient(stompClient);

        return () => stompClient.deactivate();
    }, []);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setUsers([]);
        } else {
            const timeoutId = setTimeout(() => {
                fetch(`http://localhost:8081/api/v1/users/search?username=${encodeURIComponent(searchQuery)}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("access_token")}`
                    }
                })
                    .then(res => res.json())
                    .then(data => {
                        if (Array.isArray(data)) setUsers(data);
                    })
                    .catch(err => console.error(err));
            }, 300);

            return () => clearTimeout(timeoutId);
        }
    }, [searchQuery]);

    const sendMessage = () => {
        if (!input.trim() || !selectedUser || !client) return;

        client.publish({
            destination: "/app/chat.send",
            body: JSON.stringify({
                recipientId: selectedUser.id,
                content: input
            })
        });

        setInput("");
        setShowEmojiPicker(false); // Закриваємо емодзі після відправки
    };

    const activeConversationId = selectedUser ? conversationMap[selectedUser.id] : null;

    useEffect(() => {
        if (!activeConversationId) return;

        fetch(`http://localhost:8081/api/chat/${activeConversationId}?page=0&size=50`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("access_token")}`
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data && Array.isArray(data.content)) {
                    const history = data.content.map((m: any) => ({
                        id: m.id,
                        conversationId: m.conversationId,
                        senderId: m.senderId,
                        content: m.content,
                        createdAt: m.createdAt
                    }));

                    setMessages(prev => {
                        const newMessages = [...prev];
                        history.forEach((hm: ChatMessage) => {
                            if (!newMessages.some(existing => existing.id === hm.id)) {
                                newMessages.push(hm);
                            }
                        });

                        return newMessages.sort((a, b) => {
                            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
                            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
                            return timeA - timeB;
                        });
                    });
                }
            })
            .catch(err => console.error("Error fetching message history:", err));
    }, [activeConversationId]);

    const filteredMessages = messages.filter(
        m => m.conversationId === activeConversationId
    );

    useEffect(() => {
        scrollToBottom();
    }, [filteredMessages, selectedUser]);

    const displayedUsers = users;

    const allSidebarUsers = [...conversationUsers];
    if (selectedUser && !allSidebarUsers.some(u => u.id === selectedUser.id)) {
        allSidebarUsers.unshift(selectedUser);
    }

    return (
        <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] min-h-[600px] flex bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden animate-fadeIn">

            {/* ================= ЛІВА ПАНЕЛЬ ================= */}
            <div className="w-full md:w-80 lg:w-96 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <div className="h-16 px-4 flex items-center border-b border-gray-200 dark:border-gray-800 shrink-0">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex-1">Messages</h2>
                </div>

                <div className="p-3 relative z-20">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 transition-shadow shadow-sm`}
                        />
                    </div>
                    {searchQuery.trim() !== "" && (
                        <div className="absolute top-full left-3 right-3 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-64 overflow-y-auto no-scrollbar z-50">
                            {displayedUsers.length === 0 ? (
                                <div className="p-4 text-center text-sm text-gray-500">No users found.</div>
                            ) : (
                                displayedUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        onClick={() => {
                                            setSelectedUser(user);
                                            setSearchQuery("");
                                        }}
                                        className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0"
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 bg-${accentColor}-100 dark:bg-${accentColor}-900/30 text-${accentColor}-600`}>
                                            {user.username ? user.username.charAt(0).toUpperCase() : '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                                {user.username}
                                            </h3>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
                    {allSidebarUsers.length > 0 ? (
                        allSidebarUsers.map((user) => {
                            const isSelected = selectedUser?.id === user.id;
                            const avatarLetter = user.username ? user.username.charAt(0).toUpperCase() : '?';

                            return (
                                <div
                                    key={user.id}
                                    onClick={() => setSelectedUser(user)}
                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                                        isSelected
                                            ? `bg-${accentColor}-50 dark:bg-${accentColor}-900/20`
                                            : "hover:bg-gray-100 dark:hover:bg-gray-800"
                                    }`}
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
                                        isSelected
                                            ? `bg-${accentColor}-600 text-white`
                                            : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                                    }`}>
                                        {avatarLetter}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <h3 className={`font-semibold truncate ${isSelected ? `text-${accentColor}-700 dark:text-${accentColor}-400` : "text-gray-900 dark:text-white"}`}>
                                                {user.username}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-gray-500 truncate">
                                            Click to open chat
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center text-gray-500 py-6 text-sm">Use the search bar above to find users.</div>
                    )}
                </div>
            </div>

            {/* ================= ПРАВА ПАНЕЛЬ (ЧАТ) ================= */}
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 relative">
                {!selectedUser ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 bg-gray-50/30 dark:bg-gray-900/30">
                        <div className={`w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4`}>
                            <MessageSquare size={32} />
                        </div>
                        <p className="text-lg font-medium text-gray-600 dark:text-gray-400">Select a user to start messaging</p>
                    </div>
                ) : (
                    <>
                        <div className="h-16 px-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-10 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full bg-${accentColor}-100 dark:bg-${accentColor}-900/30 text-${accentColor}-600 flex items-center justify-center font-bold text-lg`}>
                                    {selectedUser.username ? selectedUser.username.charAt(0).toUpperCase() : '?'}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white leading-tight">
                                        {selectedUser.username}
                                    </h3>
                                    <span className={`text-xs font-medium text-${accentColor}-500`}>Online</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-gray-400">
                                <button className="hover:text-gray-600 dark:hover:text-gray-200 transition-colors hidden sm:block"><Phone size={20} /></button>
                                <button className="hover:text-gray-600 dark:hover:text-gray-200 transition-colors hidden sm:block"><Video size={20} /></button>
                                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>
                                <button className="hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><Search size={20} /></button>
                                <button className="hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><MoreVertical size={20} /></button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                            {filteredMessages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <p className="bg-gray-200/50 dark:bg-gray-800/50 px-4 py-1.5 rounded-full text-sm font-medium">Say hello to {selectedUser.username} 👋</p>
                                </div>
                            ) : (
                                filteredMessages.map((msg, i) => {
                                    const isMine = msg.senderId === currentUserId;

                                    return (
                                        <div key={i} className={`flex ${isMine ? "justify-end" : "justify-start"} animate-fadeIn`}>
                                            <div
                                                className={`px-4 py-2.5 max-w-[75%] lg:max-w-[60%] text-[15px] shadow-sm flex flex-col gap-1 ${
                                                    isMine
                                                        ? `bg-${accentColor}-600 text-white rounded-2xl rounded-tr-sm`
                                                        : "bg-white border border-gray-100 dark:border-gray-800 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl rounded-tl-sm"
                                                }`}
                                            >
                                                <span className="leading-relaxed whitespace-pre-wrap word-break-words break-words">{msg.content}</span>
                                                <span className={`text-[10px] self-end mt-0.5 opacity-70 ${isMine ? 'text-white/80' : 'text-gray-500'}`}>
                                                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* ================= ПОЛЕ ВВОДУ З ЕМОДЗІ ================= */}
                        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shrink-0" ref={emojiContainerRef}>
                            <div className="flex items-end gap-2 max-w-4xl mx-auto relative">

                                {/* ПАНЕЛЬ ЕМОДЗІ */}
                                {showEmojiPicker && (
                                    <div className="absolute bottom-full right-16 mb-2 w-72 sm:w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-3 z-50 animate-fadeIn">
                                        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 pr-1">
                                            {EMOJIS.map((emoji, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => setInput(prev => prev + emoji)}
                                                    className="text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl p-1.5 transition-colors flex items-center justify-center"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button className="p-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0">
                                    <Paperclip size={22} />
                                </button>

                                <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-end border border-transparent focus-within:border-gray-300 dark:focus-within:border-gray-700 transition-colors relative min-h-[48px]">
                                    <textarea
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Type message..."
                                        className="w-full bg-transparent pl-4 pr-12 py-3 text-[15px] text-gray-900 dark:text-white outline-none resize-none max-h-32 min-h-[48px] placeholder-gray-500"
                                        rows={1}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                sendMessage();
                                            }
                                        }}
                                        onInput={(e) => {
                                            const target = e.target as HTMLTextAreaElement;
                                            target.style.height = 'auto';
                                            target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className={`p-3 transition-colors shrink-0 absolute right-0 bottom-0 ${showEmojiPicker ? `text-${accentColor}-500` : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                    >
                                        <Smile size={22} />
                                    </button>
                                </div>

                                {input.trim().length > 0 ? (
                                    <button
                                        onClick={sendMessage}
                                        className={`p-3 bg-${accentColor}-600 hover:bg-${accentColor}-700 text-white rounded-full transition-all shadow-md shrink-0 animate-zoomIn`}
                                    >
                                        <Send size={20} className="translate-x-0.5 -translate-y-0.5" />
                                    </button>
                                ) : (
                                    <button className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-full cursor-not-allowed shrink-0">
                                        <Send size={20} className="translate-x-0.5 -translate-y-0.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};