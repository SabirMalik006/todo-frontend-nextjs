"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../utils/api";
import AuthRoute from "../components/AuthRoute";
import { FaTrash, FaEdit, FaPlus, FaArrowRight } from "react-icons/fa";
import { toast } from "react-hot-toast";
import Navbar from "../components/Navbar";

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
    try {
      await api.delete(`/board/${id}`);
      setBoards(boards.filter((b) => b._id !== id));
      toast.success("Board deleted successfully!");
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
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AuthRoute>
      <Navbar/>
      <div className="min-h-screen bg-slate-100 flex flex-col items-center py-12 px-6">
        <div className="flex justify-between w-full max-w-5xl mb-10">
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
            My Boards
          </h1>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-lg font-medium
                       hover:bg-slate-900 transition shadow-sm"
          >
            <FaPlus /> Create Board
          </button>
        </div>

        {boards.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center h-[50vh]">
            <p className="text-xl text-slate-500 font-medium">
              No boards here yet 🚀
            </p>
            <p className="text-sm text-slate-400 mt-2">
              Start by creating your first board above
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-5xl">
            {boards.map((board) => (
              <div
                key={board._id}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 
                         border border-slate-200 hover:border-slate-300 group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-slate-800 line-clamp-1">
                      {board.title}
                    </h2>
                    <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                      {board.description || "No description provided"}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditBoard(board);
                        setEditModalOpen(true);
                      }}
                      className="text-slate-400 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50"
                    >
                      <FaEdit size={14} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteBoard(board._id, e)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={() => openBoard(board._id)}
                  className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-800 
                           text-slate-700 py-2 px-4 rounded-lg font-medium transition-all duration-300 
                           group-hover:bg-slate-800 group-hover:text-white mt-4"
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
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center text-black z-50"
            onClick={() => setModalOpen(false)}
          >
            <div
              className="bg-white p-6 rounded-2xl shadow-lg w-[400px]"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-[#2B1887] mb-4">
                Create Board
              </h2>
              <label className="block text-gray-700 mb-1">Board Title</label>
              <input
                type="text"
                value={newBoard.title}
                onChange={(e) =>
                  setNewBoard({ ...newBoard, title: e.target.value })
                }
                placeholder="Enter board title"
                className="border px-3 py-2 rounded-lg w-full mb-3"
              />

              <label className="block text-gray-700 mb-1">Description</label>
              <textarea
                value={newBoard.description}
                onChange={(e) =>
                  setNewBoard({ ...newBoard, description: e.target.value })
                }
                placeholder="Enter board description"
                className="border px-3 py-2 rounded-lg w-full mb-4 resize-none"
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setModalOpen(false)}
                  className="bg-gray-400 text-white px-4 py-2 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBoard}
                  className="bg-[#2B1887] text-white px-4 py-2 rounded-lg hover:scale-105 duration-300 cursor-pointer"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}


        {editModalOpen && editBoard && (
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center text-black z-50"
            onClick={() => setEditModalOpen(false)}
          >
            <div
              className="bg-white p-6 rounded-2xl shadow-lg w-[400px]"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-blue-600 mb-4">
                Edit Board
              </h2>
              <label className="block text-gray-700 mb-1">Board Title</label>
              <input
                type="text"
                value={editBoard.title}
                onChange={(e) =>
                  setEditBoard({ ...editBoard, title: e.target.value })
                }
                placeholder="Enter board title"
                className="border px-3 py-2 rounded-lg w-full mb-3"
              />

              <label className="block text-gray-700 mb-1">Description</label>
              <textarea
                value={editBoard.description}
                onChange={(e) =>
                  setEditBoard({ ...editBoard, description: e.target.value })
                }
                placeholder="Enter board description"
                className="border px-3 py-2 rounded-lg w-full mb-4 resize-none"
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="bg-gray-400 text-white px-4 py-2 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditBoard}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:scale-105 duration-300 cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthRoute>
  );
}