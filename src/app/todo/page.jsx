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
  const [columns, setColumns] = useState({ todo: [], done: [] });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [priority, setPriority] = useState("low");

  const fetchTodos = async () => {
    try {
      const res = await api.get("/");
      const all = res.data || [];
      setColumns({
        todo: all
          .filter((t) => !t.completed)
          .sort((a, b) => a.order - b.order),   
        done: all
          .filter((t) => t.completed)
          .sort((a, b) => a.order - b.order),  
      });
    } catch (err) {
      toast.error("Failed to fetch todos ");
    }
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
        };

        console.log("Payload going to API:", payload);

        const res = await api.put(`/${editingTodo._id}`, payload);
        const updated = res.data;

        setColumns((prev) => {
          const from = updated.completed ? "done" : "todo";
          return {
            todo:
              from === "todo"
                ? prev.todo.map((t) => (t._id === updated._id ? updated : t))
                : prev.todo
                    .filter((t) => t._id !== updated._id)
                    .concat(updated.completed ? [] : [updated]),
            done:
              from === "done"
                ? prev.done.map((t) => (t._id === updated._id ? updated : t))
                : prev.done
                    .filter((t) => t._id !== updated._id)
                    .concat(updated.completed ? [updated] : []),
          };
        });

        toast.success("Todo updated ✏️");
      } else {
        const res = await api.post("/", { title, description, priority });
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
      const res = await api.put(`/${todo._id}`, {
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
      await api.delete(`/${id}`);
      setColumns((prev) => ({
        todo: prev.todo.filter((t) => t._id !== id),
        done: prev.done.filter((t) => t._id !== id),
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
  
    if (srcCol === dstCol) {
      
      const list = Array.from(columns[srcCol]);
      const [moved] = list.splice(source.index, 1);
      list.splice(destination.index, 0, moved);
  
      list.forEach((t, i) => (t.order = i + 1));
      updatedColumns[srcCol] = list;
    } else {
  
      const sourceList = Array.from(columns[srcCol]);
      const destList = Array.from(columns[dstCol]);
  
      const idx = sourceList.findIndex(t => t._id === draggableId);
      if (idx === -1) return;
      const [moved] = sourceList.splice(idx, 1);
  
      moved.completed = dstCol === "done";
      destList.splice(destination.index, 0, moved);
  
      sourceList.forEach((t, i) => (t.order = i + 1));
      destList.forEach((t, i) => (t.order = i + 1));
  
      updatedColumns[srcCol] = sourceList;
      updatedColumns[dstCol] = destList;
    }
  
 
    setColumns(updatedColumns);
  
    
    (async () => {
      try {
    
        if (srcCol !== dstCol) {
          const movedTodo = updatedColumns[dstCol].find(t => t._id === draggableId);
          await api.put(`/${draggableId}`, { completed: movedTodo.completed });
  
          // Toast message
          if (dstCol === "done") toast.success("Todo moved to completed");
          if (dstCol === "todo") toast.success("✅ Todo moved to pending");
        }
  

        const orderData = [
          ...updatedColumns.todo.map(t => ({ id: t._id, order: t.order })),
          ...updatedColumns.done.map(t => ({ id: t._id, order: t.order })),
        ];
        await api.put("/update-order", { orderData });
      } catch (err) {
        toast.error("Failed to save changes");
        fetchTodos(); 
      }
    })();
  };
  
  
  
  


  useEffect(() => {
    fetchTodos();
  }, []);

  return (
    <>
      <AuthRoute />
      <Navbar />
      <div className="h-full w-full bg-[#2B1887]">
        <h1 className="text-white text-center text-6xl p-10">Todo Kanban</h1>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-2 gap-10 bg-[#2B1887] px-20 items-start">
            {/* Left Column - To-do */}
            <Droppable droppableId="todo">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="bg-[#D5CCFF] p-5 border rounded-2xl flex flex-col w-full min-h-[220px]"
                >
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
                      className="bg-[white] text-[#2B1887] px-3 py-2 rounded-md cursor-pointer hover:scale-105 duration-300"
                    >
                      Add +
                    </button>
                  </div>

                  <div className="flex-1 space-y-2">
                    {(!columns.todo || columns.todo.length) === 0 &&
                    columns.todo.length === 0 ? (
                      <p className="text-black text-center text-2xl">
                        No todos here
                      </p>
                    ) : (
                      columns.todo.map((todo, index) => (
                        <Draggable
                          key={todo._id}
                          draggableId={todo._id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`flex justify-between items-start bg-[#E5E2F5] hover:bg-[#ddd7fc] transition duration-200 p-3 rounded-lg shadow h-[276px] ${
                                snapshot.isDragging
                                  ? "opacity-95 scale-101"
                                  : ""
                              }`}
                            >
                              <div
                                onClick={() => openModalForEdit(todo)}
                                className="cursor-grabbing flex flex-col gap-7 pl-[10px]"
                              >
                                <div className="flex gap-1 items-center justify-between  ">
                                  <p className="text-xl text-black font-semibold">
                                    {todo.title}
                                  </p>
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

                                  <MdDeleteOutline
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteTodo(todo._id);
                                    }}
                                    className="text-2xl text-red-500 cursor-pointer hover:scale-110 duration-300"
                                  />
                                </div>

                                <p className="text-md text-gray-600 font-medium">
                                  {todo.description || "No description"}
                                </p>

                                <div className="flex gap-4 items-center justify-between w-[492px]">
                                  <div className="left flex gap-4 items-center">
                                    <p className="bg-[#ECB811] text-white font-semibold p-2 rounded-xl">
                                      Fri
                                    </p>
                                    <h3 className="bg-amber-400 h-[16px] w-[30px] rounded-bl-4xl"></h3>
                                    <h3 className="bg-[#adaac2] h-[16px] w-[30px] rounded-bl-4xl"></h3>
                                  </div>
                                  <div className="right">
                                    <p className="text-md text-black text-3xl">
                                      {index + 1}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-4 items-center justify-between ">
                                  <p className="text-md text-black font-semibold">
                                    Created at :
                                  </p>
                                  <p className="text-md text-gray-600 font-medium">
                                    {
                                      new Date(todo.createdAt)
                                        .toISOString()
                                        .split("T")[0]
                                    }
                                  </p>
                                </div>
                                <div className="flex gap-4 items-center justify-between ">
                                  <p className="text-md text-black font-semibold">
                                    Time at :
                                  </p>
                                  <p className="text-md text-gray-600 font-medium">
                                    {new Date(
                                      todo.createdAt
                                    ).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
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
                  className="bg-[#D5CCFF] p-5 border rounded-2xl flex flex-col w-full min-h-[220px]"
                >
                  <h3 className="text-3xl text-[#2B1887] font-semibold flex items-center gap-2">
                    <IoCheckmarkDoneSharp />
                    Done
                  </h3>

                  <div className="flex-1 space-y-2 mt-4">
                    {columns.done.length === 0 ? (
                      <h4 className="text-2xl text-black text-center pt-5 font-semibold">
                        No Todo Here
                      </h4>
                    ) : (
                      columns.done.map((todo, index) => (
                        <Draggable
                          key={todo._id}
                          draggableId={todo._id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`flex justify-between items-start bg-[#E5E2F5] hover:bg-[#ddd7fc] transition duration-200 p-3 rounded-lg shadow h-[276px] ${
                                snapshot.isDragging
                                  ? "opacity-95 scale-101"
                                  : ""
                              }`}
                            >
                              <div
                                onClick={() => openModalForEdit(todo)}
                                className="cursor-grabbing flex flex-col gap-7 pl-[10px]"
                              >
                                <div className="flex gap-1 items-center justify-between">
                                  <p className="text-xl text-black font-semibold">
                                    {todo.title}
                                  </p>
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
                                  <MdDeleteOutline
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteTodo(todo._id);
                                    }}
                                    className="text-2xl text-red-500 cursor-pointer hover:scale-110 duration-300"
                                  />
                                </div>

                                <p className="text-md text-gray-600 font-medium ">
                                  {todo.description || "No description"}
                                </p>

                                <div className="flex gap-4 items-center justify-between w-[492px]">
                                  <div className="left flex gap-4 items-center">
                                    <p className="bg-[#ECB811] text-white font-semibold p-2 rounded-xl">
                                      Fri
                                    </p>
                                    <h3 className="bg-[#2B1887] h-[16px] w-[30px] rounded-bl-4xl"></h3>
                                    <h3 className="bg-[#2B1887] h-[16px] w-[30px] rounded-bl-4xl"></h3>
                                  </div>
                                  <div className="right flex gap-2 items-center">
                                    <p className="text-md text-black text-3xl">
                                      {index + 1}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-4 items-center justify-between ">
                                  <p className="text-md text-black font-semibold">
                                    Created at :
                                  </p>
                                  <p className="text-md text-gray-600 font-medium">
                                    {
                                      new Date(todo.createdAt)
                                        .toISOString()
                                        .split("T")[0]
                                    }
                                  </p>
                                </div>
                                <div className="flex gap-4 items-center justify-between ">
                                  <p className="text-md text-black font-semibold">
                                    Time at :
                                  </p>
                                  <p className="text-md text-gray-600 font-medium">
                                    {new Date(
                                      todo.createdAt
                                    ).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
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
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="border px-3 py-2 rounded-lg w-full mb-4"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>

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
