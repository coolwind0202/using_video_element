import { useEffect, useMemo, useRef, useState } from "react";
import { VideoLoaded, VideoNotLoaded } from "./Home";

import "./App.css";
import { TimelineEntity } from "./features/timeline/components/Timeline";
import clsx from "clsx";

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
  const [currentPlayFrame, setCurrentPlayFrame] = useState(0);

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

  // 1/60秒間隔のプレイヤーの時間更新更新に応じて、videoRefの現在フレームを読み取り、canvasに書き出す
  /*
    追記：ここは期待通りに動かず、canvasには多くの場合何も表示されません（たまに表示されます）
    書き始めた当時、1/60秒間隔で更新しようと思っていましたが、時間間隔は不定でも問題なかったため、requestAnimationFrameを使っています
  */

  useEffect(() => {
    const renderCanvas = () => {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;

      const videoElement = videoRef.current;
      if (!videoElement) return;

      ctx.drawImage(videoElement, 0, 0);

      requestAnimationFrame(renderCanvas);
    };

    requestAnimationFrame(renderCanvas);
  }, []);

  // 停止中：更新しない

  // ユーザーがシークしたらフレームを更新する
  const onSeek: React.FormEventHandler<HTMLInputElement> = (props) => {
    const value = props.currentTarget.valueAsNumber;
    setCurrentPlayFrame(value);

    const videoElement = videoRef.current;
    if (!videoElement) return;

    const playTime = currentPlayFrame / projectFPS;
    videoElement.currentTime = playTime;
  };

  /*
    現在の再生対象となっているEntityのindex。
    Entityの再生が完了したタイミングで増加します
  */
  const [currentEntityIndex, setCurrentEntityIndex] = useState<number>(0);
  const [isVideoPlaying, setVideoPlaying] = useState<boolean>(false);

  // そして：フレームが更新されたらplayTimeとentitiesを対応させて、currentPlayFrameがstartフレームとendフレームの間に存在するようなエンティティを見つける
  //  で、currentPlayFrame - そのエンティティのstartフレームが現在のエンティティのフレーム数なので、それをセット　しない
  //  セットするのはフレーム数ではなくて時間ですよ・・・

  const controllVideo = async () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const currentEntity = entities.at(currentEntityIndex);
    if (currentEntity === undefined) return;

    if (currentPlayFrame === currentEntity.timeline.start && !isVideoPlaying) {
      // Entityの開始フレームに到達したため、再生を開始する
      setVideoPlaying(true);
      videoElement.currentTime = currentEntity.content.startTime;
      await videoElement.play();
      console.log("play-start", currentEntity.content.startTime);
      // ずれを防止するため、フレームの更新はEntityの再生が開始したタイミングで行ったほうがよい？
    }

    if (currentPlayFrame === currentEntity.timeline.end && isVideoPlaying) {
      // 再生を終了する
      setVideoPlaying(false);
      videoElement.pause();
      setCurrentEntityIndex((value) => value + 1);
    }

    setCurrentPlayFrame((value) => value + 1);
  };

  // useTimeoutFnがhookとして設計されたので、再帰的にTimeoutをするということができない
  // しかしuseIntervalでcontrollVideoを呼び出すのは不適切。なぜなら、play()が完了をするのをsetIntervalでは待てず、必ず同じ頻度で実行してしまう
  // setTimeoutを、playの完了後に再帰的に呼び出す設計なら、この問題を回避できるが・・・？？

  /*
  useTimeoutFn(() => {
    const f = () => {
      controllVideo();
    }
  }, 1000 / projectFPS);

  useInterval(async () => {
    await controllVideo();
  }, 1000 / projectFPS);
  */

  useEffect(() => {
    setTimeout(async function f() {
      await controllVideo();
      setTimeout(async () => {
        await f();
      }, 1000 / projectFPS);
    }, 1000 / projectFPS);
  }, []);

  /*
    追記：3つの実装を試し、うち2つはコメントアウトして残しています
    3つめの実装は、期待より速い間隔でコールバックが呼び出されるという問題と、実際には再生が開始しないという問題を抱えています
  */

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
                  className={clsx("w-full", !isVideoPlaying && "grayscale")}
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
              value={currentPlayFrame}
              className="w-full"
              onInput={onSeek}
            />
            <p>{Math.floor(currentPlayFrame / projectFPS)} 秒</p>
          </div>
        </VideoLoaded>
      )}
    </div>
  );
}

export default App;
