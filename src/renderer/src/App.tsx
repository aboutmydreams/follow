import { queryClient } from "@renderer/lib/query-client"
import { useEffect, useLayoutEffect } from "react"
import { Outlet } from "react-router-dom"

import { env } from "../../env.js"
import { useAppIsReady } from "./atoms/app"
import { useUISettingKey } from "./atoms/settings/ui"
import { appLog } from "./lib/log"
import { cn, getOS } from "./lib/utils"
import { Titlebar } from "./modules/app/Titlebar.js"
import { RootProviders } from "./providers/root-providers"
import { handlers } from "./tipc"

if (import.meta.env.DEV) {
  console.info("[renderer] env loaded:", env)
}
function App() {
  useEffect(() => {
    const cleanup = handlers?.invalidateQuery.listen((queryKey) => {
      queryClient.invalidateQueries({
        queryKey,
      })
    })

    return cleanup
  }, [])

  useLayoutEffect(() => {
    // Electron app register in app scope, but web app should register in window scope
    if (window.electron) return
    const handleOpenSettings = (e) => {
      if (e.key === "," && (e.metaKey || e.ctrlKey)) {
        window.router.showSettings()
        e.preventDefault()
      }
    }
    document.addEventListener("keydown", handleOpenSettings)

    return () => {
      document.removeEventListener("keydown", handleOpenSettings)
    }
  }, [])

  const windowsElectron = window.electron && getOS() === "Windows"
  return (
    <>
      <RootProviders>
        {window.electron && (
          <div
            className={cn("drag-region absolute inset-x-0 top-0 h-12 shrink-0", windowsElectron && "pointer-events-none z-[9999]")}
            aria-hidden
          >
            {windowsElectron && <Titlebar />}
          </div>
        )}
        <AppLayer />
      </RootProviders>
    </>
  )
}

const AppLayer = () => {
  const appIsReady = useAppIsReady()

  useEffect(() => {
    const doneTime = Math.trunc(performance.now())
    window.posthog?.capture("ui_render_init", {
      time: doneTime,
    })
    appLog("App is ready", `${doneTime}ms`)
  }, [appIsReady])

  return appIsReady ? <Outlet /> : <AppSkeleton />
}

const AppSkeleton = () => {
  const entryColWidth = useUISettingKey("entryColWidth")
  const feedColWidth = useUISettingKey("feedColWidth")
  return (
    <div className="flex size-full">
      <div
        className="h-full shrink-0"
        style={{
          width: `${feedColWidth}px`,
        }}
      />
      <div className="relative size-full grow bg-theme-background">
        <div
          className="absolute inset-y-0 w-px bg-border"
          style={{ left: entryColWidth }}
        />
      </div>
    </div>
  )
}
export default App
