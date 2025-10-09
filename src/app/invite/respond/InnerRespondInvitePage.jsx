"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "../../utils/api";
import toast from "react-hot-toast";

export default function InnerRespondInvitePage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const handleAction = async (action) => {
    try {
      setLoading(true);
      const res = await api.post(`/board-team/invite/${action}`, {
        token: token
      });
      toast.success(res.data.message);
      setStatus(action);

      if (action === "accept") {
        setTimeout(() => router.push("/dashboard"), 2000);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!token)
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500 text-lg">Invalid invitation link</p>
      </div>
    );

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="bg-white shadow-lg rounded-2xl p-6 max-w-md text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">
          You’ve Been Invited 🎉
        </h2>
        <p className="text-gray-600 mb-6">
          Someone invited you to collaborate on a board. Would you like to join?
        </p>

        {status ? (
          <p className="text-green-600 font-medium">
            {status === "accept"
              ? "You’ve accepted the invitation!"
              : "You rejected the invite."}
          </p>
        ) : (
          <div className="flex gap-4 justify-center">
            <button
              disabled={loading}
              onClick={() => handleAction("accept")}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Accept
            </button>
            <button
              disabled={loading}
              onClick={() => handleAction("reject")}
              className="bg-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400"
            >
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
