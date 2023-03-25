interface TimelineEntity {
  content: {
    startTime: number;
  };
  timeline: {
    start: number;
    end: number;
  };
}

/**
 * 未実装
 * @deprecated
 */
const Timeline: React.FC<{ className?: string }> = () => {
  return <svg></svg>;
};

export type { TimelineEntity, Timeline };
