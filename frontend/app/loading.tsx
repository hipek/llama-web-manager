export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="loading-box">
        <div className="spinner spinner-lg mx-auto mb-4" />
        <p className="text-dark-400 text-sm">Loading...</p>
      </div>
    </div>
  )
}
