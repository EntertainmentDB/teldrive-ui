import { memo } from "react"
import { Button } from "@tw-material/react"
import { cn } from "@tw-material/theme"
import IconIcRoundFullscreen from "~icons/ic/round-fullscreen"
import IconIcRoundFullscreenExit from "~icons/ic/round-fullscreen-exit"
import { useToggle } from "usehooks-ts"

interface WideScreenProps {
  children: React.ReactNode
}
export const WideScreen = memo(({ children }: WideScreenProps) => {
  const [fullscreen, toggle] = useToggle(false)
  return (
    <div className="max-w-[70%] w-full mx-auto p-4 relative h-[90vh]">
      <div
        className={cn(
          "size-full",
          fullscreen ? "fixed inset-0 z-50" : "relative"
        )}
      >
        <Button
          isIconOnly
          className="absolute bottom-2 right-5 z-[100]"
          variant="filled"
          onPress={toggle}
        >
          {fullscreen ? (
            <IconIcRoundFullscreenExit className="pointer-events-none" />
          ) : (
            <IconIcRoundFullscreen className="pointer-events-none" />
          )}
        </Button>
        {children}
      </div>
    </div>
  )
})
