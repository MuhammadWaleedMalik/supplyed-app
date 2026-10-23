import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  ChatMessage,
  Conversation,
  ConversationSide,
  mergeMessages,
} from '../../../../constants/conversationsApi';

type ChatState = {
  conversations: Conversation[];
  byId: Record<string, Conversation>;
  messages: Record<string, ChatMessage[]>;
  history: Record<string, { hasMore: boolean; lastSyncedId: string }>;
  unread: number;
  connected: boolean;
  revision: number;
  error: string;
  typing: Record<string, { side: ConversationSide; until: number }>;
};
const initialState: ChatState = {
  conversations: [],
  byId: {},
  messages: {},
  history: {},
  unread: 0,
  connected: false,
  revision: 0,
  error: '',
  typing: {},
};
const conversationsSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    setChatHistory(
      state,
      action: PayloadAction<{
        id: string;
        hasMore: boolean;
        lastSyncedId: string;
      }>,
    ) {
      const { id, hasMore, lastSyncedId } = action.payload;
      state.history[id] = { hasMore, lastSyncedId };
    },
    setConversations(state, action: PayloadAction<Conversation[]>) {
      state.conversations = action.payload;
      action.payload.forEach(conversation => {
        state.byId[conversation.id] = conversation;
      });
    },
    mergeConversations(state, action: PayloadAction<Conversation[]>) {
      action.payload.forEach(conversation => {
        state.byId[conversation.id] = conversation;
        const index = state.conversations.findIndex(
          item => item.id === conversation.id,
        );
        if (index < 0) state.conversations.push(conversation);
        else state.conversations[index] = conversation;
      });
    },
    saveConversation(state, action: PayloadAction<Conversation>) {
      state.byId[action.payload.id] = action.payload;
      const index = state.conversations.findIndex(
        item => item.id === action.payload.id,
      );
      if (index < 0) state.conversations.push(action.payload);
      else state.conversations[index] = action.payload;
    },
    saveMessages(
      state,
      action: PayloadAction<{ id: string; messages: ChatMessage[] }>,
    ) {
      const { id, messages } = action.payload;
      state.messages[id] = mergeMessages(state.messages[id] || [], messages);
      delete state.typing[id];
    },
    setUnread(state, action: PayloadAction<number>) {
      state.unread = action.payload;
    },
    setChatConnected(state, action: PayloadAction<boolean>) {
      state.connected = action.payload;
    },
    refreshChat(state) {
      state.revision += 1;
    },
    setChatError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
    setChatTyping(
      state,
      action: PayloadAction<{
        conversationId: string;
        side: ConversationSide;
        typing: boolean;
      }>,
    ) {
      const event = action.payload;
      if (event.typing)
        state.typing[event.conversationId] = {
          side: event.side,
          until: Date.now() + 4000,
        };
      else delete state.typing[event.conversationId];
    },
    setChatRead(
      state,
      action: PayloadAction<{
        conversationId: string;
        side: ConversationSide;
        readAt: string;
      }>,
    ) {
      const event = action.payload;
      const summaries = [
        state.byId[event.conversationId],
        state.conversations.find(item => item.id === event.conversationId),
      ];
      summaries.forEach(conversation => {
        if (!conversation) return;
        if (event.side !== conversation.me)
          conversation.counterpartLastReadAt = event.readAt;
        else conversation.unreadCount = 0;
      });
    },
    resetConversations() {
      return initialState;
    },
  },
});
export const {
  setChatHistory,
  setConversations,
  mergeConversations,
  saveConversation,
  saveMessages,
  setUnread,
  setChatConnected,
  refreshChat,
  setChatError,
  setChatTyping,
  setChatRead,
  resetConversations,
} = conversationsSlice.actions;
export default conversationsSlice.reducer;
