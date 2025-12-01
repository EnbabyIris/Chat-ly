import { create } from 'zustand';

interface Chat {
  _id: string;
  [key: string]: unknown;
}

interface Message {
  _id: string;
  [key: string]: unknown;
}

interface ChatState {
  chats: Chat[];
  selectedChat: Chat | null;
  messages: Record<string, Message[]>;
  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  setSelectedChat: (chat: Chat | null) => void;
  clearSelectedChat: () => void;
  setMessages: (chatId: string, messages: Message[]) => void;
  addMessage: (chatId: string, message: Message) => void;
  removeMessage: (chatId: string, messageId: string) => void;
  getMessages: (chatId: string) => Message[];
  getChat: (chatId: string) => Chat | undefined;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  selectedChat: null,
  messages: {},

  setChats: (chats) => set({ chats }),

  addChat: (chat) => {
    const currentChats = get().chats;
    if (!currentChats.find((c) => c._id === chat._id)) {
      set({ chats: [chat, ...currentChats] });
    }
  },

  updateChat: (chatId, updates) => {
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat._id === chatId ? { ...chat, ...updates } : chat
      ),
      selectedChat:
        state.selectedChat?._id === chatId
          ? { ...state.selectedChat, ...updates }
          : state.selectedChat,
    }));
  },

  setSelectedChat: (chat) => set({ selectedChat: chat }),

  clearSelectedChat: () => set({ selectedChat: null }),

  setMessages: (chatId, messages) => {
    set((state) => ({
      messages: { ...state.messages, [chatId]: messages },
    }));
  },

  addMessage: (chatId, message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: [...(state.messages[chatId] || []), message],
      },
    }));
  },

  removeMessage: (chatId, messageId) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] || []).filter(
          (msg) => msg._id !== messageId
        ),
      },
    }));
  },

  getMessages: (chatId) => get().messages[chatId] || [],

  getChat: (chatId) => get().chats.find((chat) => chat._id === chatId),
}));

