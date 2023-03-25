const VideoNotLoaded: React.FC<React.ComponentProps<"div">> = ({
  ...props
}) => {
  return (
    <div
      {...props}
      className="w-full h-full flex flex-col justify-center items-center gap-5"
    >
      <h1 className="text-white">Using Video Element</h1>
      <p>
        このアプリは、次の内容を検証し、その知見を蓄積するためのプロトタイプです。
      </p>

      <section className="flex flex-col gap-3">
        <section>
          <h2 className="font-bold">読み込んだ動画の描画</h2>
          <ul className="list-disc">
            <li>
              フレーム数ではなく、秒単位に依存し、再生ヘッドの秒数を元に各動画を表示できる。
            </li>
            <li>
              HTMLの<code>video</code>
              要素を使い、<code>canvas</code>
              上で再生ヘッドがある秒数を正確に描画することができる。
            </li>
            <li>
              読み込まれた動画のフレームレートとは無関係に、プロジェクトそのものに設定されたフレームレートごとに画面を更新し、動画を表示できる。
            </li>
          </ul>
        </section>
        <section>
          <h2 className="font-bold">動画のカット</h2>
          <ul className="list-disc">
            <li>
              動画のうち、再生する範囲を指定して、プロジェクト上の秒数と、実際に再生する秒数を対応づけることができる。
            </li>
            <li>
              再生する範囲を指定した動画から、再生すべき秒数を計算し、正しく描画できる。
            </li>
          </ul>
        </section>
        <section>
          <h2 className="font-bold">タイムラインへの配置</h2>
          <ul className="list-disc">
            <li>
              プロジェクトの動画オブジェクト（≠動画データ）は、タイムラインで表示することができる。
            </li>
            <li>動画オブジェクトを、コピーすることができる。</li>
            <li>動画オブジェクトには、再生範囲を指定することができる。</li>
          </ul>
        </section>
      </section>
    </div>
  );
};

const VideoLoaded: React.FC<React.ComponentProps<"div">> = ({ children }) => {
  return (
    <div className="w-full h-full">
      <h1 className="text-white">Using Video Element</h1>
      {children}
    </div>
  );
};

export { VideoLoaded, VideoNotLoaded };
