import type { RunRecord } from "../storage/schema";

export type RunFeedbackTone = "success" | "learning" | "warning";

export type RunFeedbackMessageKey =
  | "feedback.successTitle"
  | "feedback.learningTitle"
  | "feedback.warningTitle"
  | "feedback.newBestCoaching"
  | "feedback.smoothSuccessCoaching"
  | "feedback.accurateSuccessCoaching"
  | "feedback.completeSuccessCoaching"
  | "feedback.offPathCoaching"
  | "feedback.skipCoaching"
  | "feedback.liftedCoaching"
  | "feedback.stalledCoaching"
  | "feedback.defaultFailedCoaching"
  | "feedback.chipNewBest"
  | "feedback.chipSmooth"
  | "feedback.chipAccurate"
  | "feedback.chipComplete"
  | "feedback.chipSlowCurve"
  | "feedback.chipStayWithLine"
  | "feedback.chipKeepTouch"
  | "feedback.chipKeepMoving";

export type RunFeedback = {
  tone: RunFeedbackTone;
  title: RunFeedbackMessageKey;
  coachingLine: RunFeedbackMessageKey;
  chips: RunFeedbackMessageKey[];
};

function beatPreviousBest(record: RunRecord, previousBest?: RunRecord | null): boolean {
  return (
    record.status === "success" &&
    typeof record.score === "number" &&
    typeof previousBest?.score === "number" &&
    record.score > previousBest.score
  );
}

export function deriveRunFeedback(record: RunRecord, previousBest?: RunRecord | null): RunFeedback {
  if (record.status === "success") {
    if (beatPreviousBest(record, previousBest)) {
      return {
        tone: "success",
        title: "feedback.successTitle",
        coachingLine: "feedback.newBestCoaching",
        chips: ["feedback.chipNewBest"],
      };
    }

    if (record.smoothness >= 0.86) {
      return {
        tone: "success",
        title: "feedback.successTitle",
        coachingLine: "feedback.smoothSuccessCoaching",
        chips: ["feedback.chipSmooth"],
      };
    }

    if (record.accuracy >= 0.9) {
      return {
        tone: "success",
        title: "feedback.successTitle",
        coachingLine: "feedback.accurateSuccessCoaching",
        chips: ["feedback.chipAccurate"],
      };
    }

    return {
      tone: "success",
      title: "feedback.successTitle",
      coachingLine: "feedback.completeSuccessCoaching",
      chips: ["feedback.chipComplete"],
    };
  }

  if (record.failReason === "skip_detected") {
    return {
      tone: "warning",
      title: "feedback.warningTitle",
      coachingLine: "feedback.skipCoaching",
      chips: ["feedback.chipStayWithLine"],
    };
  }

  if (record.failReason === "lifted" || record.failReason === "pointer_cancel") {
    return {
      tone: "learning",
      title: "feedback.learningTitle",
      coachingLine: "feedback.liftedCoaching",
      chips: ["feedback.chipKeepTouch"],
    };
  }

  if (record.failReason === "stalled") {
    return {
      tone: "learning",
      title: "feedback.learningTitle",
      coachingLine: "feedback.stalledCoaching",
      chips: ["feedback.chipKeepMoving"],
    };
  }

  if (record.failReason === "off_path" || record.progressMax >= 0.55) {
    return {
      tone: "learning",
      title: "feedback.learningTitle",
      coachingLine: "feedback.offPathCoaching",
      chips: ["feedback.chipSlowCurve"],
    };
  }

  return {
    tone: "learning",
    title: "feedback.learningTitle",
    coachingLine: "feedback.defaultFailedCoaching",
    chips: ["feedback.chipStayWithLine"],
  };
}
