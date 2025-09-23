"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../utils/api";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [showBoardModal, setShowBoardModal] = useState(false);
  const [newBoard, setNewBoard] = useState({ title: "", description: "" });

  const router = useRouter();

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      fetchBoards();
    }
  }, [selectedTeam]);

  // Fetch all teams
  async function fetchTeams() {
    try {
      setLoading(true);
      const { data } = await api.get("/team/my-teams");
      setTeams(data || []);
      if (data.length > 0) setSelectedTeam(data[0]._id);
    } catch (err) {
      console.error("Error fetching teams:", err);
    } finally {
      setLoading(false);
    }
  }

  // Fetch boards for the selected team or all boards if no team selected
  async function fetchBoards() {
    try {
      setLoading(true);
      const { data } = await api.get("/board/");
      if (selectedTeam) {
        const filteredBoards = data.filter(
          (b) => b.team === selectedTeam || b.teamId === selectedTeam
        );
        setBoards(filteredBoards || []);
      } else {
        setBoards(data || []);
      }
    } catch (err) {
      console.error("Error fetching boards:", err);
    } finally {
      setLoading(false);
    }
  }

  // Create new board
  async function handleCreateBoard(e) {
    e.preventDefault();
    if (!selectedTeam) return alert("No team selected for this board.");
    if (!newBoard.title.trim()) return alert("Board title is required.");
    
    try {
      setLoading(true);
      await api.post("/board/", {
        title: newBoard.title,
        description: newBoard.description,
        teamId: selectedTeam,
      });
      setShowBoardModal(false);
      setNewBoard({ title: "", description: "" });
      fetchBoards();
    } catch (err) {
      console.error("Error creating board:", err);
      alert("Error creating board. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const selectedTeamData = teams.find(team => team._id === selectedTeam);

  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Mobile menu overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-white/90 backdrop-blur-xl border-r border-white/20 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 lg:translate-x-0 lg:relative lg:z-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Teams
              </h2>
              <p className="text-sm text-gray-500 mt-1">{teams.length} teams available</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 space-y-2 max-h-[calc(100vh-120px)] overflow-y-auto">
          {teams.map((team, index) => (
            <div
              key={team._id}
              onClick={() => {
                setSelectedTeam(team._id);
                setSidebarOpen(false);
              }}
              className={`group p-4 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
                selectedTeam === team._id
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                  : "bg-gray-50 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 text-gray-700"
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    selectedTeam === team._id
                      ? "bg-white/20 text-white"
                      : "bg-indigo-100 text-indigo-600"
                  }`}
                >
                  {team.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{team.name}</p>
                  <p className={`text-xs opacity-75 ${selectedTeam === team._id ? "text-white/80" : "text-gray-500"}`}>
                    {boards.filter(b => b.team === team._id || b.teamId === team._id).length} boards
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {teams.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-2.121M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.196-2.121M7 20v-2m5-8a3 3 0 110-6 3 3 0 010 6z" />
              </svg>
              <p className="font-medium">No teams found</p>
              <p className="text-sm">Create or join a team to get started</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-0 min-h-screen">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
                    {selectedTeamData ? selectedTeamData.name : "Dashboard"}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {boards.length} board{boards.length !== 1 ? 's' : ''} in this workspace
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setShowBoardModal(true)}
                disabled={!selectedTeam || loading}
                className="group relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-medium"
              >
                <span className="hidden sm:inline">Create Board</span>
                <span className="sm:hidden">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
                <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-r-purple-600 animate-spin animation-delay-75"></div>
              </div>
            </div>
          )}

          {!loading && boards.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 sm:p-12 shadow-xl border border-white/20 max-w-md mx-auto">
                <svg className="w-16 h-16 mx-auto mb-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                <h3 className="text-xl font-bold text-gray-900 mb-3">No boards yet</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Create your first board to start organizing your projects and tasks.
                </p>
                <button
                  onClick={() => setShowBoardModal(true)}
                  disabled={!selectedTeam}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Create Your First Board
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
              {boards.map((board, index) => (
                <div
                  key={board._id}
                  className="group bg-white/70 backdrop-blur-sm shadow-lg rounded-2xl p-6 cursor-pointer hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 border border-white/20 hover:bg-white/90"
                  onClick={() => router.push("/")}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {board.title.charAt(0).toUpperCase()}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors duration-200">
                    {board.title}
                  </h3>
                  
                  {board.description && (
                    <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                      {board.description}
                    </p>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center text-xs text-gray-500">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Updated recently
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Board Modal */}
      {showBoardModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4"
          onClick={() => setShowBoardModal(false)}
        >
          <div
            className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-lg border border-white/20 transform animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Create New Board
              </h2>
              <button
                onClick={() => setShowBoardModal(false)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Board Title *
                </label>
                <input
                  type="text"
                  value={newBoard.title}
                  placeholder="e.g., Product Roadmap, Sprint Planning"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  onChange={(e) => setNewBoard({ ...newBoard, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newBoard.description}
                  placeholder="Describe the purpose and goals of this board..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm resize-none"
                  onChange={(e) => setNewBoard({ ...newBoard, description: e.target.value })}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBoardModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !newBoard.title.trim()}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating...
                    </span>
                  ) : (
                    "Create Board"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .animation-delay-75 {
          animation-delay: 75ms;
        }
      `}</style>
    </div>
    </>
  );
}   