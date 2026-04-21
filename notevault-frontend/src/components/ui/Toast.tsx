import { Toaster } from 'react-hot-toast'

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        className:
          '!bg-slate-900 !text-slate-100 dark:!bg-slate-100 dark:!text-slate-900 !rounded-lg !shadow-lg !px-4 !py-3',
      }}
    />
  )
}
