import toast from "react-hot-toast";

export const handleLogout = () => {
  fetch("http://localhost:5000/api/auth/logout", { method: "POST" })
    .then(() => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      toast.success("Logged out successfully ");
      setTimeout(() => (window.location.href = "/login"), 1500);
    })
    .catch(() => toast.error("Logout failed ❌"));
};
