# Change the model of many repositories at once

Teams with dozens of repositories had to open each repository settings page to switch to a newly released model. We added a way to update the model provider, model and reasoning effort of many repositories in one step.

The change has three parts.

- `PATCH /api/repository/model` takes `repositoryIdList`, `modelProviderId`, `modelName` and `reasoningEffort` and applies them to every listed repository in one update. API tokens need the `repository:write` scope to call it.
- A new dashboard page at `/repository/model`, opened with the Change Model button on the repository list, lets users pick the model and tick the repositories to update.
- The model provider, model and reasoning effort fields moved out of `RepositoryForm.svelte` into a shared `ModelPicker.svelte` so the repository form and the new page use the same picker.

This change is not tracked upstream to our knowledge. Preserve it when syncing with upstream. If upstream changes `RepositoryForm.svelte` model fields, carry those changes into `ModelPicker.svelte` instead.
