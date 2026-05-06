import { useEffect, useState } from 'react'
import { checkAndRefreshOfflineData } from '@/lib/db/offlineData'

// Fires checkAndRefreshOfflineData once on mount.
// Returns true if any offline data was silently updated in the background,
// prompting the user to reload so the new data takes effect.
export function useDataRefresh() {
  const [dataUpdated, setDataUpdated] = useState(false)

  useEffect(() => {
    checkAndRefreshOfflineData().then((updated) => {
      if (updated) setDataUpdated(true)
    })
  }, [])

  return { dataUpdated }
}
