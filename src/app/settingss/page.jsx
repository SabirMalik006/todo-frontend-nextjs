"use client";

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Link from "next/link";
import toast from "react-hot-toast";
import { IoReturnUpBackOutline } from "react-icons/io5";
import api from "../utils/api";
import { CiCamera } from "react-icons/ci";
import { useParams } from "next/navigation";

export default function Settings() {
  const [name, setName] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const { id: routeBoardId } = useParams();
  const [boardId, setBoardId] = useState(null);


  useEffect(() => {
    if (routeBoardId) {
      setBoardId(routeBoardId);
      localStorage.setItem("lastBoardId", routeBoardId);
    } else {
      const saved = localStorage.getItem("lastBoardId");
      if (saved) setBoardId(saved);
    }
  }, [routeBoardId]);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const res = await api.get("https://todo-backend-w-nextjs-production.up.railway.app/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(res.data);
      setName(res.data.name || "");
      setImagePreview(res.data.image || null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch user info");
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem("accessToken");
    let uploadedImageUrl = null;
    let uploadedImageId = null;

    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);

        const uploadRes = await api.post("/image/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });

        uploadedImageUrl = uploadRes.data.file.path;
        uploadedImageId = uploadRes.data.file.filename;
      }

      const body = {};
      if (uploadedImageUrl) {
        body.image = uploadedImageUrl;
        body.imageId = uploadedImageId;
      }
      if (name && name !== user?.name) {
        body.name = name;
      }
      if (oldPassword && newPassword && confirmPassword) {
        body.oldPassword = oldPassword;
        body.newPassword = newPassword;
        body.confirmPassword = confirmPassword;
      }

      if (Object.keys(body).length > 0) {
        const res = await api.put("/user/update-user", body, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 200) {
          toast.success(res.data.message || "Profile updated successfully!");
          setOldPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setImageFile(null);
          setImagePreview(uploadedImageUrl || imagePreview);

          window.dispatchEvent(new Event("userUpdated"));
        }
      } else {
        toast("No changes to save");
      }
    } catch (err) {
      let msg = "Password is Incorrect";
      if (err.response?.data?.message === "Invalid password") {
        msg = "❌ Wrong current password";
      } else if (err.response?.data?.message === "Passwords do not match") {
        msg = "❌ Passwords do not match";
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>

      <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-blue-50/30">
        <Navbar className="fixed top-0 left-0 w-full z-100" />

        <div className="w-full max-w-lg flex px-8 pt-5 mb-5">
          <Link
            href={boardId ? `/todo/${boardId}` : "/todo"}
            className="text-white font-medium text-start bg-gradient-to-r from-[#2B1887] to-[#4a3bbd] px-4 py-3 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            <IoReturnUpBackOutline className="w-6 h-6" />
          </Link>
        </div>

        <main className="flex flex-col items-center justify-center min-h-[68vh] px-8">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl px-8 py-8 mb-4 border border-gray-100">
            <div className="flex flex-col items-center mb-6">
              <div className="bg-gradient-to-r from-[#2B1887] to-[#4a3bbd] p-4 rounded-2xl w-full text-center mb-6">
                <label className="block text-white font-bold text-2xl">
                  Change Profile Image
                </label>
                <p className="text-white/80 text-sm mt-1">
                  Update your profile information
                </p>
              </div>

              <input
                type="file"
                id="fileInput"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  setImageFile(file);
                  setImagePreview(URL.createObjectURL(file));
                }}
                className="hidden"
              />

              <label htmlFor="fileInput" className="cursor-pointer mt-2 inline-block">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-40 h-40 rounded-full object-cover hover:opacity-80 transition-all duration-200 shadow-lg border-4 border-white"
                  />
                ) : (
                  <div className="w-40 h-40 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center hover:opacity-80 transition-all duration-200 shadow-lg border-4 border-white">
                    <CiCamera className="h-7 w-7 text-gray-600" />
                  </div>
                )}
              </label>
            </div>

            <div className="space-y-5">
              <div className="group">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                  Display Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Enter new name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2B1887] focus:border-transparent bg-gradient-to-br from-gray-50 to-white text-black"
                />
              </div>

              <div className="group">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                  Email Address
                </label>
                <input
                  id="email"
                  type="text"
                  placeholder="Email"
                  value={user?.email || ""}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-black bg-gradient-to-br from-gray-100 to-gray-200 cursor-not-allowed opacity-70"
                />
              </div>

              <div className="group">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                  Change Password
                </label>
                <div className="space-y-4">
                  <input
                    type="password"
                    placeholder="Enter old password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-[#2B1887] focus:border-transparent bg-gradient-to-br from-gray-50 to-white"
                  />

                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-[#2B1887] focus:border-transparent bg-gradient-to-br from-gray-50 to-white"
                  />

                  <input
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-[#2B1887] focus:border-transparent bg-gradient-to-br from-gray-50 to-white"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg ${loading
                  ? "bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed cursor-pointer"
                  : "bg-gradient-to-r from-[#2B1887] to-[#4a3bbd] text-white hover:scale-105 cursor-pointer"
                  }`}
              >
                {loading ? "Saving Changes..." : "Save All Changes"}
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
