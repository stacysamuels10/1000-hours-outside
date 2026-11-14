import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

type ShowToast = (message: string, undo?: () => void) => void
const Ctx = createContext<ShowToast>(() => {})
export const useToast = () => useContext(Ctx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string; undo?: () => void } | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const seq = useRef(0)

  const dismiss = useCallback(() => { window.clearTimeout(timer.current); setToast(null) }, [])
  const show = useCallback<ShowToast>((message, undo) => {
    window.clearTimeout(timer.current)
    setToast({ id: ++seq.current, message, undo })
    timer.current = window.setTimeout(() => setToast(null), 6000)
  }, [])
  useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <Ctx.Provider value={show}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <div className="toast" key={toast.id}>
            <span>{toast.message}</span>
            {toast.undo && (
              <button type="button" className="toast-undo" onClick={() => { toast.undo?.(); dismiss() }}>Undo</button>
            )}
          </div>
        )}
      </div>
    </Ctx.Provider>
  )
}
