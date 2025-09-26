export default function CreateBoardModal({
    newBoard,
    setNewBoard,
    handleCreateBoard,
    setShowBoardModal,
    loading,
  }) {
    return (
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={() => setShowBoardModal(false)}
      >
        <div
          className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-indigo-600">Create New Board</h2>
            <button
              onClick={() => setShowBoardModal(false)}
              className="text-gray-500 hover:text-black"
            >
              ✕
            </button>
          </div>
  
          <form onSubmit={handleCreateBoard} className="space-y-4">
            <input
              type="text"
              placeholder="Board Title *"
              value={newBoard.title}
              onChange={(e) =>
                setNewBoard({ ...newBoard, title: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2"
              required
            />
  
            <textarea
              placeholder="Description"
              value={newBoard.description}
              onChange={(e) =>
                setNewBoard({ ...newBoard, description: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2"
              rows={3}
            />
  
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowBoardModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white"
              >
                {loading ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
  