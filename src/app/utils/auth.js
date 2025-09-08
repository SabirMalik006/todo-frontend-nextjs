import toast from "react-hot-toast";

export const handleLogout = () => {
  fetch("todo-backend-w-nextjs-production-6329.up.railway.app", { method: "POST" })
    .then(() => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      toast.success("Logged out successfully ");
      setTimeout(() => (window.location.href = "/login"), 1500);
    })
    .catch(() => toast.error("Logout failed ❌"));
};
