export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-white/70 dark:bg-black/40">
      <div className="flex items-center gap-3 rounded-md border bg-white dark:bg-neutral-900 px-4 py-3 shadow">
        <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
        <span className="text-sm text-gray-700 dark:text-gray-200">Lädt...</span>
      </div>
    </div>
  )
}

