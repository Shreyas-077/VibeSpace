import { create } from "zustand";
import toast from "react-hot-toast";
import  axiosInstance  from "../lib/axios";
import  useAuthStore  from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  /**
   * Fetches all users that the current user can chat with
   * Sets the loading state while fetching and updates the users array
   * Displays an error toast if the request fails
   */
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/msg/user");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  /**
   * Retrieves chat history between current user and selected user
   * @param {string} userId - ID of the user whose conversation is being loaded
   * Sets loading state during fetch and updates messages array with results
   * Displays an error toast if the request fails
   */
  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/msg/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  /**
   * Sends a new message to the currently selected user
   * @param {object} messageData - Contains the message content to be sent
   * Adds the new message to the messages array after successful API request
   * Displays an error toast if the send operation fails
   */
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/msg/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  /**
   * Sets up a real-time socket connection to listen for new incoming messages
   * Only processes messages that come from the currently selected user
   * Automatically updates the UI when new messages arrive without requiring a refresh
   */
  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  /**
   * Removes the socket.io listener when component unmounts or when changing conversations
   * Prevents memory leaks and duplicate message handling
   */
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  /**
   * Updates the currently selected user for the chat interface
   * @param {object} selectedUser - The user object that was selected in the UI
   * This triggers the UI to display the conversation with this user
   */
  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));