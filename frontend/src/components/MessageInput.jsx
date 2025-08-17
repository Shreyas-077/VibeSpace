import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X, AlertTriangle, Shield } from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../store/useAuthStore";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [filterWarning, setFilterWarning] = useState(null);
  const fileInputRef = useRef(null);
  const { sendMessage, socket } = useChatStore();
  const { authUser } = useAuthStore();

  useEffect(() => {
    if (!socket) return;

    // Listen for filter events
    socket.on("messageBlocked", (data) => {
      toast.error(`Message blocked: ${data.reason}`, {
        duration: 4000,
        icon: "🚫"
      });
    });

    socket.on("messageFiltered", (data) => {
      toast.success("Message was automatically filtered for appropriate content", {
        duration: 3000,
        icon: "🔧"
      });
    });

    socket.on("messageWarning", (data) => {
      setFilterWarning(data.reason);
      setTimeout(() => setFilterWarning(null), 5000);
    });

    return () => {
      socket.off("messageBlocked");
      socket.off("messageFiltered");
      socket.off("messageWarning");
    };
  }, [socket]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    try {
      const result = await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });

      // Handle filter responses
      if (result?.filterAnalysis?.warning) {
        toast.warning("Your message contains potentially sensitive content", {
          duration: 3000,
          icon: "⚠️"
        });
      }

      // Clear form
      setText("");
      setImagePreview(null);
      setFilterWarning(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      // Check if it's a filter error
      if (error.response?.status === 400 && error.response?.data?.reason) {
        toast.error(error.response.data.reason, {
          duration: 4000,
          icon: "🚫"
        });
      } else {
        console.error("Failed to send message:", error);
        toast.error("Failed to send message");
      }
    }
  };

  return (
    <div className="p-4 w-full">
      {/* Filter Warning */}
      {filterWarning && (
        <div className="mb-3 flex items-center gap-2 p-3 bg-warning/20 border border-warning/30 rounded-lg">
          <AlertTriangle className="size-4 text-warning" />
          <span className="text-sm text-warning">{filterWarning}</span>
        </div>
      )}

      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              className="w-full input input-bordered rounded-lg input-sm sm:input-md pr-10"
              placeholder="Type a message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            {/* AI Filter indicator */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <Shield className="size-4 text-primary/60" title="AI Content Filter Active" />
            </div>
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle
                     ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !imagePreview}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};
export default MessageInput;