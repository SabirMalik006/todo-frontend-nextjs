"use client";
import TeamCard from "./TeamCard";

export default function Sidebar({
  teams,
  selectedTeam,
  setSelectedTeam,
  sidebarOpen,
  setSidebarOpen,
  boards,
  loading,
}) {
  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white/90 backdrop-blur-xl border-r shadow-lg transform transition-transform duration-300 z-50 lg:translate-x-0 lg:relative ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold text-indigo-600">Teams</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-black"
          >
            ✕
          </button>
        </div>

        <div className="p-3 space-y-2 overflow-y-auto max-h-[calc(100vh-70px)]">
          {teams.map((team) => (
            <TeamCard
              key={team._id}
              team={team}
              selected={selectedTeam === team._id}
              onClick={() => {
                setSelectedTeam(team._id);
                setSidebarOpen(false);
              }}
              boardCount={
                boards.filter(
                  (b) => b.team === team._id || b.teamId === team._id
                ).length
              }
            />
          ))}

          {teams.length === 0 && !loading && (
            <div className="text-center text-gray-500 py-6">
              No teams found
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
