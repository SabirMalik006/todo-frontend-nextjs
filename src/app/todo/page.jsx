"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { MdDeleteOutline } from "react-icons/md";
import Navbar from "../components/Navbar";
import api from "../utils/api";
import toast from "react-hot-toast";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import AuthRoute from "../components/AuthRoute";
import { TbDotsVertical } from "react-icons/tb";
import { LiaEdit } from "react-icons/lia";

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
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [isSavingColumn, setIsSavingColumn] = useState(false);

  const openViewModal = (todo) => {
    setSelectedTodo(todo);
    setIsViewModalOpen(true);
  };

  // Board reference for scrolling and drag operations
  const boardRef = useRef(null);
  const boardContainerRef = useRef(null);
  
  // Refs for board scrolling
  const isManualScrolling = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  
  // Ref for auto-scrolling during drag
  const autoScrollAnimationRef = useRef(null);
  
  // Handle manual board scrolling (when not dragging items)
  const handleBoardMouseDown = (e) => {
    // Don't scroll if we're clicking on columns, todos, or interactive elements
    if (isDragging) return;
    if (!boardContainerRef.current) return;
    
    // Check if the click is on a column, todo, or interactive element
    const interactiveElements = e.target.closest('.column, .todo-item, button, a, input, select, textarea');
    if (interactiveElements) return;
    
    isManualScrolling.current = true;
    startX.current = e.pageX;
    scrollLeft.current = boardRef.current.scrollLeft;
    
    // Change cursor to indicate grabbing
    if (boardContainerRef.current) {
      boardContainerRef.current.style.cursor = 'grabbing';
    }
  };
  
  // Clean up all scrolling animations and intervals
  const cleanupScrolling = () => {
    if (autoScrollAnimationRef.current) {
      cancelAnimationFrame(autoScrollAnimationRef.current);
      autoScrollAnimationRef.current = null;
    }
  };
  
  // Set up event listeners for manual board scrolling
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isManualScrolling.current || !boardRef.current) return;
      
      const dx = e.pageX - startX.current;
      boardRef.current.scrollLeft = scrollLeft.current - dx;
      e.preventDefault();
    };
    
    const handleMouseUp = () => {
      isManualScrolling.current = false;
      if (boardContainerRef.current) {
        boardContainerRef.current.style.cursor = '';
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      cleanupScrolling();
    };
  }, []);
  
  // Auto-scrolling only at screen edges, not column edges
  useEffect(() => {
    if (!isDragging) {
      cleanupScrolling();
      return;
    }
    
    // Track if we're currently auto-scrolling
    let isAutoScrolling = false;
    
    const handleDragScroll = (e) => {
      if (!boardRef.current) return;
      
      // Only check window edges, not board or column edges
      const windowWidth = window.innerWidth;
      const edgeSize = 50; // Large edge size for better detection at window edges
      
      // Check if we should auto-scroll based on window edges
      const shouldScrollLeft = e.clientX < edgeSize;
      const shouldScrollRight = e.clientX > windowWidth - edgeSize;
      
      // If we're not near a window edge, stop any existing auto-scroll
      if (!shouldScrollLeft && !shouldScrollRight) {
        if (autoScrollAnimationRef.current) {
          cancelAnimationFrame(autoScrollAnimationRef.current);
          autoScrollAnimationRef.current = null;
          isAutoScrolling = false;
        }
        return;
      }
      
      // Don't start a new animation if we're already scrolling
      if (isAutoScrolling) return;
      
      // Function to perform the actual scrolling with requestAnimationFrame
      const performScroll = () => {
        if (!isDragging || !boardRef.current) {
          isAutoScrolling = false;
          return;
        }
        
        const board = boardRef.current;
        // Larger scroll amount for faster scrolling at window edges
        const scrollAmount = 10;
        
        if (shouldScrollLeft) {
          board.scrollLeft = Math.max(0, board.scrollLeft - scrollAmount);
          isAutoScrolling = true;
        } else if (shouldScrollRight) {
          board.scrollLeft += scrollAmount;
          isAutoScrolling = true;
        } else {
          isAutoScrolling = false;
          return;
        }
        
        // Continue animation only if still dragging
        if (isDragging) {
          autoScrollAnimationRef.current = requestAnimationFrame(performScroll);
        } else {
          isAutoScrolling = false;
        }
      };
      
      // Start the animation
      if (!autoScrollAnimationRef.current) {
        autoScrollAnimationRef.current = requestAnimationFrame(performScroll);
      }
    };
    
    window.addEventListener('mousemove', handleDragScroll);
    
    return () => {
      window.removeEventListener('mousemove', handleDragScroll);
      cleanupScrolling();
    };
  }, [isDragging]);

  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [activeColumnForNewTodo, setActiveColumnForNewTodo] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("accessToken");
    return { headers: { Authorization: `Bearer ${token}` } };
  }, []);

  const fetchTodos = useCallback(async () => {
    try {
      const headers = getAuthHeaders();

      const [colRes, todoRes] = await Promise.all([
        api.get("/column", headers),
        api.get("/todo", headers),
      ]);

      const cols = colRes.data || [];
      const todos = todoRes.data || [];

      let withTodos = cols.map((col) => ({
        ...col,
        todos:
          todos
            .filter((t) => String(t.column) === String(col._id))
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) || [],
      }));

      const allTodos = withTodos.flatMap((c) => c.todos || []);
      if (allTodos.length === 0 && withTodos.length >= 3) {
        withTodos[0].todos.push({
          _id: "dummy-1",
          title: "Welcome!",
          description:
            "This is your first todo. Edit or delete it to get started.",
          priority: "medium",
          column: withTodos[0]._id,
          order: 1,
          isDummy: true,
        });
      }

      const savedDummy = JSON.parse(localStorage.getItem("dummyOrder"));
      if (savedDummy && savedDummy._id && withTodos.length > 0) {
        withTodos = withTodos.map((col) => {
          if (String(col._id) === String(savedDummy.column)) {
            const dummyIndex = col.todos.findIndex((t) => t.isDummy);
            if (dummyIndex !== -1) {
              const [dummy] = col.todos.splice(dummyIndex, 1);

              const insertAt = Math.max(
                0,
                Math.min(savedDummy.order - 1, col.todos.length)
              );
              col.todos.splice(insertAt, 0, dummy);
            }
          }
          return col;
        });
      }

      setColumns(withTodos);
    } catch (err) {
      console.error("fetchTodos error:", err.response?.data || err.message);
      toast.error("Failed to fetch data");
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

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
        if (editingTodo.isDummy) {
          setColumns((prev) =>
            prev.map((col) => ({
              ...col,
              todos: col.todos.map((t) =>
                t._id === editingTodo._id
                  ? { ...t, title, description, priority }
                  : t
              ),
            }))
          );
          toast.success("Dummy todo updated ✏️");
          setTitle("");
          setDescription("");
          setPriority("low");
          setEditingTodo(null);
          setActiveColumnForNewTodo(null);
          setIsModalOpen(false);
          setLoading(false);
          return;
        }

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

        const res = await api.post("/todo", payload, headers);
        const created = res.data;

        setColumns((prev) =>
          prev.map((col) =>
            String(col._id) === String(created.column)
              ? { ...col, todos: [...col.todos, created] }
              : col
          )
        );

        toast.success("Todo added ");
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

  const deleteTodo = async (id, isDummy = false) => {
    if (isDummy) {
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          todos: col.todos.filter((t) => t._id !== id),
        }))
      );

      const saved = JSON.parse(localStorage.getItem("dummyOrder"));
      if (saved && saved._id === id) localStorage.removeItem("dummyOrder");

      toast.success("Dummy todo removed 🗑️");
      return;
    }

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
      toast.error("Failed to delete ");
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
      toast.error(err.response?.data?.message || "Failed to delete column ");
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
    if (!renameColumnName.trim())
      return toast.error("Column name cannot be empty ");

    try {
      const res = await api.put(`/column/${columnToRename._id}`, {
        name: renameColumnName.trim(),
      });

      if (res.status === 200) {
        toast.success("Column renamed ");
        setIsRenameModalOpen(false);
        setRenameColumnName("");
        fetchTodos();
      } else {
        toast.error("Failed to rename column ");
      }
    } catch (err) {
      toast.error("Failed to rename column ");
      console.error("renameColumn error:", err.response?.data || err.message);
    }
  };

  const onDragUpdate = useCallback((update) => {
    // Auto-scrolling is now handled by the useEffect with requestAnimationFrame
    // This function is kept for compatibility with react-beautiful-dnd
    // but we don't need to implement manual scrolling here anymore
  }, []);

  const onDragEnd = async (result) => {
    setIsDragging(false);
    
    // Clean up any auto-scrolling animations
    if (autoScrollAnimationRef.current) {
      cancelAnimationFrame(autoScrollAnimationRef.current);
      autoScrollAnimationRef.current = null;
    }
    
    // Reset board background color
    if (boardRef.current) {
      boardRef.current.style.backgroundColor = "";
    }

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

    toast.success(`${moved.title} moved to ${destCol.name}`, {
      autoClose: 2000,
    });

    if (moved.isDummy) {
      const dummyPayload = {
        _id: moved._id,
        column: moved.column,
        order: moved.order,
      };
      localStorage.setItem("dummyOrder", JSON.stringify(dummyPayload));
      return;
    }

    try {
      const headers = getAuthHeaders();

      await api.put(`/todo/${draggableId}`, { column: moved.column }, headers);

      const orderData = newColumns.flatMap((col) =>
        (col.todos || [])
          .filter((t) => !t.isDummy)
          .map((t) => ({
            id: t._id,
            order: t.order ?? 0,
            column: col._id,
          }))
      );

      if (orderData.length > 0) {
        await api.put("/todo/update-order", { orderData }, headers);
      }
    } catch (err) {
      console.error("onDragEnd error:", err.response?.data || err.message);
      toast.error("❌ Failed to save changes, refreshing...");
      fetchTodos();
    }
  };

  const saveColumn = async () => {
    if (isSavingColumn) return;
    if (!newColumnName.trim()) return toast.error("Column name required!");

    setIsSavingColumn(true);

    try {
      const headers = getAuthHeaders();

      const colRes = await api.post(
        "/column",
        { name: newColumnName },
        headers
      );
      let createdCol = colRes.data;

      if (columns.length === 0) {
        const dummyPayload = {
          title: "My first task 🚀",
          description: "This is a sample todo. You can edit or delete it.",
          priority: "medium",
          day: "Today",
          column: createdCol._id,
        };

        try {
          await api.post("/todo", dummyPayload, headers);
        } catch (err) {
          console.error(
            "Failed to create dummy todo:",
            err.response?.data || err.message
          );
        }
      }

      await fetchTodos();

      setNewColumnName("");
      setIsColumnModalOpen(false);
      toast.success("Column created ✅");
    } catch (err) {
      console.error("saveColumn error:", err.response?.data || err.message);
      toast.error("Failed to create column ❌");
    } finally {
      setIsSavingColumn(false);
    }
  };

  return (
    <>
      <AuthRoute />
      <Navbar />
      <div className="h-full w-full bg-white todo pt-15 ">
        <div className="flex justify-end px-10 mb-4">
          <button
            onClick={() => setIsColumnModalOpen(true)}
            className="bg-[#2B1887] text-white px-4 py-2 rounded-lg hover:bg-[#4321a8] duration-300 cursor-pointer"
          >
            + Add Column
          </button>
        </div>

        <DragDropContext
          onDragStart={(start) => {
            setIsDragging(true);
            // Add a subtle transition effect to the board
            if (boardRef.current) {
              boardRef.current.style.backgroundColor = "#f9f9ff";
            }
          }}
          onDragUpdate={onDragUpdate}
          onDragEnd={onDragEnd}
        >
          <div
            ref={boardContainerRef}
            onMouseDown={handleBoardMouseDown}
            className="w-full h-[calc(100vh-50px)] select-none cursor-grab active:cursor-grabbing"
          >
            <div
              ref={boardRef}
              className="flex gap-6 bg-white px-6 lg:px-10 py-4 items-start overflow-x-auto h-full"
            >
              {columns.map((col) => (
                <Droppable key={col._id} droppableId={String(col._id)}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="column bg-[#D5CCFF] py-5 px-3 border rounded-2xl flex flex-col min-w-[408px] max-w-[820px] w-full min-h-[200px] max-h-[calc(100vh-160px)] overflow-y-auto"
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

                      <div className="flex flex-col gap-3">
                        {col.todos && col.todos.length > 0 ? (
                          col.todos.map((todo, index) => (
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
                                  style={{
                                    ...provided.draggableProps.style,
                                    zIndex: snapshot.isDragging ? 9999 : "auto",
                                    opacity: snapshot.isDragging ? 0.9 : 1,
                                    boxShadow: snapshot.isDragging ? "0 5px 10px rgba(0,0,0,0.2)" : "none",
                                    transform: snapshot.isDragging ? `${provided.draggableProps.style.transform}` : "none",
                                    pointerEvents: "auto"
                                  }}
                                  className={`todo-item relative bg-[#e9e8ee] p-5 rounded-lg shadow break-words ${
                                    snapshot.isDragging 
                                  }`}
                                >
                                  {/* Todo Number */}
                                  <p className="absolute top-0 left-0 bg-black text-white text-xs sm:text-sm font-bold px-[6px] flex items-center justify-center shadow rounded-br-2xl">
                                    {index + 1}
                                  </p>

                                  {/* Todo Title & Delete */}
                                  <div
                                    onClick={() => openViewModal(todo)}
                                    className="mb-3 cursor-pointer"
                                  >
                                    <div className="relative pr-6">
                                      <p className="text-base sm:text-lg font-semibold text-black break-words line-clamp-2">
                                        {todo.title}
                                      </p>
                                      <MdDeleteOutline
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteTodo(todo._id, todo.isDummy);
                                        }}
                                        className="absolute top-0 right-0 text-red-500 cursor-pointer hover:scale-110 duration-300 w-5 h-5"
                                      />
                                    </div>
                                    <p className="text-gray-600 text-xs sm:text-sm break-words line-clamp-2">
                                      {todo.description}
                                    </p>
                                  </div>

                                  {/* Todo Footer */}
                                  <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3 w-full justify-between">
                                      <div className="flex gap-1 items-center">
                                        <p className="bg-[#ECB811] text-white text-xs sm:text-sm font-semibold px-5 py-2 rounded">
                                          {todo.day || "Thu"}
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
                          ))
                        ) : (
                          <p className="text-gray-500 text-center mt-5  text-3xl">
                            No todos Here
                          </p>
                        )}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </div>
        </DragDropContext>
      </div>

      {/* Todo Modal */}
      {isModalOpen && (
        <div
          onClick={() => {
            setIsModalOpen(false);
            setEditingTodo(null);
            setTitle("");
            setDescription("");
            setActiveColumnForNewTodo(null);
          }}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center text-black z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-6 rounded-2xl shadow-lg w-[400px]"
          >
            <h2 className="text-2xl font-bold text-[#2B1887] mb-4 text-center">
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

      {isViewModalOpen && selectedTodo && (
        <div
          onClick={() => {
            setIsViewModalOpen(false);
            setSelectedTodo(null);
          }}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center text-black z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-6 rounded-2xl shadow-lg w-[400px] relative"
          >
            <button
              onClick={() => {
                setIsViewModalOpen(false);
                openModalForEdit(selectedTodo);
              }}
              className="absolute top-7 right-6 text-[#2B1887] cursor-pointer duration-200 text-sm"
              title="Edit Todo"
            >
              <LiaEdit className="text-2xl" />
            </button>

            <h2 className="text-2xl font-bold text-[#2B1887] mb-6 text-center">
              Todo Details
            </h2>

            <div className="space-y-5 text-gray-700 text-base">
              <div className="rounded-lg p-3 bg-[#eae6f7]">
                <span className="font-semibold text-[#2B1887] text-lg block mb-1 ">
                  Title :
                </span>
                <p className="text-lg break-words whitespace-pre-wrap max-w-full">
                  {selectedTodo.title}
                </p>
              </div>

              <div className="rounded-lg p-3 flex items-center bg-[#eae6f7]">
                <span className="font-semibold text-[#2B1887] text-lg block mb-1">
                  Priority : &nbsp;
                </span>
                <p
                  className={`inline-block px-5 py-1 rounded-md text-white text-md ${
                    selectedTodo.priority === "high"
                      ? "bg-red-500"
                      : selectedTodo.priority === "medium"
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                >
                  {selectedTodo.priority}
                </p>
              </div>

              <div className="rounded-lg p-3 max-h-[400px] overflow-y-auto bg-[#eae6f7]">
                <span className="font-semibold text-[#2B1887] text-lg block mb-1">
                  Description : &nbsp;
                </span>
                <p className="text-lg break-words whitespace-pre-wrap max-w-full">
                  {selectedTodo.description || "No description"}
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedTodo(null);
                }}
                className="bg-gray-400 text-white px-4 py-2 rounded-lg cursor-pointer hover:scale-105 duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isColumnModalOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center text-black z-50"
          onClick={() => {
            setIsColumnModalOpen(false);
            setNewColumnName("");
          }}
        >
          <div
            className="bg-white p-6 rounded-2xl shadow-lg w-[400px]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-[#2B1887] mb-4">
              Add New Column
            </h2>

            <label className="block text-gray-700 mb-1">Column Name</label>
            <input
              type="text"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              placeholder="Enter column name"
              className="border px-3 py-2 rounded-lg w-full mb-4"
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
                disabled={isSavingColumn}
                className={`px-4 py-2 rounded-lg cursor-pointer transition ${
                  isSavingColumn
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-[#2B1887] text-white hover:scale-105 duration-300"
                }`}
              >
                {isSavingColumn ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isRenameModalOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center text-black z-50"
          onClick={() => {
            setIsRenameModalOpen(false);
            setRenameColumnName("");
          }}
        >
          <div
            className="bg-white p-6 rounded-2xl shadow-lg w-[400px]"
            onClick={(e) => e.stopPropagation()}
          >
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
                onClick={handleRenameColumn}
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