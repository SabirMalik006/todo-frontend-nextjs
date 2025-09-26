export default function TeamCard({ team, selected, onClick, boardCount }) {
    return (
      <div
        onClick={onClick}
        className={`p-3 rounded-lg cursor-pointer transition ${
          selected
            ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              selected ? "bg-white/30" : "bg-indigo-200 text-indigo-700"
            }`}
          >
            {team.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold">{team.name}</p>
            <p className="text-xs opacity-75">{boardCount} boards</p>
          </div>
        </div>
      </div>
    );
  }
  