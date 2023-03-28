import { useEffect, useMemo, useRef, useState } from "react";
import { VideoLoaded, VideoNotLoaded } from "./Home";

import "./App.css";
import { TimelineEntity } from "./features/timeline/components/Timeline";
import { render } from "react-dom";

function App() {
  /*
    video要素が映像を読み出すためのBlob
  */
  const [video, setVideo] = useState<File | null>(null);

  /**
   * Entityの配列です、Entityという考え方については添付のScrapboxページをご覧ください.
   */
  const [entities, setEntities] = useState<TimelineEntity[]>([
    /*
      タイムラインのUIを未実装のため、実験的にここでEntityの配列を定義しています
    */
    {
      content: {
        startTime: 10,
      },
      timeline: {
        start: 300,
        end: 500,
      },
    },
    {
      content: {
        startTime: 100,
      },
      timeline: {
        start: 600,
        end: 699,
      },
    },
    {
      content: {
        startTime: 100,
      },
      timeline: {
        start: 700,
        end: 799,
      },
    },
    {
      content: {
        startTime: 100,
      },
      timeline: {
        start: 800,
        end: 899,
      },
    },
  ]);
  /**
   * プロジェクトのfpsを表し、これを元にフレームが更新されます
   * 変更機能は実装していませんが、作ればその通りに動くはずです
   */
  const [projectFPS, setProjectFPS] = useState(60);

  /**
   * 現在の再生フレーム
   */
  const currentPlayFrame = useRef<number>(0);

  const onFileSelect: React.FormEventHandler<HTMLInputElement> = (e) => {
    const files = e.currentTarget.files;
    if (files === null || !files.length) {
      setVideo(null);
      return;
    }

    const file = files.item(0);
    if (file === null) {
      setVideo(null);
      return;
    }

    setVideo(file);
  };

  /**
   * 選択された動画ファイルのobjectURL
   */
  const videoUrl = useMemo(
    () => (video === null ? undefined : URL.createObjectURL(video)),
    [video]
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 停止中：更新しない

  const frameInputRef = useRef<HTMLInputElement>(null);
  const frameDisplayRef = useRef<HTMLParagraphElement>(null);

  const renderCanvas = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const videoElement = videoRef.current;
    if (!videoElement) return;
    if (!isVideoPlaying.current) return;

    ctx.drawImage(videoElement, 0, 0);
  };

  const updateFrameNumber = (value: number) => {
    currentPlayFrame.current = value;

    const frameInput = frameInputRef.current;
    if (frameInput) frameInput.value = value.toString();

    const frameDisplay = frameDisplayRef.current;
    if (frameDisplay)
      frameDisplay.innerText = `${Math.floor(value / projectFPS)}秒`;
  };

  const getEntityIndex = (frame: number) => {
    for (const [i, entity] of entities.entries()) {
      if (entity.timeline.end >= frame) return i;
    }

    return entities.length;
  };

  const seek = (time: number) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const playTime = time;
    videoElement.currentTime = playTime;
  };

  // ユーザーがシークしたらフレームを更新する
  const onSeek: React.FormEventHandler<HTMLInputElement> = async (props) => {
    const value = props.currentTarget.valueAsNumber;
    seek(value / projectFPS);

    currentEntityIndex.current = getEntityIndex(value);
    console.log(currentEntityIndex.current);
    updateFrameNumber(value);

    /*
      seekした際に一度動画を停止する
    */
    changeIsVideoPlaying(false);
    videoRef.current?.pause();
  };

  /*
    現在の再生対象となっているEntityのindex。
    Entityの再生が完了したタイミングで増加します
  */
  const currentEntityIndex = useRef<number>(0);
  const isVideoPlaying = useRef(false);

  const changeIsVideoPlaying = (value: boolean) => {
    isVideoPlaying.current = value;
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (value) videoElement.classList.remove("grayscale");
    else videoElement.classList.add("grayscale");
  };

  const controllVideo = async () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const currentEntity = entities.at(currentEntityIndex.current);
    if (currentEntity === undefined) return;

    if (currentPlayFrame.current === currentEntity.timeline.start) {
      // Entityの開始フレームに到達したため、再生を開始する
      changeIsVideoPlaying(true);
      seek(currentEntity.content.startTime);
      await videoElement.play();

      console.log("play-start", currentEntity.content.startTime);
      // ずれを防止するため、フレームの更新はEntityの再生が開始したタイミングで行ったほうがよい？
    }

    if (currentPlayFrame.current === currentEntity.timeline.end) {
      // 再生を終了する
      changeIsVideoPlaying(false);

      videoElement.pause();
      currentEntityIndex.current++;
    }

    /*
      これでも動きますが、非同期処理として何らかの問題があり、
    */
    await new Promise((resolve) => {
      renderCanvas();
      resolve(null);
    });

    updateFrameNumber(currentPlayFrame.current + 1);
  };

  useEffect(() => {
    /*
      フレームを一定間隔（動画のデコード時間によって若干変動します）で処理する。
    */
    let ignore = false;

    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(() => resolve(null), ms));

    const f = async () => {
      if (ignore) {
        console.log("clean up");
        return;
      }
      await controllVideo();

      await sleep(1000 / projectFPS);
      await f();
    };

    f();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="w-screen h-screen grid grid-cols-3">
      <div className="col-start-1 col-end-1">
        <input type="file" onChange={onFileSelect} />
      </div>
      {video === null ? (
        <VideoNotLoaded></VideoNotLoaded>
      ) : (
        <VideoLoaded>
          <div className="w-full flex flex-col items-center justify-center">
            <div className="grid grid-cols-2">
              <div className="col-start-1 col-end-1">
                <p className="text-white">Video(Source)</p>
                <video
                  src={videoUrl}
                  controls={false}
                  ref={videoRef}
                  width={1280}
                  height={720}
                  className="w-full grayscale"
                ></video>
              </div>
              <div className="col-start-2 col-end-2">
                <p>Canvas(Display)</p>
                <canvas
                  ref={canvasRef}
                  width={1280}
                  height={720}
                  className="w-full"
                ></canvas>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={50000}
              step={1}
              ref={frameInputRef}
              className="w-full"
              onInput={onSeek}
            />
            <p ref={frameDisplayRef} />
          </div>
        </VideoLoaded>
      )}
    </div>
  );
}

export default App;
