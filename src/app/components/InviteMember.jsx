"use client";
import { useState } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";

export default function InviteMember({ boardId }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);


  const handleInvite = async () => {
    if (!email.trim()) return toast.error("Please enter an email.");
    if (!boardId) return toast.error("Board ID is missing.");

    try {
      setLoading(true);
       const res = await api.post(`/board-team/board/${boardId}/invite`, { email });

      if (res.data.message) toast.success(res.data.message);
      else toast.success("Invitation email sent successfully!");

      setEmail("");
    } catch (err) {
      console.error("Invite error:", err);
      toast.error(err.response?.data?.message || "Failed to send invite.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm w-full max-w-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Invite a Team Member</h3>
      <div className="flex gap-2">
        <input
          type="email"
          className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-600"
          placeholder="Enter email to invite..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleInvite()}
        />
        <button
          onClick={handleInvite}
          disabled={loading}
          className={`bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Sending..." : "Invite"}
        </button>
      </div>
    </div>
  );
}
