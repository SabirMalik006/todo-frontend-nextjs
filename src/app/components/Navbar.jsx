import LogoutButton from "../components/Logout";

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center p-4 bg-[#2B1887] border-b border-gray-300">
      <h1 className="font-bold text-lg text-white">Todo App</h1>
      <LogoutButton />
    </nav>
  );
}
