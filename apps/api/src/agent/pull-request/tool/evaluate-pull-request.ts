import type { AgentTool } from "../../llm/loop.js";
import type { GitProvider } from "../../../git-provider/types.js";

export type PullRequestVerdict = { isGood: boolean | null };

/** Records the verdict in `verdict`. The caller submits the review decision once the summary is posted. */
export function evaluatePullRequestTool(
    provider: GitProvider,
    prIid: number,
    isFollowUpReview: boolean,
    verdict: PullRequestVerdict,
): AgentTool {
    return {
        name: "evaluate_pull_request",
        description:
            "Record your overall verdict on this pull request after post_pull_request_comment. Call exactly once. Set isGood true only when the pull request has no open Main Issues. Set isGood false when any Main Issue is open.",
        parameters: {
            type: "object",
            properties: {
                isGood: {
                    type: "boolean",
                    description: "True when the pull request has no open Main Issues. False otherwise.",
                },
            },
            required: ["isGood"],
        },
        execute: async (args) => {
            if (typeof args.isGood !== "boolean") {
                throw new Error("isGood must be a boolean");
            }
            verdict.isGood = args.isGood;
            if (args.isGood && !isFollowUpReview) {
                await provider.addEmoji({ type: "pull_request", prIid }, "👍");
            }
            return { evaluated: true, isGood: args.isGood };
        },
    };
}
