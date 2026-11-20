import type { AgentTool } from "../../llm/loop.js";
import type { GitProvider } from "../../../git-provider/types.js";

export function evaluatePullRequestTool(
    provider: GitProvider,
    prIid: number,
    headSha: string,
    isFollowUpReview: boolean,
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
            const isGood = args.isGood === true;
            if (isGood && !isFollowUpReview) {
                await provider.addEmoji({ type: "pull_request", prIid }, "👍");
            }
            try {
                await provider.submitPullRequestReviewDecision?.(prIid, headSha, isGood);
            } catch (error) {
                // The summary is already posted. Report the rejected decision (for example on the bot's own pull request) as a tool error without failing the review
                const message = error instanceof Error ? error.message : String(error);
                return { evaluated: true, isGood, error: `Review decision not submitted: ${message}` };
            }
            return { evaluated: true, isGood };
        },
    };
}
