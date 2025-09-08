"use client";
import { useEffect, useState } from "react";
import { CiBookmarkPlus } from "react-icons/ci";
import { IoCheckmarkDoneSharp } from "react-icons/io5";
import { MdDeleteOutline } from "react-icons/md";
import Navbar from "../components/Navbar";
import api from "../utils/api";
import toast from "react-hot-toast";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import ProtectedRoute from "../components/ProtectedRoute";


export default function TodoPage() {

  const [columns, setColumns] = useState({ todo: [], done: [] });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);


  const fetchTodos = async () => {
    try {
      const res = await api.get("/todo");
      const all = res.data || [];
      setColumns({
        todo: all.filter((t) => !t.completed),
        done: all.filter((t) => t.completed),
      });
    } catch (err) {
      toast.error("Failed to fetch todos ❌");
    }
  };

  const saveTodo = async () => {
    if (!title.trim()) return toast.error("Title required!");
    setLoading(true);
    try {
      if (editingTodo) {
        const res = await api.put(`/todo/${editingTodo._id}`, {
          title,
          description,
          completed: editingTodo.completed,
        });
        const updated = res.data;
        setColumns((prev) => {
          const from = updated.completed ? "done" : "todo";
          return {
            todo:
              from === "todo"
                ? prev.todo.map((t) => (t._id === updated._id ? updated : t))
                : prev.todo
                    .filter((t) => t._id !== updated._id)
                    .concat(
                      updated.completed ? [] : [updated]
                    ),
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
        const res = await api.post("/todo", { title, description });
        const created = res.data;
        setColumns((prev) => ({ ...prev, todo: [...prev.todo, created] }));
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
      const res = await api.put(`/todo/${todo._id}`, {
        completed: !todo.completed,
        title: todo.title,
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
      await api.delete(`/todo/${id}`);
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
    setIsModalOpen(true);
  };



  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const srcColId = source.droppableId;
    const dstColId = destination.droppableId;


    if (srcColId === dstColId) {
      setColumns((prev) => {
        const list = Array.from(prev[srcColId]);
        const [moved] = list.splice(source.index, 1);
        list.splice(destination.index, 0, moved);
        return { ...prev, [srcColId]: list };
      });
      return;
    }


    setColumns((prev) => {
      const sourceList = Array.from(prev[srcColId]);
      const destList = Array.from(prev[dstColId]);

      const idx = sourceList.findIndex((i) => i._id === draggableId);
      if (idx === -1) return prev;
      const [moved] = sourceList.splice(idx, 1);
      const movedUpdated = { ...moved, completed: dstColId === "done" };

      destList.splice(destination.index, 0, movedUpdated);

      return {
        ...prev,
        [srcColId]: sourceList,
        [dstColId]: destList,
      };
    });

    
    if (srcColId === "todo" && dstColId === "done") {
      toast.success("✅ Todo moved to completed");
    }
    if (srcColId === "done" && dstColId === "todo") {
      toast("✅Todo moved to pending");
    }


    try {
      const todoItem =
        columns[srcColId].find((t) => t._id === draggableId) || {};

      await api.put(`/todo/${draggableId}`, {
        completed: dstColId === "done",
        title: todoItem.title || "",
        description: todoItem.description || "",
      });
    } catch (err) {
      toast.error("❌ Failed to save move to server");
      fetchTodos(); 
    }
  };

  useEffect(() => {
    fetchTodos();
    
  }, []);

  return (
    <>
    <ProtectedRoute/>
      <Navbar />
      <div className="h-full w-full bg-[#2B1887]">
        <h1 className="text-white text-center text-6xl p-10">Todo Kanban</h1>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-2 gap-4 bg-[#2B1887] h-[calc(100vh-10rem)] pl-20">
            {/* Left Column - To-do */}
            <Droppable droppableId="todo">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="bg-[#D5CCFF] p-5 border rounded-2xl flex flex-col w-[33rem]"
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
                      className="bg-[white] text-[#2B1887] px-3 py-2 rounded-md  hover:scale-105 duration-300"
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
                              className={`flex justify-between items-start bg-[#E5E2F5] hover:bg-[#ddd7fc] transition duration-200 p-3 rounded-lg shadow h-[180px] ${
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

                                <div className="flex gap-4 items-center justify-between w-[448px]">
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
                  className="bg-[#D5CCFF] p-5 border rounded-2xl flex flex-col w-[33rem]"
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
                              className={`flex justify-between items-start bg-[#E5E2F5] hover:bg-[#ddd7fc] transition duration-200 p-3 rounded-lg shadow h-[180px] ${
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

                                <div className="flex gap-4 items-center justify-between w-[448px]">
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
      <ProtectedRoute/>
    </>
  );
}
