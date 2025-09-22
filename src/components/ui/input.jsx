export function Input({ className, ...props }) {
  return (
    <input
      className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-900 dark:text-white ${className}`}
      {...props}
    />
  );
}
