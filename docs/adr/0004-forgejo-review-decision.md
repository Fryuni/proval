# Leave a review decision on Forgejo pull requests

Proval reviews on Forgejo only left a summary comment, plus a thumbs up reaction on a clean first review. Branch protection and the pull request list could not tell whether Proval was satisfied. Proval now leaves a real review decision on Forgejo after every review.

The change has three parts.

- `GitProvider` has an optional `submitPullRequestReviewDecision(prIid, headSha, isApproved)`. Only `ForgejoProvider` implements it. It posts an `APPROVED` review when the pull request is good and a `REQUEST_CHANGES` review otherwise, pinned to the reviewed head commit. Forgejo refuses a request changes review without a body, so that review carries a short pointer to the summary.
- `evaluate_pull_request` only records the agent verdict and rejects a missing or non boolean `isGood`. After the writing agent loop ends, `runReviewWritingAgent` throws when `post_pull_request_comment` never succeeded, so the activity fails and the head is not treated as reviewed. Otherwise it submits the decision unless the activity was canceled meanwhile, so a decision never lands without the summary it points to. `post_pull_request_comment` now rejects a missing or blank body for every provider. A refused decision, for example when the bot reviews its own pull request, is logged to the activity and the review still completes.
- Follow up reviews now also call `evaluate_pull_request`, guided by `FOLLOW_UP_EVALUATION_RULE`, so a later push can turn a request for changes into an approval. The verdict covers the whole pull request, and Main Issues from earlier Proval reviews that are still open are restated briefly in the summary so later reviews keep seeing them. The thumbs up reaction stays limited to first reviews.

GitHub and GitLab behavior is unchanged.

This change is not tracked upstream to our knowledge. Preserve it when syncing with upstream. If upstream adds its own approval policy for Forgejo, merge it into `submitPullRequestReviewDecision` instead of keeping two paths.
