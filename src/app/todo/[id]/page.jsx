"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { MdDeleteOutline } from "react-icons/md";
import Navbar from "../../components/Navbar";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import AuthRoute from "../../components/AuthRoute";
import { TbDotsVertical } from "react-icons/tb";
import { LiaEdit } from "react-icons/lia";
import { useParams } from "next/navigation";
import { BiCommentDetail } from "react-icons/bi";
import Teamsidebar from "../../components/TeamSideBar";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";

export default function TodoPage() {
  const { id: boardId } = useParams();
  const [columns, setColumns] = useState([]);
  const [board, setBoard] = useState(null);
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
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [activeCommentMenu, setActiveCommentMenu] = useState(null);

  useEffect(() => {
    const handleClickOutside = () => {
      setActiveCommentMenu(null);
    };

    if (activeCommentMenu) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activeCommentMenu]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      const decoded = jwtDecode(token);
      setCurrentUserId(decoded.id);
    }
  }, []);

  const openViewModal = (todo) => {
    setSelectedTodo(todo);
    setIsViewModalOpen(true);
  };

  const boardRef = useRef(null);
  const boardContainerRef = useRef(null);

  const isManualScrolling = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const cleanupScrolling = () => { };

  const handleBoardMouseDown = (e) => {
    if (isDragging) return;
    if (!boardContainerRef.current) return;

    const interactiveElements = e.target.closest(
      ".column, .todo-item, button, a, input, select, textarea"
    );
    if (interactiveElements) return;

    isManualScrolling.current = true;
    startX.current = e.pageX;
    scrollLeft.current = boardRef.current.scrollLeft;

    if (boardContainerRef.current) {
      boardContainerRef.current.style.cursor = "grabbing";
    }
  };

  const updateTodoInColumns = (updatedTodo) => {
    setColumns(prevColumns =>
      prevColumns.map(column => ({
        ...column,
        todos: column.todos?.map(todo =>
          todo._id === updatedTodo._id ? updatedTodo : todo
        ) || []
      }))
    );
  };

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
        boardContainerRef.current.style.cursor = "";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      cleanupScrolling();
    };
  }, []);

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
      if (!boardId) return;

      const headers = getAuthHeaders();
      const [colRes, todoRes] = await Promise.all([
        api.get(`/column/board/${boardId}`, headers),
        api.get(`/todo/board/${boardId}`, headers),
      ]);

      const cols = colRes.data || [];
      const todos = todoRes.data || [];

      let withTodos = cols.map((col) => ({
        ...col,
        todos:
          todos
            .filter((t) => {
              if (!t.column) return false; // ✅ Skip todos with null column
              const todoColId =
                typeof t.column === "object" ? t.column._id : t.column;
              return String(todoColId) === String(col._id);
            })
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) || [],
      }));

      const hasDummyCreated = localStorage.getItem(`dummy_created_${boardId}`);

      if (!hasDummyCreated && withTodos.length >= 3) {
        const defaultTodo = {
          title: "Welcome!",
          description: "This is your first todo. Edit or delete it to get started.",
          priority: "medium",
          column: withTodos[0]._id,
          order: 1,
          board: boardId,
        };

        try {
          const res = await api.post("/todo", defaultTodo, headers);
          withTodos[0].todos.push(res.data);
          localStorage.setItem(`dummy_created_${boardId}`, "true");
        } catch (err) {
          console.error("Failed to create default todo:", err);
        }
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
    }
  }, [getAuthHeaders, boardId]);


  useEffect(() => {
    setColumns([]);
    fetchTodos();
  }, [fetchTodos, boardId]);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!boardId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const headers = getAuthHeaders();

        const [bRes, cRes] = await Promise.all([
          api.get(`/board/${boardId}`, headers),
          api.get(`/column/board/${boardId}`, headers),
        ]);

        setBoard(bRes.data);
        setColumns(cRes.data);

        await fetchTodos();
      } catch (err) {
        console.error(
          "Error loading board:",
          err.response?.data || err.message
        );
        toast.error(err.response?.data?.message || "Error loading board");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [boardId, getAuthHeaders, fetchTodos]);

  useEffect(() => {
    if (!boardId) return;

    const intervalId = setInterval(() => {
      fetchTodos();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [boardId, fetchTodos]);

  useEffect(() => {
    if (!boardId) return;

    const fetchBoardData = async () => {
      try {
        const headers = getAuthHeaders();
        const bRes = await api.get(`/board/${boardId}`, headers);
        setBoard(bRes.data);
      } catch (err) {
        console.error("Error refreshing board:", err);
      }
    };

    const boardIntervalId = setInterval(fetchBoardData, 5000);
    return () => clearInterval(boardIntervalId);
  }, [boardId, getAuthHeaders]);

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

  useEffect(() => {
    if (selectedTodo?._id) {
      fetchComments();
    }
  }, [selectedTodo]);

  const fetchComments = async () => {
    try {
      const res = await api.get(`/todos/${selectedTodo._id}/comments`);
      console.log("Selected Todo ID:", selectedTodo?._id);
      setComments(res.data);
    } catch (err) {
      console.error("Fetch comments failed:", err);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await api.post(`/todos/${selectedTodo._id}/comments`, {
        text: newComment,
      });
      setComments((prev) => [res.data, ...prev]);

      const updatedTodo = {
        ...selectedTodo,
        comments: [res.data, ...(selectedTodo.comments || [])]
      };

      setSelectedTodo(updatedTodo);
      updateTodoInColumns(updatedTodo);

      setNewComment("");
    } catch (err) {
      console.error("Add comment failed:", err);
    }
  };

  const handleUpdateComment = async (commentId) => {
    try {
      const res = await api.put(`/todos/${selectedTodo._id}/comments/${commentId}`, {
        text: editingComment.text,
      });
      setComments(prev => prev.map(c => c._id === commentId ? res.data : c));

      const updatedTodo = {
        ...selectedTodo,
        comments: selectedTodo.comments.map(c => c._id === commentId ? res.data : c)
      };

      setSelectedTodo(updatedTodo);
      updateTodoInColumns(updatedTodo);

      setEditingComment(null);
    } catch (err) {
      console.error("Update comment failed:", err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/todos/${selectedTodo._id}/comments/${commentId}`);
      setComments(prev => prev.filter(c => c._id !== commentId));

      const updatedTodo = {
        ...selectedTodo,
        comments: selectedTodo.comments.filter(c => c._id !== commentId)
      };

      setSelectedTodo(updatedTodo);
      updateTodoInColumns(updatedTodo);

      setActiveCommentMenu(null);
    } catch (err) {
      console.error("Delete comment failed:", err);
    }
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
          board: boardId,
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
          board: boardId,
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
    if (!colId) return toast.error("Invalid column ID");

    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the column and its todos.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!confirm.isConfirmed) return;

    try {
      const headers = getAuthHeaders();
      await api.delete(`/column/${colId}`, headers);
      setColumns(prev => prev.filter(col => String(col._id) !== String(colId)));
      toast.success("Column deleted 🗑️");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete column");
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
    if (boardRef.current && update) {
      const columnElements = boardRef.current.querySelectorAll(".column");
      columnElements.forEach((el) => {
        el.style.boxShadow = "";
        el.style.opacity = "1";
        el.style.border = "1px solid #D5CCFF";
      });

      const mouseX = update.clientX || 0;
      const mouseY = update.clientY || 0;

      let columnUnderMouse = null;

      columnElements.forEach((column) => {
        const rect = column.getBoundingClientRect();

        if (
          mouseX >= rect.left &&
          mouseX <= rect.right &&
          mouseY >= rect.top &&
          mouseY <= rect.bottom
        ) {
          columnUnderMouse = column;
        }
      });

      if (columnUnderMouse) {
        columnUnderMouse.style.border = "2px solid #6E41E2";

        if (update.destination) {
          const columnId = columnUnderMouse.getAttribute("data-column-id");
          if (columnId && update.destination.droppableId !== columnId) {
            update.destination.droppableId = columnId;
          }
        }
      }
    }
    const onDragEnd = async (result) => {
      setIsDragging(false);
      cleanupScrolling();

      if (boardRef.current) {
        boardRef.current.style.backgroundColor = "transparent";
      }

      const { source, destination, draggableId, type } = result;
      if (!destination) return;

      if (type === "COLUMN") {
        if (source.index === destination.index) return;
        const newColumns = [...columns];
        const [movedCol] = newColumns.splice(source.index, 1);
        newColumns.splice(destination.index, 0, movedCol);
        setColumns(newColumns);

        try {
          const headers = getAuthHeaders();
          await api.put(
            "/column/update-order",
            {
              columnId: movedCol._id,
              newIndex: destination.index,
            },
            headers
          );
          toast.success(`Column moved to position ${destination.index + 1}`, {
            duration: 2000,
          });
        } catch (err) {
          console.error(
            "Column reorder error:",
            err.response?.data || err.message
          );
          toast.error("Failed to reorder columns, refreshing...");
          fetchColumns();
        }
        return;
      }

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
      const destCol = newColumns.find(
        (c) => String(c._id) === String(dstColId)
      );
      if (!sourceCol || !destCol) return;

      const [moved] = sourceCol.todos.splice(source.index, 1);
      moved.column = dstColId;
      destCol.todos.splice(destination.index, 0, moved);

      sourceCol.todos.forEach((t, i) => (t.order = i + 1));
      destCol.todos.forEach((t, i) => (t.order = i + 1));

      setColumns(newColumns);

      if (boardRef.current) {
        const columnElements = boardRef.current.querySelectorAll(".column");
        const destColumnElement = Array.from(columnElements).find(
          (el) => el.getAttribute("data-column-id") === dstColId
        );
        if (destColumnElement) {
          destColumnElement.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        }
      }

      toast.success(`${moved.title} moved to ${destCol.name}`, {
        duration: 2000,
      });

      if (moved.isDummy) {
        const dummyPayload = {
          _id: moved._id,
          column: moved.column,
          order: moved.order,
          board: boardId,
        };
        localStorage.setItem("dummyOrder", JSON.stringify(dummyPayload));
        return;
      }

      try {
        const headers = getAuthHeaders();
        await api.put(
          `/todo/${draggableId}`,
          { column: moved.column },
          headers
        );

        const orderData = newColumns.flatMap((col) =>
          (col.todos || [])
            .filter((t) => !t.isDummy)
            .map((t) => ({
              id: t._id,
              order: t.order ?? 0,
              column: col._id,
              board: boardId,
            }))
        );

        if (orderData.length > 0) {
          await api.put("/todo/update-order", { orderData }, headers);
        }
      } catch (err) {
        console.error("onDragEnd error:", err.response?.data || err.message);
        toast.error("Failed to save changes, refreshing...");
        fetchTodos();
      }
    };
  }, []);

  const onDragEnd = async (result) => {
    setIsDragging(false);
    cleanupScrolling();

    if (boardRef.current) {
      boardRef.current.style.backgroundColor = "transparent";
    }

    const { source, destination, draggableId, type } = result;
    if (!destination) return;

    const newColumns = columns.map((c) => ({
      ...c,
      todos: [...(c.todos || [])],
    }));

    const headers = getAuthHeaders();

    if (type === "COLUMN") {
      const [movedColumn] = newColumns.splice(source.index, 1);
      newColumns.splice(destination.index, 0, movedColumn);
      newColumns.forEach((c, i) => (c.order = i + 1));
      setColumns(newColumns);

      try {
        const columnOrderData = newColumns.map((c) => ({
          id: c._id,
          order: c.order,
          board: boardId,
        }));
        if (columnOrderData.length > 0) {
          await api.put(
            "/column/update-order",
            { orderData: columnOrderData },
            headers
          );
        }
      } catch (err) {
        console.error(
          "Column drag error:",
          err?.response?.data || err?.message || err
        );
        toast.error("Failed to save column order, refreshing...");
        fetchTodos();
      }
      return;
    }

    const srcColId = source.droppableId;
    const dstColId = destination.droppableId;
    if (srcColId === dstColId && source.index === destination.index) return;

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

    if (boardRef.current) {
      const columnElements = boardRef.current.querySelectorAll(".column");
      const destColumnElement = Array.from(columnElements).find(
        (el) => el.getAttribute("data-column-id") === dstColId
      );

      if (destColumnElement) {
        destColumnElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }

    toast.success(`${moved.title} moved to ${destCol.name}`, {
      duration: 2000,
    });

    if (moved.isDummy) {
      const dummyPayload = {
        _id: moved._id,
        column: moved.column,
        order: moved.order,
        board: boardId,
      };
      localStorage.setItem("dummyOrder", JSON.stringify(dummyPayload));
      return;
    }

    try {
      await api.put(`/todo/${draggableId}`, { column: moved.column }, headers);

      const orderData = newColumns.flatMap((col) =>
        (col.todos || [])
          .filter((t) => !t.isDummy)
          .map((t) => ({
            id: t._id,
            order: t.order ?? 0,
            column: col._id,
            board: boardId,
          }))
      );

      if (orderData.length > 0) {
        await api.put("/todo/update-order", { orderData }, headers);
      }
    } catch (err) {
      console.error("onDragEnd error:", err.response?.data || err.message);
      toast.error("Failed to save changes, refreshing...");
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
        { name: newColumnName, boardId: boardId },
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
          board: boardId,
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
      toast.success("Column created ");
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
      <Teamsidebar boardId={boardId} board={board} />
      <div className="h-full w-full bg-[oklch(96.7%_0.003_264.542)] todo pt-25 mt-10">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2B1887]"></div>
          </div>
        ) : (
          <>
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
                if (boardRef.current) {
                  boardRef.current.style.backgroundColor = "";

                  const columnElements = boardRef.current.querySelectorAll(".column");
                  columnElements.forEach((el) => {
                    el.style.boxShadow = "";
                    el.style.opacity = "1";
                    el.style.border = "1px solid #D5CCFF";
                  });
                }
              }}
              onDragUpdate={onDragUpdate}
              onDragEnd={onDragEnd}
            >
              <Droppable
                droppableId="board-scroll"
                direction="horizontal"
                type="COLUMN"
              >
                {(boardProvided) => (
                  <div
                    ref={(node) => {
                      boardRef.current = node;
                      boardProvided.innerRef(node);
                    }}
                    {...boardProvided.droppableProps}
                    className="flex gap-6 bg-[oklch(96.7%_0.003_264.542)] px-6 lg:px-10 py-4 items-start overflow-x-auto h-full cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => {
                      const container = e.currentTarget;
                      container.isDown = true;
                      container.startX = e.pageX - container.offsetLeft;
                      container.scrollLeftStart = container.scrollLeft;
                    }}
                    onMouseLeave={(e) => {
                      const container = e.currentTarget;
                      container.isDown = false;
                    }}
                    onMouseUp={(e) => {
                      const container = e.currentTarget;
                      container.isDown = false;
                    }}
                    onMouseMove={(e) => {
                      const container = e.currentTarget;
                      if (!container.isDown) return;
                      e.preventDefault();
                      const x = e.pageX - container.offsetLeft;
                      const walk = (x - container.startX) * 1;
                      container.scrollLeft = container.scrollLeftStart - walk;
                    }}
                  >
                    {columns.map((col, colIndex) => (
                      <Draggable
                        key={col._id}
                        draggableId={String(col._id)}
                        index={colIndex}
                      >
                        {(providedCol) => (
                          <div
                            ref={providedCol.innerRef}
                            {...providedCol.draggableProps}
                            {...providedCol.dragHandleProps}
                            className="column bg-white py-5 px-4 rounded-lg flex flex-col min-w-[320px] max-w-[820px] w-full min-h-[180px] max-h-[calc(100vh-160px)] overflow-y-auto border border-gray-200 shadow-sm"
                            data-column-id={String(col._id)}
                          >
                            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white py-2 z-10 border-b border-gray-200">
                              <h3
                                className={`font-semibold text-[#2B1887] flex items-center gap-2 max-w-full overflow-hidden ${columns.length > 6
                                  ? "text-sm sm:text-base"
                                  : columns.length > 4
                                    ? "text-lg sm:text-xl"
                                    : "text-xl sm:text-2xl"
                                  }`}
                              >
                                <span className="truncate block max-w-[180px] sm:max-w-[200px] md:max-w-[250px]">
                                  {col.name}
                                </span>
                                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full shrink-0">
                                  {col.todos?.length || 0}
                                </span>
                              </h3>

                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenu(
                                      activeMenu === col._id ? null : col._id
                                    );
                                  }}
                                  className="p-2 rounded-full duration-300 hover:bg-purple-100"
                                >
                                  <TbDotsVertical className="w-5 h-5 text-[#2B1887] cursor-pointer" />
                                </button>

                                {activeMenu === col._id && (
                                  <div className="absolute right-7 top-6 w-40 bg-white rounded-lg shadow-lg z-20">
                                    <ul className="flex flex-col text-sm rounded-lg overflow-hidden shadow-md border border-gray-200 bg-white">
                                      <li
                                        className="px-4 cursor-pointer py-2 text-gray-700 hover:bg-green-100 hover:text-green-700 cursor-pointer flex items-center gap-2"
                                        onClick={() => {
                                          setActiveMenu(null);
                                          openAddTodoForColumn(col._id);
                                        }}
                                      >
                                        <FaPlus size={12} /> Add Todo
                                      </li>
                                      <li
                                        className="px-4 py-2 text-gray-700 hover:bg-blue-100 hover:text-blue-700 cursor-pointer flex items-center gap-2"
                                        onClick={() => {
                                          setActiveMenu(null);
                                          renameColumn(col._id);
                                        }}
                                      >
                                        <FaEdit size={12} /> Rename
                                      </li>
                                      <li
                                        className="px-4 py-2 text-gray-700 hover:bg-red-100 hover:text-red-700 cursor-pointer flex items-center gap-2"
                                        onClick={() => {
                                          setActiveMenu(null);
                                          deleteColumn(col._id);
                                        }}
                                      >
                                        <FaTrash size={12} /> Delete Column
                                      </li>
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>

                            <Droppable
                              droppableId={String(col._id)}
                              type="TASK"
                              ignoreContainerClipping={true}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className="flex flex-col gap-3 flex-grow"
                                >
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
                                            onClick={(e) => {
                                              if (
                                                e.target.closest(
                                                  ".delete-btn, .edit-btn"
                                                )
                                              )
                                                return;
                                              if (isDragging) return;
                                              openViewModal(todo);
                                            }}
                                            style={{
                                              ...provided.draggableProps.style,
                                              zIndex: snapshot.isDragging
                                                ? 9999
                                                : "auto",
                                              opacity: snapshot.isDragging ? 0.9 : 1,
                                              boxShadow: snapshot.isDragging
                                                ? "0 5px 10px rgba(0,0,0,0.2)"
                                                : "none",
                                            }}
                                            className="todo-item relative bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden"
                                          >
                                            <div className="flex justify-between items-center mb-2">
                                              <h3 className="text-sm sm:text-xl font-semibold text-gray-800 leading-snug mb-1 truncate">
                                                {todo.title}
                                              </h3>
                                              <MdDeleteOutline
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  deleteTodo(todo._id, todo.isDummy);
                                                }}
                                                className="text-red-500 w-5 h-5 cursor-pointer hover:scale-110 duration-200 delete-btn"
                                              />
                                            </div>

                                            <p
                                              className="text-xs sm:text-lg text-gray-500 mb-3 line-clamp-2"
                                              title={todo.description}
                                            >
                                              {todo.description ||
                                                "No description available"}
                                            </p>

                                            <div className="flex justify-between items-center text-gray-400 text-xs mb-2 border-b border-b-gray-200 pb-2">
                                              <span className="flex items-center gap-1 text-sm sm:text-lg">
                                                {todo.day
                                                  ? new Date(
                                                    todo.day
                                                  ).toLocaleDateString("en-GB", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                  })
                                                  : "No Date"}
                                              </span>
                                              <span
                                                className={`text-[11px] font-medium px-2 py-0.5 sm:px-6 sm:py-2 rounded-full capitalize ${todo.priority === "high"
                                                  ? "bg-red-100 text-red-600"
                                                  : todo.priority === "medium"
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : "bg-green-100 text-green-700"
                                                  }`}
                                              >
                                                {todo.priority || "low"}
                                              </span>
                                            </div>

                                            <div className="flex justify-start items-center gap-4 text-xs text-gray-500">
                                              <span className="flex items-center gap-1">
                                                <BiCommentDetail className="text-gray-400 w-4 h-4" />
                                                {todo.comments?.length || 0}
                                              </span>
                                            </div>
                                          </div>
                                        )}
                                      </Draggable>
                                    ))
                                  ) : (
                                    <p className="text-gray-500 text-center pt-5 text-sm sm:text-xl">
                                      No todos here
                                    </p>
                                  )}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {boardProvided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </>
        )}
      </div>

      {isModalOpen && (
        <div
          onMouseDown={(e) => (e.currentTarget.dataset.down = "true")}
          onMouseUp={(e) => {
            if (e.currentTarget.dataset.down === "true") {
              setIsModalOpen(false);
              setEditingTodo(null);
              setTitle("");
              setDescription("");
              setActiveColumnForNewTodo(null);
            }
            delete e.currentTarget.dataset.down;
          }}
          className="fixed inset-0 bg-gradient-to-br from-black/40 to-black/60 backdrop-blur-md flex justify-center items-center z-50 p-4 sm:p-6"
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-[500px] overflow-hidden relative border border-gray-100"
          >
            <div className="bg-gradient-to-r from-[#2B1887] to-[#4a3bbd] p-6 relative">
              <h2 className="text-2xl font-bold text-white text-center">
                {editingTodo ? "Update Todo" : "Add New Todo"}
              </h2>
              <p className="text-white/80 text-sm mt-1 text-center">
                {editingTodo ? "Modify your todo details" : "Create a new todo task"}
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-5">
                <div className="group">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                    Enter Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter todo title"
                    className="border border-gray-300 rounded-xl w-full p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B1887] focus:border-transparent bg-gradient-to-br from-gray-50 to-white"
                  />
                </div>

                <div className="group">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                    Select Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="border border-gray-300 rounded-xl w-full p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B1887] focus:border-transparent bg-gradient-to-br from-gray-50 to-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="group">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                    Enter Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter todo description"
                    rows="4"
                    className="border border-gray-300 rounded-xl w-full p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B1887] focus:border-transparent bg-gradient-to-br from-gray-50 to-white resize-none"
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingTodo(null);
                    setTitle("");
                    setDescription("");
                    setActiveColumnForNewTodo(null);
                  }}
                  className="cursor-pointer bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={saveTodo}
                  disabled={loading}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg ${loading
                    ? "bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed cursor-pointer"
                    : "bg-gradient-to-r from-[#2B1887] to-[#4a3bbd] text-white hover:scale-105 cursor-pointer"
                    }`}
                >
                  {loading ? "Adding..." : editingTodo ? "Update Todo" : "Add Todo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isViewModalOpen && selectedTodo && (
        <div
          onMouseDown={(e) => (e.currentTarget.dataset.down = "true")}
          onMouseUp={(e) => {
            if (e.currentTarget.dataset.down === "true") {
              setIsViewModalOpen(false);
              setSelectedTodo(null);
            }
            delete e.currentTarget.dataset.down;
          }}
          className="fixed inset-0 bg-gradient-to-br from-black/40 to-black/60 backdrop-blur-md flex justify-center items-center z-50 p-4 sm:p-6"
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-[550px] max-h-[90vh] overflow-hidden relative border border-gray-100"
          >
            <div className="bg-gradient-to-r from-[#2B1887] to-[#4a3bbd] p-6 relative">
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  openModalForEdit(selectedTodo);
                }}
                className="absolute top-5 right-5 bg-white/20 hover:bg-white/30 text-white p-2.5 rounded-full transition-all duration-200 backdrop-blur-sm cursor-pointer"
                title="Edit Todo"
              >
                <LiaEdit className="text-xl" />
              </button>

              <h2 className="text-2xl font-bold text-white pr-12">
                Task Overview
              </h2>
              <p className="text-white/80 text-sm mt-1">
                View complete details
              </p>
            </div>

            <div
              className="p-6 overflow-y-auto"
              style={{ maxHeight: "calc(90vh - 120px)" }}
            >
              <div className="space-y-5">
                <div className="group">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                    Task Title
                  </label>
                  <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-lg font-semibold text-gray-800 break-words whitespace-pre-wrap">
                      {selectedTodo.title}
                    </p>
                  </div>
                </div>

                <div className="group">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                    Priority Level
                  </label>
                  <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Priority Status
                    </span>
                    <span
                      className={`px-5 py-2 rounded-full text-sm font-bold uppercase tracking-wide shadow-md ${selectedTodo.priority === "high"
                        ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
                        : selectedTodo.priority === "medium"
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                          : "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                        }`}
                    >
                      {selectedTodo.priority}
                    </span>
                  </div>
                </div>

                <div className="group">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                    Description
                  </label>
                  <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-200 shadow-sm max-h-[220px] overflow-y-auto">
                    <p className="text-base text-gray-700 break-words whitespace-pre-wrap leading-relaxed">
                      {selectedTodo.description || "No description provided."}
                    </p>
                  </div>
                </div>

                <div className="group">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                    Comments & Discussion
                  </label>
                  <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-200 shadow-sm max-h-[280px] overflow-y-auto">
                    {comments.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-gray-400 text-sm">
                          No comments yet. Start the conversation!
                        </p>
                      </div>
                    )}

                    <div className="space-y-3">
                      {comments.map((c) => (
                        <div
                          key={c._id}
                          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group relative"
                        >
                          {editingComment?._id === c._id ? (
                            <div>
                              <input
                                className="border border-gray-300 rounded-xl w-full p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B1887] focus:border-transparent bg-gradient-to-br from-gray-50 to-white"
                                value={editingComment.text}
                                onChange={(e) =>
                                  setEditingComment({
                                    ...editingComment,
                                    text: e.target.value,
                                  })
                                }
                              />
                              <div className="flex justify-end gap-3 mt-4">
                                <button
                                  onClick={() => setEditingComment(null)}
                                  className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-2 rounded-xl font-medium hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-md"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleUpdateComment(c._id)}
                                  className="bg-gradient-to-r from-[#2B1887] to-[#4a3bbd] text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-all duration-200"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <p className="font-bold text-[#2B1887] text-sm">
                                    {c.user?.name || "Unknown User"}
                                  </p>
                                  <span className="text-xs text-gray-400 mt-0.5 block">
                                    {new Date(c.createdAt).toLocaleDateString(
                                      "en-GB",
                                      {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      }
                                    )}
                                  </span>
                                </div>
                                {(c.user?._id === currentUserId ||
                                  c.user === currentUserId) && (
                                    <div className="relative">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveCommentMenu(activeCommentMenu === c._id ? null : c._id);
                                        }}
                                        className="p-1 rounded-lg duration-300 hover:bg-purple-100 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <TbDotsVertical className="w-4 h-4 text-[#2B1887] cursor-pointer" />
                                      </button>

                                      {activeCommentMenu === c._id && (
                                        <div
                                          className="absolute right-0 top-6 w-32 bg-white rounded-lg shadow-lg z-50 border border-gray-200"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <div className="flex flex-col text-sm rounded-lg overflow-hidden">
                                            <div
                                              className="px-3 py-2 text-gray-700 hover:bg-blue-100 hover:text-blue-700 cursor-pointer flex items-center gap-2"
                                              onClick={() => {
                                                setActiveCommentMenu(null);
                                                setEditingComment(c);
                                              }}
                                            >
                                              <FaEdit size={10} /> Edit
                                            </div>
                                            <div
                                              className="px-3 py-2 text-gray-700 hover:bg-red-100 hover:text-red-700 cursor-pointer flex items-center gap-2"
                                              onClick={() => {
                                                setActiveCommentMenu(null);
                                                handleDeleteComment(c._id);
                                              }}
                                            >
                                              <FaTrash size={10} /> Delete
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                              </div>

                              <p className="text-sm text-gray-700 leading-relaxed break-words">
                                {c.text}
                              </p>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-3">
                    <input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="border border-gray-300 rounded-xl w-full p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B1887] focus:border-transparent"
                    />
                    <button
                      onClick={handleAddComment}
                      className="bg-gradient-to-r from-[#2B1887] to-[#4a3bbd] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedTodo(null);
                }}
                className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white px-5 py-3 rounded-xl font-semibold hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isColumnModalOpen && (
        <div
          onMouseDown={(e) => (e.currentTarget.dataset.down = "true")}
          onMouseUp={(e) => {
            if (e.currentTarget.dataset.down === "true") {
              setIsColumnModalOpen(false);
              setNewColumnName("");
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
              <h2 className="text-2xl font-bold text-white">
                Add New Column
              </h2>
              <p className="text-white/80 text-sm mt-1">
                Create a new column for your todos
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="group">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                    Column Name
                  </label>
                  <input
                    type="text"
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    placeholder="Enter column name"
                    className="border border-gray-300 rounded-xl w-full p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B1887] focus:border-transparent bg-gradient-to-br from-gray-50 to-white"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsColumnModalOpen(false);
                    setNewColumnName("");
                  }}
                  className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={saveColumn}
                  disabled={isSavingColumn}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg ${isSavingColumn
                    ? "bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed"
                    : "bg-gradient-to-r from-[#2B1887] to-[#4a3bbd] text-white hover:scale-105"
                    }`}
                >
                  {isSavingColumn ? "Adding..." : "Add Column"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isRenameModalOpen && (
        <div
          onMouseDown={(e) => (e.currentTarget.dataset.down = "true")}
          onMouseUp={(e) => {
            if (e.currentTarget.dataset.down === "true") {
              setIsRenameModalOpen(false);
              setRenameColumnName("");
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
              <h2 className="text-2xl font-bold text-white">
                Rename Column
              </h2>
              <p className="text-white/80 text-sm mt-1">
                Update column name
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="group">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                    New Column Name
                  </label>
                  <input
                    type="text"
                    value={renameColumnName}
                    onChange={(e) => setRenameColumnName(e.target.value)}
                    placeholder="Enter new column name"
                    className="border border-gray-300 rounded-xl w-full p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B1887] focus:border-transparent bg-gradient-to-br from-gray-50 to-white"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsRenameModalOpen(false);
                    setRenameColumnName("");
                  }}
                  className="cursor-pointer bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRenameColumn}
                  className="cursor-pointer bg-gradient-to-r from-[#2B1887] to-[#4a3bbd] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AuthRoute />
    </>
  );
}