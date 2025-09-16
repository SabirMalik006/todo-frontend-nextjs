"use client";

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Link from "next/link";
import toast from "react-hot-toast";
import { IoReturnUpBackOutline } from "react-icons/io5";
import api from "../utils/api";

export default function Settings() {
  const [name, setName] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [user, setUser] = useState(null);
  const [activeOption, setActiveOption] = useState(null);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const res = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(res.data);
      setName(res.data.name || "");
      setImagePreview(res.data.image || null);
    } catch (error) {
      console.error(error);
      toast.error(" Failed to fetch user info");
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleChangeName = async () => {
    try {
      const res = await api.put(
        "/user/change-name",
        { name, oldPassword },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      toast.success(res.data.message || " Name updated successfully");
      setOldPassword("");
      setActiveOption(null);
      window.dispatchEvent(new Event("userUpdated"));
    } catch (err) {
      const msg =
        err.response?.data?.message === "Invalid password"
          ? "❌ Wrong current password"
          : "⚠️ Failed to update name";
      toast.error(msg);
    }
  };

  const handleSave = async (e) => {
  e.preventDefault();

  if (activeOption === "name") {
    await handleChangeName();
    return;
  }

  // prepare data to send
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

    // build request body dynamically
    const body = {};
    if (uploadedImageUrl) {
      body.image = uploadedImageUrl;
      body.imageId = uploadedImageId;
    }
    if (activeOption === "password") {
      body.oldPassword = oldPassword;
      body.newPassword = newPassword;
    }

    // only send if there's something to update
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
        setActiveOption(null);

        window.dispatchEvent(new Event("userUpdated"));
      }
    }
  } catch (err) {
    let msg = "⚠️ Something went wrong";
    if (err.response?.data?.message === "Invalid password") {
      msg = "❌ Wrong current password";
    } else if (err.response?.data?.message === "Passwords do not match") {
      msg = "❌ Passwords do not match";
    }
    toast.error(msg);
  }
};


  return (
    <>
      <Navbar />

      <div className="w-full max-w-lg flex px-8 my-4">
        <Link
          href="/"
          className="text-white font-medium text-start bg-[#2B1887] px-3 py-1 rounded-lg"
        >
          <IoReturnUpBackOutline className="w-6 h-6" />
        </Link>
      </div>

      <main className="flex flex-col items-center justify-center min-h-[68vh] px-8">
        <div className="w-full max-w-lg bg-[#f7f2f2] rounded-2xl shadow-xl px-10 py-20 mb-4">
          {/* user image here */}
          <div className="flex items-center justify-center mb-4">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-34 h-34 rounded-full object-cover"
              />
            ) : (
              <div className="w-34 h-34 rounded-full bg-gray-300 flex items-center justify-center text-center">
                <span className="text-gray-600 text-base font-medium">
                  Please Upload
                </span>
              </div>
            )}
          </div>

          <h2 className="text-3xl font-extrabold mb-6 text-center text-gray-900">
            User Settings
          </h2>

          {/* Options */}
          {!activeOption && (
            <div className="space-y-4">
              <button
                onClick={() => setActiveOption("image")}
                className="w-full bg-gray-700 text-white py-2 cursor-pointer rounded-lg font-medium hover:opacity-70 duration-300 transition"
              >
                Change Profile Image
              </button>
              <button
                onClick={() => setActiveOption("name")}
                className="w-full bg-gray-700 text-white py-2 cursor-pointer rounded-lg font-medium hover:opacity-70 duration-300 transition"
              >
                Change Username
              </button>
              <button
                onClick={() => setActiveOption("password")}
                className="w-full bg-gray-700 text-white py-2 cursor-pointer rounded-lg font-medium hover:opacity-70 duration-300 transition"
              >
                Change Password
              </button>
            </div>
          )}

          {/* Forms */}
          {activeOption && (
            <form onSubmit={handleSave} className="space-y-5 mt-6">
              {activeOption === "image" && (
                <div>
                  <label className="block text-gray-700 mb-1 font-medium text-center">
                    Profile Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      setImageFile(file);
                      setImagePreview(URL.createObjectURL(file));
                    }}
                    className="container mx-auto py-1 px-3 cursor-pointer rounded text-black border border-black text-center"
                  />
                </div>
              )}

              {activeOption === "name" && (
                <div>
                  <label className="block text-gray-700 mb-1 font-medium text-center text-2xl">
                    Change Name
                  </label>

                  {/* Name Input */}
                  <input
                    type="text"
                    placeholder="Enter new name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none text-black focus:ring-2 focus:ring-indigo-500 mb-3"
                  />

                  {/* Old Password Input */}
                  <input
                    type="password"
                    placeholder="Enter current password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none text-black focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              )}

              {activeOption === "password" && (
                <>
                  <div>
                    <label className="block text-gray-700 mb-1 font-medium">
                      Old Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter old password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-1 font-medium">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-1 font-medium">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="w-full bg-gray-700 text-white py-2 cursor-pointer rounded-lg  hover:opacity-70 duration-300 transition font-semibold"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setActiveOption(null)}
                  className="w-full bg-gray-400 text-white py-2 rounded-lg cursor-pointer font-semibold hover:bg-gray-500 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
