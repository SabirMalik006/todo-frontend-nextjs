"use client";
import { useState, useEffect } from "react";
import { FiUsers, FiX, FiMail, FiTrash2 } from "react-icons/fi";
import api from "../utils/api";
import toast from "react-hot-toast";

export default function TeamSidebar({ boardId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [boardOwnerId, setBoardOwnerId] = useState(null);
  const [inviteLink, setInviteLink] = useState("");

  
  useEffect(() => {
    if (typeof window !== "undefined" && boardId) {
      setInviteLink(`${window.location.origin}/invite/${boardId}`);
    }
  }, [boardId]);

  
  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      const res = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUser(res.data);
    } catch (err) {
      console.error("fetchCurrentUser error:", err);
    }
  };

  
  const fetchTeamMembers = async () => {
    if (!boardId) return;
    try {
      setIsLoading(true);
      const res = await api.get(`/board-team/board/${boardId}`);
      setTeamMembers(res.data.members || []);
      setBoardOwnerId(res.data.ownerId || null);
    } catch (err) {
      if (err.response?.status === 404) {
        setTeamMembers([]); 
      } else {
        console.error("fetchTeamMembers error:", err);
        toast.error("Failed to load team members");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (isOpen && boardId) fetchTeamMembers();
  }, [isOpen, boardId]);


  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return toast.error("Enter an email address");
    if (!boardId) return toast.error("Board ID missing");

    try {
      setIsInviting(true);
      const res = await api.post(`/board-team/board/${boardId}/invite`, {
        email: inviteEmail.trim(),
      });

      if (res.data.message) {
        toast.success(res.data.message);
        setInviteEmail("");
        fetchTeamMembers();
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send invitation";
      toast.error(msg);
    } finally {
      setIsInviting(false);
    }
  };


  const handleRemoveMember = async (memberId) => {
    if (!boardId) return toast.error("Board ID missing");
    try {
      const res = await api.delete(
        `/board-team/board/${boardId}/members/${memberId}`
      );
      if (res.data.message) {
        toast.success(res.data.message);
        fetchTeamMembers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove member");
    }
  };


  const getDisplayName = (member) => {
    if (member.name && member.name.trim() !== "") return member.name;

    if (member.email) {
      const localPart = member.email.split("@")[0];
      const formatted = localPart.replace(/[._-]+/g, " ");
      return formatted
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }
    return "Unknown User";
  };

  return (
    <>

      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-9 top-20 z-30 bg-[#2B1887] text-white p-3 rounded-full shadow-lg hover:bg-[#4321a8] transition-all hover:scale-110"
        title="Team Members"
      >
        <FiUsers className="w-6 h-6" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}


      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >

        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <FiUsers className="w-6 h-6 text-[#2B1887]" />
            <h2 className="text-xl font-bold text-gray-800">Team Members</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <FiX className="w-5 h-5 text-gray-600" />
          </button>
        </div>


        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Invite to Board
          </h3>


          <div className="flex gap-2 mb-4">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Enter email"
              className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2B1887]"
              onKeyPress={(e) => e.key === "Enter" && handleInviteMember()}
            />
            <button
              onClick={handleInviteMember}
              disabled={isInviting || !boardId}
              className="bg-[#2B1887] text-white p-2 rounded-lg hover:bg-[#4321a8] disabled:opacity-50"
            >
              {isInviting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiMail className="w-5 h-5" />
              )}
            </button>
          </div>


          {/* <div className="flex items-center gap-2">
            <input
              readOnly
              value={inviteLink}
              className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-gray-600 cursor-text"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(inviteLink);
                toast.success("Invite link copied!");
              }}
              className="bg-gray-200 hover:bg-gray-300 p-2 rounded-lg"
            >
              📋
            </button>
          </div> */}
        </div>


        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Members ({teamMembers.length})
          </h3>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-[#2B1887] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiUsers className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No team members yet</p>
            </div>
          ) : (
            teamMembers.map((member) => {
              const isOwner = member._id === boardOwnerId;
              const isSelf = member._id === currentUser?._id;

              return (
                <div
                  key={member._id || member.userId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#2B1887] text-white rounded-full flex items-center justify-center font-semibold">
                      {getDisplayName(member)?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {getDisplayName(member)}{" "}
                        {isOwner && (
                          <span className="text-xs text-blue-600 font-semibold">
                            (Owner)
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">{member.email}</p>

                      {member.status && (
                        <span
                          className={`text-xs mt-1 inline-block px-2 py-0.5 rounded-full ${
                            member.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {member.status === "pending" ? "Pending" : "Joined"}
                        </span>
                      )}
                    </div>
                  </div>


                  {!isOwner && !isSelf && member.status !== "pending" && (
                    <button
                      onClick={() =>
                        handleRemoveMember(member._id || member.userId)
                      }
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
