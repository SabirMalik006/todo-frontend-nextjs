"use client";
import { useEffect, useState } from "react";
import { CiBookmarkPlus } from "react-icons/ci";
import { IoCheckmarkDoneSharp } from "react-icons/io5";
import { MdDeleteOutline } from "react-icons/md";
import Navbar from "../components/Navbar";
import api from "../utils/api";
import toast from "react-hot-toast";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import AuthRoute from "../components/AuthRoute";

export default function TodoPage() {
  const [columns, setColumns] = useState({ todo: [], pending: [], done: [] });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [priority, setPriority] = useState("low");

  const fetchTodos = async () => {
    try {
      const res = await api.get("/todo", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
  
      const all = res.data || [];
      setColumns({
        todo: all
          .filter((t) => t.column === "todo")
          .sort((a, b) => a.order - b.order),
        pending: all
          .filter((t) => t.column === "pending")
          .sort((a, b) => a.order - b.order),
        done: all
          .filter((t) => t.column === "done")
          .sort((a, b) => a.order - b.order),
      });
    } catch (err) {
      toast.error("Failed to fetch todos ");
    }
  };
  
  const openAddModal = () => {
    setEditingTodo(null);
    setTitle("");
    setDescription("");
    setPriority("low");
    setIsModalOpen(true);
  };

  const saveTodo = async () => {
    if (!title.trim()) return toast.error("Title required!");
    setLoading(true);

    try {
      if (editingTodo) {
        const payload = {
          title,
          description,
          priority,
          completed: editingTodo.completed,
          column: editingTodo.column || "todo", // important
        };

        const res = await api.put(`todo/${editingTodo._id}`, payload);
        const updated = res.data;

        setColumns((prev) => {
          return {
            todo:
              updated.column === "todo"
                ? prev.todo.map((t) => (t._id === updated._id ? updated : t))
                : prev.todo.filter((t) => t._id !== updated._id),
            pending:
              updated.column === "pending"
                ? prev.pending.map((t) => (t._id === updated._id ? updated : t))
                : prev.pending.filter((t) => t._id !== updated._id),
            done:
              updated.column === "done"
                ? prev.done.map((t) => (t._id === updated._id ? updated : t))
                : prev.done.filter((t) => t._id !== updated._id),
          };
        });

        toast.success("Todo updated ✏️");
      } else {
        const res = await api.post("/todo/", { title, description, priority });
        const created = res.data;
        setColumns((prev) => ({ ...prev, todo: [...prev.todo, created] }));
        toast.success("Todo added ✅");
      }

      setTitle("");
      setDescription("");
      setEditingTodo(null);
      setIsModalOpen(false);
      setPriority("low");
    } catch (err) {
      console.log(err);
      toast.error("Failed ❌");
    } finally {
      setLoading(false);
    }
  };

  const toggleTodo = async (todo) => {
    try {
      setColumns((prev) => {
        const source = todo.completed ? "done" : "todo";
        const dest = todo.completed ? "todo" : "done";
        const newSource = prev[source].filter((t) => t._id !== todo._id);
        const moved = { ...todo, completed: !todo.completed };
        const newDest = [...prev[dest], moved];
        return { ...prev, [source]: newSource, [dest]: newDest };
      });
      const res = await api.put(`todo/${todo._id}`, {
        completed: !todo.completed,
        title: todo.title,
        priority: todo.priority,
        description: todo.description,
      });
      const updated = res.data;

      setColumns((prev) => {
        const source = updated.completed ? "done" : "todo";
        const other = updated.completed ? "todo" : "done";
        return {
          ...prev,
          [source]: prev[source].map((t) =>
            t._id === updated._id ? updated : t
          ),
          [other]: prev[other].filter((t) => t._id !== updated._id),
        };
      });
    } catch (err) {
      toast.error("Failed to update ❌");
      fetchTodos();
    }
  };

  const deleteTodo = async (id) => {
    try {
      await api.delete(`todo/${id}`);
      setColumns((prev) => ({
        todo: prev.todo.filter((t) => t._id !== id),
        done: prev.done.filter((t) => t._id !== id),
        pending: prev.pending.filter((t) => t._id !== id),
      }));
      toast.success("Todo deleted 🗑️");
    } catch (err) {
      toast.error("Failed to delete ❌");
    }
  };

  const openModalForEdit = (todo) => {
    setEditingTodo(todo);
    setTitle(todo.title || "");
    setDescription(todo.description ?? "");
    setPriority(todo.priority || "low");
    setIsModalOpen(true);
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
  
    const srcCol = source.droppableId;
    const dstCol = destination.droppableId;
  
    let updatedColumns = { ...columns };
  
    // Same column reordering
    if (srcCol === dstCol) {
      const list = Array.from(columns[srcCol] || []);
      const [moved] = list.splice(source.index, 1);
      list.splice(destination.index, 0, moved);
      list.forEach((t, i) => (t.order = i + 1));
      updatedColumns[srcCol] = list;
    } else {
      // Different column move
      const sourceList = Array.from(columns[srcCol] || []);
      const destList = Array.from(columns[dstCol] || []);
  
      const idx = sourceList.findIndex((t) => String(t._id) === String(draggableId));
      if (idx === -1) return;
  
      const [moved] = sourceList.splice(idx, 1);
      moved.completed = dstCol === "done";
      moved.column = dstCol; // very important
      destList.splice(destination.index, 0, moved);
  
      sourceList.forEach((t, i) => (t.order = i + 1));
      destList.forEach((t, i) => (t.order = i + 1));
  
      updatedColumns[srcCol] = sourceList;
      updatedColumns[dstCol] = destList;
    }
  
    setColumns(updatedColumns);
  
    // save to backend
    try {
      const movedTodo = updatedColumns[dstCol].find(
        (t) => String(t._id) === String(draggableId)
      );
  
      await api.put(`todo/${draggableId}`, {
        completed: movedTodo.completed,
        column: movedTodo.column,
      });
  
      const orderData = [
        ...updatedColumns.todo.map((t) => ({
          id: t._id,
          order: t.order,
          column: "todo"
        })),
        ...updatedColumns.pending.map((t) => ({
          id: t._id,
          order: t.order,
          column: "pending",
        })),
        ...updatedColumns.done.map((t) => ({
          id: t._id,
          order: t.order,
          column: "done",
        })),
      ];
  
      await api.put("todo/update-order", { orderData });
  
      if (dstCol === "done") toast.success("Todo moved to completed");
      if (dstCol === "todo") toast.success("Todo moved to todo");
      if (dstCol === "pending") toast.success("Todo moved to pending");
    } catch (err) {
      toast.error("Failed to save changes");
      fetchTodos(); // restore from backend
    }
  };
  

  

  useEffect(() => {
    fetchTodos();
  }, []);

  return (
    <>
      <AuthRoute />
      <Navbar />
      <div className="h-full w-full bg-[#2B1887] todo ">
        <h1 className="text-white text-center text-6xl p-10">Todo Kanban</h1>

        <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 bg-[#2B1887] px-10 items-start">

            {/* Left Column - To-do */}
            <Droppable droppableId="todo">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="bg-[#D5CCFF] p-5 border rounded-2xl flex flex-col w-full min-h-[150px]"
                >
                  <div className="flex justify-between mb-3">
                    <h3 className="text-3xl text-[#2B1887] font-semibold">
                      To-do
                    </h3>
                    {/* Add Button */}
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="bg-[#2B1887] text-white px-3 py-1 rounded-lg hover:bg-[#4321a8] duration-300"
                    >
                      + Add
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {columns.todo.map((todo, index) => (
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
                            className={`relative bg-[#e9e8ee] p-3 rounded-lg shadow ${
                              snapshot.isDragging ? "opacity-95 scale-101" : ""
                            }`}
                          >
                            <p className="absolute top-0 left-0 bg-black text-white text-sm font-bold px-[5px]  flex items-center justify-center  shadow rounded-br-2xl">
                              {index + 1}
                            </p>

                            {/* Title + Description */}
                            <div
                              onClick={() => openModalForEdit(todo)}
                              className="mb-3 cursor-pointer"
                            >
                              <div>
                                <p className="text-lg font-semibold text-black">
                                  {todo.title}
                                </p>
                                {/* Delete Button */}
                                <MdDeleteOutline
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteTodo(todo._id);
                                  }}
                                  className="absolute top-3 right-2 text-red-500 cursor-pointer hover:scale-110 duration-300 w-4 h-4"
                                />
                              </div>
                              <p className="text-gray-600 text-sm">
                                {todo.description || "No description"}
                              </p>
                            </div>

                            {/* Footer Section */}
                            <div className="flex items-center justify-between w-full">
                              {/* Left Side: Date + dots + priority */}
                              <div className="flex items-center gap-3 w-full justify-between">
                                <div className="flex gap-1 items-center">
                                <p className="bg-[#ECB811] text-white text-sm font-semibold px-2 py-1 rounded-lg">{todo.day}</p>
                                  <div className="flex gap-1">
                                    <span className="bg-[#adaac2] h-[12px] w-[24px] rounded-bl-2xl"></span>
                                    <span className="bg-[#adaac2] h-[12px] w-[24px] rounded-bl-2xl"></span>
                                  </div>
                                </div>
                                <span
                                  className={`px-2 py-1 rounded text-white text-sm ${
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

            {/* Middle Column - Pending */}
            <Droppable droppableId="pending">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="bg-[#D5CCFF] p-5 border rounded-2xl flex flex-col w-full min-h-[150px]"
                >
                  <div className="flex justify-between mb-3">
                    <h3 className="text-3xl text-[#2B1887] font-semibold">
                      Pending
                    </h3>
                  </div>

                  <div className="flex-1 space-y-2">
                    {columns.pending.map((todo, index) => (
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
                            className={`relative bg-[#e9e8ee] p-3 rounded-lg shadow ${
                              snapshot.isDragging ? "opacity-95 scale-101" : ""
                            }`}
                          >
                            <p className="absolute top-0 left-0 bg-black text-white text-sm font-bold px-[5px]  flex items-center justify-center  shadow rounded-br-2xl">
                              {index + 1}
                            </p>

                            {/* Title + Description */}
                            <div
                              onClick={() => openModalForEdit(todo)}
                              className="mb-3 cursor-pointer"
                            >
                              <div>
                                <p className="text-lg font-semibold text-black">
                                  {todo.title}
                                </p>
                                {/* Delete Button */}
                                <MdDeleteOutline
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteTodo(todo._id);
                                  }}
                                  className="absolute top-3 right-2 text-red-500 cursor-pointer hover:scale-110 duration-300 w-4 h-4"
                                />
                              </div>
                              <p className="text-gray-600 text-sm">
                                {todo.description || "No description"}
                              </p>
                            </div>

                            {/* Footer Section */}
                            <div className="flex items-center justify-between w-full">
                              {/* Left Side: Date + dots + priority */}
                              <div className="flex items-center gap-3 w-full justify-between">
                                <div className="flex gap-1 items-center">
                                <p className="bg-[#ECB811] text-white text-sm font-semibold px-2 py-1 rounded-lg">{todo.day}</p>
                                  <div className="flex gap-1">
                                    <span className="bg-[#ECB811] h-[12px] w-[24px] rounded-bl-2xl"></span>
                                    <span className="bg-[#adaac2] h-[12px] w-[24px] rounded-bl-2xl"></span>
                                  </div>
                                </div>
                                <span
                                  className={`px-2 py-1 rounded text-white text-sm ${
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

            {/* Right Column - Done */}
            <Droppable droppableId="done">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="bg-[#D5CCFF] p-5 border rounded-2xl flex flex-col w-full min-h-[150px]"
                >
                  <div className="flex justify-between mb-3">
                    <h3 className="text-3xl text-[#2B1887] font-semibold flex items-center gap-2">
                      <IoCheckmarkDoneSharp /> Done
                    </h3>
                  </div>

                  <div className="flex-1 space-y-2">
                    {columns.done.map((todo, index) => (
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
                            className={`relative bg-[#e9e8ee] p-3 rounded-lg shadow ${
                              snapshot.isDragging ? "opacity-95 scale-101" : ""
                            }`}
                          >
                            {/* Index badge top-left */}
                            <p className="absolute top-0 left-0 bg-black text-white text-sm font-bold px-[5px]  flex items-center justify-center  shadow rounded-br-2xl">
                              {index + 1}
                            </p>

                            {/* Main content (title + desc) */}
                            <div
                              onClick={() => openModalForEdit(todo)}
                              className="w-full pr-4 cursor-pointer"
                            >
                              <p className="text-lg font-semibold text-black">
                                {todo.title}
                              </p>
                              <p className="text-gray-600 text-sm">
                                {todo.description || "No description"}
                              </p>
                            </div>

                            {/* Right side: date/dots + priority */}
                            <div className="flex items-center justify-between w-full mt-3">
                              {/* Left Side: Date + dots + priority */}
                              <div className="flex items-center gap-3 w-full justify-between">
                                <div className="flex gap-1 items-center">
                                <p className="bg-[#ECB811] text-white text-sm font-semibold px-2 py-1 rounded-lg">{todo.day}</p>
                                  <div className="flex gap-1">
                                    <span className="bg-[#ECB811] h-[12px] w-[24px] rounded-bl-2xl"></span>
                                    <span className="bg-[#ECB811] h-[12px] w-[24px] rounded-bl-2xl"></span>
                                  </div>
                                </div>
                                <span
                                  className={`px-2 py-1 rounded text-white text-sm ${
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

                            {/* Delete button (small, clickable) */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTodo(todo._id);
                              }}
                              className="absolute top-2 right-2 text-red-500 hover:scale-110"
                            >
                              <MdDeleteOutline className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          </div>
        </DragDropContext>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center text-black z-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg w-[400px]">
            <h2 className="text-2xl font-bold text-[#2B1887] mb-4">
              {editingTodo ? "Update Todo" : "Add New Todo"}
            </h2>

            {/* Title */}
            <label className="block text-gray-700 mb-1">Enter Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter todo title"
              className="border px-3 py-2 rounded-lg w-full mb-4"
            />

            {/* Priority */}
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

            {/* Description */}
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

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingTodo(null);
                  setTitle("");
                  setDescription("");
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

      <AuthRoute />
    </>
  );
}
