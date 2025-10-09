"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../utils/api";
import AuthRoute from "../components/AuthRoute";
import { FaTrash, FaEdit, FaPlus, FaArrowRight } from "react-icons/fa";
import { toast } from "react-hot-toast";
import Navbar from "../components/Navbar";
import Swal from "sweetalert2";

export default function Dashboard() {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [newBoard, setNewBoard] = useState({ title: "", description: "" });
  const [editBoard, setEditBoard] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const boardRes = await api.get("/board");
        setBoards(boardRes.data);
      } catch (error) {
        toast.error(error.response?.data?.message || "Error fetching boards");
      } finally {
        setLoading(false);
      }
    };
    fetchBoards();
  }, []);

  const handleCreateBoard = async () => {
    if (!newBoard.title.trim()) {
      toast.error("Board title required!");
      return;
    }
    try {
      const res = await api.post("/board", {
        title: newBoard.title,
        description: newBoard.description,
      });
      setBoards([...boards, res.data]);
      setNewBoard({ title: "", description: "" });
      setModalOpen(false);
      toast.success("Board created successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error creating board");
    }
  };

  const handleDeleteBoard = async (id, e) => {
    e.stopPropagation();

    if (!id) return toast.error("Invalid board ID");

    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This action will permanently delete the board.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await api.delete(`/board/${id}`);
      setBoards(prev => prev.filter(b => b._id !== id));
      toast.success(res.data?.message || "Board deleted successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error deleting board");
    }
  };

  const handleEditBoard = async () => {
    if (!editBoard.title.trim()) {
      toast.error("Board title required!");
      return;
    }
    try {
      const res = await api.put(`/board/${editBoard._id}`, {
        title: editBoard.title,
        description: editBoard.description,
      });
      setBoards(boards.map((b) => (b._id === editBoard._id ? res.data : b)));
      setEditModalOpen(false);
      setEditBoard(null);
      toast.success("Board updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error updating board");
    }
  };

  const openBoard = (id) => {
    router.push(`/todo/${id}`);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/50 z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2B1887]"></div>
      </div>

    );
  }

  return (
    <AuthRoute>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex flex-col items-center py-10 px-4 sm:px-6 md:px-10 mt-13">
        <div className="flex flex-col sm:flex-row justify-between items-center w-full max-w-6xl mb-10 gap-4">
          <h1 className="text-3xl sm:text-4xl font-semibold text-slate-800 tracking-tight text-center sm:text-left">
            My Boards
          </h1>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#2B1887] to-[#4a3bbd] text-white px-5 sm:px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 shadow-md w-full sm:w-auto cursor-pointer"
          >
            <FaPlus /> Create Board
          </button>
        </div>

        {boards.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center h-[50vh] px-4">
            <p className="text-lg sm:text-xl text-slate-500 font-medium break-words">
              No boards here yet
            </p>
            <p className="text-sm text-slate-400 mt-2 break-words">
              Start by creating your first board above
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 w-full max-w-6xl">
            {boards.map((board) => (
              <div
                key={board._id}
                className="bg-white p-5 sm:p-4 rounded-3xl shadow-2xl transition-all duration-300 border border-gray-100 hover:border-gray-200 group overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg sm:text-xl font-semibold text-slate-800 truncate">
                        {board.title}
                      </h2>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditBoard(board);
                          setEditModalOpen(true);
                        }}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50 cursor-pointer"
                      >
                        <FaEdit size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteBoard(board._id, e)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50 cursor-pointer"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm sm:text-base text-slate-500 mt-4 overflow-hidden text-ellipsis line-clamp-3 break-words text-left">
                    {board.description || "No description provided"}
                  </p>
                </div>

                <button
                  onClick={() => openBoard(board._id)}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-[#2B1887] hover:to-[#4a3bbd] text-white py-2 px-4 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg mt-4 cursor-pointer"
                >
                  Open Board
                  <FaArrowRight size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {modalOpen && (
          <div
            onMouseDown={(e) => (e.currentTarget.dataset.down = "true")}
            onMouseUp={(e) => {
              if (e.currentTarget.dataset.down === "true") {
                setModalOpen(false);
              }
              delete e.currentTarget.dataset.down;
            }}
            className="fixed inset-0 bg-gradient-to-br from-black/40 to-black/60 backdrop-blur-md flex justify-center items-center z-50 p-4 sm:p-6"
          >
            <div
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-[450px] overflow-hidden relative border border-gray-100"
            >
              <div className="bg-gradient-to-r from-[#2B1887] to-[#4a3bbd] p-6 relative">
                <h2 className="text-2xl font-bold text-white text-center cursor-pointer">
                  Create Board
                </h2>
                <p className="text-white/80 text-sm mt-1 text-center">
                  Start organizing your tasks
                </p>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div className="group">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                      Board Title
                    </label>
                    <input
                      type="text"
                      value={newBoard.title}
                      onChange={(e) =>
                        setNewBoard({ ...newBoard, title: e.target.value })
                      }
                      placeholder="Enter board title"
                      className="border border-gray-300 rounded-xl w-full p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B1887] focus:border-transparent bg-gradient-to-br from-gray-50 to-white"
                    />
                  </div>

                  <div className="group">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                      Description
                    </label>
                    <textarea
                      value={newBoard.description}
                      onChange={(e) =>
                        setNewBoard({ ...newBoard, description: e.target.value })
                      }
                      placeholder="Enter board description"
                      className="border border-gray-300 rounded-xl w-full p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B1887] focus:border-transparent bg-gradient-to-br from-gray-50 to-white resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateBoard}
                    className="bg-gradient-to-r from-[#2B1887] to-[#4a3bbd] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200  cursor-pointer"
                  >
                    Create Board
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {editModalOpen && editBoard && (
          <div
            onMouseDown={(e) => (e.currentTarget.dataset.down = "true")}
            onMouseUp={(e) => {
              if (e.currentTarget.dataset.down === "true") {
                setEditModalOpen(false);
              }
              delete e.currentTarget.dataset.down;
            }}
            className="fixed inset-0 bg-gradient-to-br from-black/40 to-black/60 backdrop-blur-md flex justify-center items-center z-50 p-4 sm:p-6"
          >
            <div
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-[450px] overflow-hidden relative border border-gray-100"
            >
              <div className="bg-gradient-to-r from-[#2B1887] to-[#4a3bbd] p-6 relative">
                <h2 className="text-2xl font-bold text-white text-center">
                  Edit Board
                </h2>
                <p className="text-white/80 text-sm mt-1 text-center">
                  Update your board details
                </p>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div className="group">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                      Board Title
                    </label>
                    <input
                      type="text"
                      value={editBoard.title}
                      onChange={(e) =>
                        setEditBoard({ ...editBoard, title: e.target.value })
                      }
                      placeholder="Enter board title"
                      className="border border-gray-300 rounded-xl w-full p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B1887] focus:border-transparent bg-gradient-to-br from-gray-50 to-white"
                    />
                  </div>

                  <div className="group">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                      Description
                    </label>
                    <textarea
                      value={editBoard.description}
                      onChange={(e) =>
                        setEditBoard({ ...editBoard, description: e.target.value })
                      }
                      placeholder="Enter board description"
                      className="border border-gray-300 rounded-xl w-full p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B1887] focus:border-transparent bg-gradient-to-br from-gray-50 to-white resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setEditModalOpen(false)}
                    className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditBoard}
                    className="bg-gradient-to-r from-[#2B1887] to-[#4a3bbd] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthRoute>
  );
}
