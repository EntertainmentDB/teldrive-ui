import { memo, useEffect, useRef } from "react";
import type { Artplayer, Option, AspectRatio } from "@artplayer/player";

import Player from "./art-player";

const aspectRatioes = ["default", "4:3", "16:9"];

interface VideoPlayerProps {
  name: string;
  assetUrl: string;
}
const VideoPlayer = ({ name, assetUrl }: VideoPlayerProps) => {
  const artInstance = useRef<Artplayer | null>(null);

  const artOptions: Option = {
    container: "",
    url: "",
    volume: 0.6,
    muted: false,
    autoplay: true,
    pip: true,
    autoMini: true,
    screenshot: true,
    setting: true,
    flip: true,
    playbackRate: true,
    aspectRatio: true,
    fullscreen: true,
    fullscreenWeb: true,
    mutex: true,
    backdrop: true,
    hotkey: true,
    playsInline: true,
    autoPlayback: true,
    airplay: true,
    lock: true,
    fastForward: true,
    autoOrientation: true,
    moreVideoAttr: {
      playsInline: true,
    },
  };

  useEffect(() => {
    if (artInstance.current && assetUrl) {
      artInstance.current.switchUrl(assetUrl);
      artInstance.current.title = name;
    }
    return () => {
      if (artInstance.current) {
        artInstance.current.video.pause();
        artInstance.current.video.removeAttribute("src");
        artInstance.current.video.load();
      }
    };
  }, [name, assetUrl]);

  return (
    <Player
      option={artOptions}
      style={{ aspectRatio: "16 /9" }}
      getInstance={(art) => {
        artInstance.current = art;
        art.hotkey.add(65, (_: Event) => {
          art.aspectRatio = aspectRatioes[
            (aspectRatioes.findIndex((val) => val === art.aspectRatio) + 1) % aspectRatioes.length
          ] as AspectRatio;
        });
      }}
    />
  );
};

export default memo(VideoPlayer);
