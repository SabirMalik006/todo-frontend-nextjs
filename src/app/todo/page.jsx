"use client";
import { useEffect, useState } from "react";
import { CiBookmarkPlus } from "react-icons/ci";
import { IoCheckmarkDoneSharp } from "react-icons/io5";
import { MdDeleteOutline } from "react-icons/md";
import Navbar from "../components/Navbar";
import api from "../utils/api";
import toast from "react-hot-toast";

export default function TodoPage() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);

  // Fetch all todos
  const fetchTodos = async () => {
    try {
      const res = await api.get("/todo");
      setTodos(res.data);
    } catch (err) {
      toast.error("Failed to fetch todos ❌");
    }
  };

  // Create / Update Todo
  const saveTodo = async () => {
    if (!title.trim()) return toast.error("Title required!");
    setLoading(true);
    try {
      if (editingTodo) {
        // Update existing
        const res = await api.put(`/todo/${editingTodo._id}`, {
          title,
          description,
          completed: editingTodo.completed,
        });
        setTodos(todos.map((t) => (t._id === editingTodo._id ? res.data : t)));
        toast.success("Todo updated ✏️");
      } else {
        // Create new
        const res = await api.post("/todo", { title, description });
        setTodos([...todos, res.data]);
        toast.success("Todo added ✅");
      }

      setTitle("");
      setDescription("");
      setEditingTodo(null);
      setIsModalOpen(false);
    } catch (err) {
      toast.error("Failed ❌");
    } finally {
      setLoading(false);
    }
  };

  // Toggle completed
  const toggleTodo = async (todo) => {
    try {
      const res = await api.put(`/todo/${todo._id}`, {
        completed: !todo.completed,
        title: todo.title,
        description: todo.description,
      });
      setTodos(todos.map((t) => (t._id === todo._id ? res.data : t)));
    } catch (err) {
      toast.error("Failed to update ❌");
    }
  };

  // Delete todo
  const deleteTodo = async (id) => {
    try {
      await api.delete(`/todo/${id}`);
      setTodos(todos.filter((t) => t._id !== id));
      toast.success("Todo deleted 🗑️");
    } catch (err) {
      toast.error("Failed to delete ❌");
    }
  };

  // Open modal for edit
  const openModalForEdit = (todo) => {
    setEditingTodo(todo);
    setTitle(todo.title);
    setDescription(todo.description ?? "");
    setIsModalOpen(true);
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  return (
    <>
      <Navbar />
      <div className="h-screen w-full bg-[#2B1887]">
        <h1 className="text-white text-center text-6xl p-10">Todo Kanban</h1>

        <div className="grid grid-cols-2 gap-4 bg-[#2B1887] h-[calc(100vh-6rem)] pl-20">
          {/* Left Column - To-do */}
          <div className="bg-[#e0ddf0] p-5 border rounded-4xl flex flex-col h-[18rem] w-[33rem]">
            <div className="flex justify-between mb-3">
              <h3 className="text-3xl text-[#2B1887] font-semibold flex items-center gap-2">
                <CiBookmarkPlus />
                To-do
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(true);
                  setEditingTodo(null);
                  setTitle("");
                  setDescription("");
                }}
                className="bg-[#2B1887] text-white px-3 py-2 rounded-2xl hover:scale-105 duration-300"
              >
                Add +
              </button>
            </div>

            {/* Todo List */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {todos.filter((t) => !t.completed).length === 0 ? (
                <p className="text-black text-center text-2xl">No todos here</p>
              ) : (
                todos
                  .filter((t) => !t.completed)
                  .map((todo) => (
                    <div
                      key={todo._id}
                      className="flex justify-between items-start bg-gray-200 p-3 rounded-lg shadow"
                    >
                      <div onClick={() => openModalForEdit(todo)} className="cursor-pointer">
                        <p className="text-lg font-semibold text-black">{todo.title}</p>
                        <p className="text-sm text-gray-600">{todo.description || "No description"}</p>
                      </div>
                      <div className="flex flex-col gap-1 items-center">
                        
                        <MdDeleteOutline
                          onClick={() => deleteTodo(todo._id)}
                          className="text-2xl text-red-500 cursor-pointer hover:scale-110 duration-300"
                        />
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Right Column - Done */}
          <div className="bg-[#D5CCFF] p-5 border rounded-4xl flex flex-col h-[18rem] w-[33rem]">
            <h3 className="text-3xl text-[#2B1887] font-semibold flex items-center gap-2">
              <IoCheckmarkDoneSharp />
              Done
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2 mt-4">
              {todos.filter((t) => t.completed).length === 0 ? (
                <h4 className="text-2xl text-black text-center pt-5 font-semibold">No Todo Here</h4>
              ) : (
                todos
                  .filter((t) => t.completed)
                  .map((todo) => (
                    <div
                      key={todo._id}
                      className="flex justify-between items-start bg-white p-3 rounded-lg shadow"
                    >
                      <div onClick={() => openModalForEdit(todo)} className="cursor-pointer">
                        <p className="text-lg font-semibold line-through text-gray-500">{todo.title}</p>
                        <p className="text-sm line-through text-gray-400">{todo.description || "No description"}</p>
                      </div>
                      <div className="flex flex-col gap-1 items-center">
                        <button
                          onClick={() => toggleTodo(todo)}
                          className="bg-yellow-500 text-white px-2 py-1 rounded"
                        >
                          Undo
                        </button>
                        <MdDeleteOutline
                          onClick={() => deleteTodo(todo._id)}
                          className="text-2xl text-red-500 cursor-pointer hover:scale-110 duration-300"
                        />
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center text-black">
          <div className="bg-white p-6 rounded-2xl shadow-lg w-[400px]">
            <h2 className="text-2xl font-bold text-[#2B1887] mb-4">
              {editingTodo ? "Update Todo" : "Add New Todo"}
            </h2>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter todo title"
              className="border px-3 py-2 rounded-lg w-full mb-4"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter todo description"
              rows="4"
              className="border px-3 py-2 rounded-lg w-full mb-4"
            ></textarea>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingTodo(null);
                  setTitle("");
                  setDescription("");
                }}
                className="bg-gray-400 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={saveTodo}
                disabled={loading}
                className="bg-[#2B1887] text-white px-4 py-2 rounded-lg hover:scale-105 duration-300"
              >
                {loading ? "Saving..." : editingTodo ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
