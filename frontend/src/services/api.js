const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''

export async function getHealth() {
  const response = await fetch(`${API_URL}/api/health`)
  if (!response.ok) throw new Error(`API request failed with status ${response.status}`)
  return response.json()
}
