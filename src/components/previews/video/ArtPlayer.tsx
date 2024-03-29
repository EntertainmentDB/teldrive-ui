import React, { useEffect, useRef } from "react"
import Artplayer from "artplayer"
import type ArtOption from "artplayer/types/option"

Artplayer.LOG_VERSION = false
interface PlayerProps {
  option: ArtOption
  style: React.CSSProperties
  getInstance?: (instance: Artplayer) => void
}

const Player = ({ option, getInstance, ...rest }: PlayerProps) => {
  const artRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const art = new Artplayer({
      ...option,
      container: artRef.current!,
    })

    if (getInstance && typeof getInstance === "function") {
      getInstance(art)
    }

    return () => {
      if (art && art.destroy) {
        art.destroy(false)
      }
    }
  }, [])

  return <div ref={artRef} {...rest}></div>
}

export default Player
