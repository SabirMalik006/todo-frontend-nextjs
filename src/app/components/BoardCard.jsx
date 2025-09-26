export default function BoardCard({ board, onClick }) {
    return (
      <div
        className="bg-white shadow-md rounded-xl p-5 cursor-pointer hover:shadow-xl transition"
        onClick={onClick}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 bg-indigo-500 text-white rounded-lg flex items-center justify-center font-bold">
            {board.title.charAt(0).toUpperCase()}
          </div>
          <span className="text-gray-400">›</span>
        </div>
        <h3 className="font-bold text-lg text-gray-800">{board.title}</h3>
        {board.description && (
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
            {board.description}
          </p>
        )}
      </div>
    );
  }
  