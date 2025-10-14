import toast from "react-hot-toast";
import api from "../utils/api";

export const handleLogout = () => {
  api.post("/auth/logout")
    .then(() => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      toast.success("Logged out successfully ");
      setTimeout(() => (window.location.href = "/login"), 1000);
    })
    .catch(() => toast.error("Logout failed ❌"));
};
