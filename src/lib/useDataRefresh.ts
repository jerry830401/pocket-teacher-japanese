import { useEffect, useState } from 'react'
import { checkAndRefreshOfflineData } from '@/lib/db/offlineData'

const SESSION_KEY = 'ptjp_data_refreshed'

export function useDataRefresh() {
  const [dataUpdated, setDataUpdated] = useState(false)

  useEffect(() => {
    // After user clicks "重新載入", we set a sessionStorage flag so the
    // banner doesn't re-appear on the next mount even if ETag still differs
    // briefly (e.g., CDN propagation delay).
    if (sessionStorage.getItem(SESSION_KEY)) {
      sessionStorage.removeItem(SESSION_KEY)
      return
    }
    checkAndRefreshOfflineData().then((updated) => {
      if (updated) setDataUpdated(true)
    })
  }, [])

  return { dataUpdated }
}

export function markDataRefreshReload() {
  sessionStorage.setItem(SESSION_KEY, '1')
}
