"use client";
import { useEffect, useState, useRef } from "react";
import { MdDeleteOutline } from "react-icons/md";
import Navbar from "../components/Navbar";
import api from "../utils/api";
import toast from "react-hot-toast";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import AuthRoute from "../components/AuthRoute";
import { FiMoreVertical } from "react-icons/fi";
import { TbDotsVertical } from "react-icons/tb";
import { IoMdDoneAll } from "react-icons/io";

export default function TodoPage() {
  const [columns, setColumns] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [priority, setPriority] = useState("low");
  const [isDragging, setIsDragging] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameColumnName, setRenameColumnName] = useState("");
  const [columnToRename, setColumnToRename] = useState(null);

  const boardRef = useRef(null);
  let isDown = false;
  let startX, scrollLeft;

  const handleMouseDown = (e) => {
    if (isDragging) return;

    isDown = true;
    startX = e.pageX - boardRef.current.offsetLeft;
    scrollLeft = boardRef.current.scrollLeft;

    const handleMouseMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - boardRef.current.offsetLeft;
      const walk = (x - startX) * 1.2;
      boardRef.current.scrollLeft = scrollLeft - walk;
    };

    const handleMouseUp = () => {
      isDown = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");

  const [activeColumnForNewTodo, setActiveColumnForNewTodo] = useState(null);

  const [activeMenu, setActiveMenu] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchTodos = async () => {
    try {
      const headers = getAuthHeaders();
      const [colRes, todoRes] = await Promise.all([
        api.get("/column", headers),
        api.get("/todo", headers),
      ]);

      const cols = colRes.data || [];
      const todos = todoRes.data || [];

      const withTodos = cols.map((col) => ({
        ...col,
        todos:
          todos
            .filter((t) => String(t.column) === String(col._id))
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) || [],
      }));

      setColumns(withTodos);
      console.log("Fetched columns:", withTodos);
    } catch (err) {
      console.error("fetchTodos error:", err.response?.data || err.message);
      toast.error("Failed to fetch data ");
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const openAddTodoForColumn = (colId) => {
    setEditingTodo(null);
    setTitle("");
    setDescription("");
    setPriority("low");
    setActiveColumnForNewTodo(colId);
    setIsModalOpen(true);
  };

  const openModalForEdit = (todo) => {
    setEditingTodo(todo);
    setTitle(todo.title || "");
    setDescription(todo.description ?? "");
    setPriority(todo.priority || "low");
    setActiveColumnForNewTodo(todo.column);
    setIsModalOpen(true);
  };

  const saveTodo = async () => {
    if (!title.trim()) return toast.error("Title required!");
    setLoading(true);

    try {
      const headers = getAuthHeaders();

      if (editingTodo) {
        const payload = {
          title,
          description,
          priority,
          completed: editingTodo.completed ?? false,
          column: editingTodo.column ?? activeColumnForNewTodo,
        };

        const res = await api.put(`/todo/${editingTodo._id}`, payload, headers);
        const updated = res.data;

        setColumns((prev) =>
          prev.map((col) => {
            if (String(col._id) === String(updated.column)) {
              const exists = col.todos.some(
                (t) => String(t._id) === String(updated._id)
              );
              if (exists) {
                return {
                  ...col,
                  todos: col.todos.map((t) =>
                    String(t._id) === String(updated._id) ? updated : t
                  ),
                };
              } else {
                return { ...col, todos: [...col.todos, updated] };
              }
            } else {
              return {
                ...col,
                todos: col.todos.filter(
                  (t) => String(t._id) !== String(updated._id)
                ),
              };
            }
          })
        );

        toast.success("Todo updated ✏️");
      } else {
        let targetColId = activeColumnForNewTodo;
        if (!targetColId) {
          const defaultCol = columns.find((c) => c.name === "todo");
          targetColId = defaultCol ? defaultCol._id : null;
        }
        if (!targetColId) {
          toast.error("No column available to add todo");
          setLoading(false);
          return;
        }

        const payload = {
          title,
          description,
          priority,
          column: targetColId,
        };

        console.log("Creating todo with payload:", payload);
        const res = await api.post("/todo", payload, headers);
        const created = res.data;

        setColumns((prev) =>
          prev.map((col) =>
            String(col._id) === String(created.column)
              ? { ...col, todos: [...col.todos, created] }
              : col
          )
        );

        toast.success("Todo added ✅");
      }

      setTitle("");
      setDescription("");
      setPriority("low");
      setEditingTodo(null);
      setActiveColumnForNewTodo(null);
      setIsModalOpen(false);
    } catch (err) {
      console.error("saveTodo error:", err.response?.data || err.message);
      const message = err.response?.data?.message || "Failed to save todo";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const deleteTodo = async (id) => {
    try {
      const headers = getAuthHeaders();
      await api.delete(`/todo/${id}`, headers);

      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          todos: col.todos.filter((t) => String(t._id) !== String(id)),
        }))
      );
      toast.success("Todo deleted 🗑️");
    } catch (err) {
      console.error("deleteTodo error:", err.response?.data || err.message);
      toast.error("Failed to delete ❌");
    }
  };

  const deleteColumn = async (colId) => {
    try {
      const headers = getAuthHeaders();
      await api.delete(`/column/${colId}`, headers);

      setColumns((prev) =>
        prev.filter((col) => String(col._id) !== String(colId))
      );
      toast.success("Column deleted 🗑️");
    } catch (err) {
      console.error(
        "deleteColumn error:",
        err.response?.data || err.message || err
      );
      toast.error(err.response?.data?.message || "Failed to delete column ❌");
    }
  };

 const renameColumn = (colId) => {
  const col = columns.find((c) => c._id === colId);
  if (col) {
    setColumnToRename(col);                 
    setRenameColumnName(col.name);          
    setIsRenameModalOpen(true);             
  }
};

const handleRenameColumn = async () => {
  if (!renameColumnName.trim()) return toast.error("Column name cannot be empty ❌");

  try {
    const res = await api.put(`/column/${columnToRename._id}`, { name: renameColumnName.trim() });

    if (res.status === 200) {
      toast.success("Column renamed ✅");
      setIsRenameModalOpen(false);
      setRenameColumnName("");
      fetchTodos();
    } else {
      toast.error("Failed to rename column ❌");
    }
  } catch (err) {
    toast.error("Failed to rename column ❌");
    console.error("renameColumn error:", err.response?.data || err.message);
  }
};


  const onDragEnd = async (result) => {
    setIsDragging(false);

    const { source, destination, draggableId } = result;
    if (!destination) return;

    const srcColId = source.droppableId;
    const dstColId = destination.droppableId;
    if (srcColId === dstColId && source.index === destination.index) return;

    const newColumns = columns.map((c) => ({
      ...c,
      todos: [...(c.todos || [])],
    }));

    const sourceCol = newColumns.find(
      (c) => String(c._id) === String(srcColId)
    );
    const destCol = newColumns.find((c) => String(c._id) === String(dstColId));
    if (!sourceCol || !destCol) return;

    const [moved] = sourceCol.todos.splice(source.index, 1);
    moved.column = dstColId;

    destCol.todos.splice(destination.index, 0, moved);

    sourceCol.todos.forEach((t, i) => (t.order = i + 1));
    destCol.todos.forEach((t, i) => (t.order = i + 1));

    setColumns(newColumns);

    toast.success(` ${moved.title} moved to ${destCol.name}`, {
      autoClose: 2000,
    });

    try {
      const headers = getAuthHeaders();

      await api.put(`/todo/${draggableId}`, { column: moved.column }, headers);

      const orderData = newColumns.flatMap((col) =>
        (col.todos || []).map((t) => ({
          id: t._id,
          order: t.order ?? 0,
          column: col._id,
        }))
      );

      await api.put("/todo/update-order", { orderData }, headers);
    } catch (err) {
      console.error("onDragEnd error:", err.response?.data || err.message);
      toast.error("❌ Failed to save changes, refreshing...");
      fetchTodos();
    }
  };

  const saveColumn = async () => {
    if (!newColumnName.trim()) return toast.error("Column name required!");
    try {
      const headers = getAuthHeaders();
      const res = await api.post("/column", { name: newColumnName }, headers);
      const created = res.data;
      setColumns((prev) => [...prev, { ...created, todos: [] }]);
      setNewColumnName("");
      setIsColumnModalOpen(false);
      toast.success("Column added ");
    } catch (err) {
      console.error("saveColumn error:", err.response?.data || err.message);
      toast.error("Failed to create column ❌");
    }
  };

  return (
    <>
      <AuthRoute />
      <Navbar />
      <div className="h-full w-full bg-[#e0dee6] todo pt-15 ">
        <div className="flex justify-end px-10 mb-4">
          <button
            onClick={() => setIsColumnModalOpen(true)}
            className="bg-[#2B1887] text-white px-4 py-2 rounded-lg hover:bg-[#4321a8] duration-300 cursor-pointer "
          >
            + Add Column
          </button>
        </div>

        <DragDropContext
          onDragStart={() => setIsDragging(true)}
          onDragEnd={onDragEnd}
        >
          <div
            ref={boardRef}
            onMouseDown={handleMouseDown}
            className="flex gap-6 bg-[#e0dee6] px-6 lg:px-10 py-4 items-start overflow-x-auto h-[calc(100vh-50px)] select-none"
          >
            {columns.map((col) => (
              <Droppable key={col._id} droppableId={String(col._id)}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="bg-[#D5CCFF] py-5 px-3 border rounded-2xl flex flex-col min-w-[300px] w-full min-h-[200px] max-h-full- overflow-y-auto"
                  >
                    {/* Column Header */}
                    <div className="flex justify-between mb-3 relative">
                      <h3
                        className={`font-semibold text-[#2B1887] break-words ${
                          columns.length > 6
                            ? "text-sm sm:text-base"
                            : columns.length > 4
                            ? "text-lg sm:text-xl"
                            : columns.length > 2
                            ? "text-xl sm:text-2xl"
                            : "text-2xl sm:text-3xl"
                        }`}
                      >
                        {col.name}
                      </h3>

                      {/* Hamburger menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenu(
                              activeMenu === col._id ? null : col._id
                            );
                          }}
                          className="p-2 rounded-full hover:bg-[#c5b8ff] duration-300"
                        >
                          <TbDotsVertical className="w-5 h-5 text-[#2B1887] cursor-pointer" />
                        </button>

                        {activeMenu === col._id && (
                          <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg z-20">
                            <ul className="flex flex-col text-sm">
                              <li
                                className="px-4 py-2 text-gray-800 hover:scale-103 transform duration-300 cursor-pointer"
                                onClick={() => {
                                  setActiveMenu(null);
                                  openAddTodoForColumn(col._id);
                                }}
                              >
                                ➕ Add Todo
                              </li>
                              <li
                                className="px-4 py-2 text-gray-800 cursor-pointer hover:scale-103 transform duration-300"
                                onClick={() => {
                                  setActiveMenu(null);
                                  renameColumn(col._id);
                                }}
                              >
                                ✏️ Rename
                              </li>
                              <li
                                className="px-4 py-2 text-gray-800 cursor-pointer hover:scale-103 transform duration-300"
                                onClick={() => {
                                  setActiveMenu(null);
                                  deleteColumn(col._id);
                                }}
                              >
                                ❌ Delete Column
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Todos */}
                    <div className="flex flex-col gap-3">
                      {(col.todos || []).map((todo, index) => (
                        <Draggable
                          key={String(todo._id)}
                          draggableId={String(todo._id)}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`relative bg-[#e9e8ee] p-5 rounded-lg shadow break-words ${
                                snapshot.isDragging
                                  ? "opacity-95 scale-101"
                                  : ""
                              }`}
                            >
                              {/* Index Badge */}
                              <p className="absolute top-0 left-0 bg-black text-white text-xs sm:text-sm font-bold px-[6px] flex items-center justify-center shadow rounded-br-2xl">
                                {index + 1}
                              </p>

                              {/* Todo Content */}
                              <div
                                onClick={() => openModalForEdit(todo)}
                                className="mb-3 cursor-pointer"
                              >
                                <div className="relative pr-6">
                                  <p className="text-base sm:text-lg font-semibold text-black break-words">
                                    {todo.title}
                                  </p>
                                  <MdDeleteOutline
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteTodo(todo._id);
                                    }}
                                    className="absolute top-0 right-0 text-red-500 cursor-pointer hover:scale-110 duration-300 w-5 h-5"
                                  />
                                </div>
                                <p className="text-gray-600 text-xs sm:text-sm break-words">
                                  {todo.description }
                                </p>
                              </div>

                              {/* Todo Footer */}
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-3 w-full justify-between">
                                  <div className="flex gap-1 items-center">
                                    <p className="bg-[#ECB811] text-white text-xs sm:text-sm font-semibold px-5 py-2 rounded">
                                      {todo.day}
                                    </p>
                                    
                                  </div>

                                  <span
                                    className={`px-5 py-2 rounded text-white text-xs sm:text-sm ${
                                      todo.priority === "high"
                                        ? "bg-red-500"
                                        : todo.priority === "medium"
                                        ? "bg-yellow-500"
                                        : "bg-green-500"
                                    }`}
                                  >
                                    {todo.priority}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Todo Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center text-black z-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg w-[400px]">
            <h2 className="text-2xl font-bold text-[#2B1887] mb-4">
              {editingTodo ? "Update Todo" : "Add New Todo"}
            </h2>

            <label className="block text-gray-700 mb-1">Enter Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter todo title"
              className="border px-3 py-2 rounded-lg w-full mb-4"
            />

            <label className="block text-gray-700 mb-1">Select Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="border px-3 py-2 rounded-lg w-full mb-4"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>

            <label className="block text-gray-700 mb-1">
              Enter Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter todo description"
              rows="4"
              className="border px-3 py-2 rounded-lg w-full mb-4 resize-none"
            ></textarea>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingTodo(null);
                  setTitle("");
                  setDescription("");
                  setActiveColumnForNewTodo(null);
                }}
                className="bg-gray-400 text-white px-4 py-2 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={saveTodo}
                disabled={loading}
                className="bg-[#2B1887] text-white px-4 py-2 rounded-lg hover:scale-105 duration-300 cursor-pointer"
              >
                {loading ? "Saving..." : editingTodo ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Column Modal */}
      {isColumnModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center text-black z-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg w-[400px]">
            <h2 className="text-2xl font-bold text-[#2B1887] mb-4">
              Add New Column
            </h2>

            <label className="block text-gray-700 mb-1">Column Name</label>
            <input
              type="text"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              placeholder="Enter column name"
              className="
border px-3 py-2 rounded-lg w-full mb-4"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsColumnModalOpen(false);
                  setNewColumnName("");
                }}
                className="bg-gray-400 text-white px-4 py-2 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={saveColumn}
                className="bg-[#2B1887] text-white px-4 py-2 rounded-lg hover:scale-105 duration-300 cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {isRenameModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center text-black z-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg w-[400px]">
            <h2 className="text-2xl font-bold text-[#2B1887] mb-4">
              Rename Column
            </h2>

            <label className="block text-gray-700 mb-1">New Column Name</label>
            <input
              type="text"
              value={renameColumnName}
              onChange={(e) => setRenameColumnName(e.target.value)}
              placeholder="Enter new column name"
              className="border px-3 py-2 rounded-lg w-full mb-4"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsRenameModalOpen(false);
                  setRenameColumnName("");
                }}
                className="bg-gray-400 text-white px-4 py-2 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameColumn} // 🔹 function to call update API
                className="bg-[#2B1887] text-white px-4 py-2 rounded-lg hover:scale-105 duration-300 cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <AuthRoute />
    </>
  );
}
