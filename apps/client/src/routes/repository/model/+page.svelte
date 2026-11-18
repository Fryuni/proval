<script lang="ts">
    import { goto } from "$app/navigation";
    import DefaultLayout from "$lib/components/layout/DefaultLayout.svelte";
    import Card from "$lib/components/layout/Card.svelte";
    import Button from "$lib/components/atom/Button.svelte";
    import Description from "$lib/components/atom/Description.svelte";
    import GitProviderIcon from "$lib/components/atom/GitProviderIcon.svelte";
    import ModelPicker from "$lib/components/organism/ModelPicker.svelte";
    import { openAlert, openConfirm } from "$lib/store/modal";
    import fetchApi from "$lib/utils";
    import type { ReasoningEffort, RepositoryModelUpdateInput } from "@proval/types";
    import type { PageProps } from "./$types";

    const { data }: PageProps = $props();

    let modelProviderId = $state("");
    let modelName = $state("");
    let reasoningEffort = $state("");
    let selectedIdList = $state<number[]>([]);
    let isSaving = $state(false);

    const isAllSelected = $derived(
        data.repositoryList.length > 0 && selectedIdList.length === data.repositoryList.length,
    );
    const providerLabelById = $derived(new Map(data.modelList.map((item) => [item.id, item.label])));

    function toggleRepository(id: number) {
        selectedIdList = selectedIdList.includes(id)
            ? selectedIdList.filter((item) => item !== id)
            : [...selectedIdList, id];
    }

    function toggleAll() {
        selectedIdList = isAllSelected ? [] : data.repositoryList.map((repository) => repository.id);
    }

    async function handleSubmit(e: Event) {
        e.preventDefault();
        if (selectedIdList.length === 0) {
            await openAlert("Select at least one repository");
            return;
        }
        if (!modelProviderId) {
            await openAlert("Model provider is required");
            return;
        }
        if (!modelName.trim()) {
            await openAlert("Model is required");
            return;
        }
        const count = selectedIdList.length;
        const confirmed = await openConfirm(
            `Use ${modelName.trim()} for ${count} ${count === 1 ? "repository" : "repositories"}?`,
        );
        if (!confirmed) return;

        const body: RepositoryModelUpdateInput = {
            repositoryIdList: selectedIdList,
            modelProviderId: Number(modelProviderId),
            modelName: modelName.trim(),
            reasoningEffort: reasoningEffort === "" ? null : (reasoningEffort as NonNullable<ReasoningEffort>),
        };
        isSaving = true;
        try {
            const response = await fetchApi("/repository/model", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(result.error ?? "Failed to update repositories");
            }
            await openAlert(
                `Updated ${result.updatedCount} ${result.updatedCount === 1 ? "repository" : "repositories"}`,
            );
            goto("/repository");
        } catch (error) {
            await openAlert(error instanceof Error ? error.message : "Failed to update repositories");
        } finally {
            isSaving = false;
        }
    }
</script>

<DefaultLayout narrow title="Change Model">
    <form onsubmit={handleSubmit} class="space-y-8">
        <Card title="Model" spaceY>
            <ModelPicker
                modelList={data.modelList}
                bind:modelProviderId
                bind:modelName
                bind:reasoningEffort
                providerDescription="LLM connection for the selected repositories" />
        </Card>
        <Card title="Repository">
            {#if data.repositoryList.length === 0}
                <Description>No repositories connected yet.</Description>
            {:else}
                <label class="flex items-center gap-3 border-b border-border pb-3 text-sm text-foreground">
                    <input
                        type="checkbox"
                        class="rounded border-border"
                        checked={isAllSelected}
                        indeterminate={selectedIdList.length > 0 && !isAllSelected}
                        onchange={toggleAll} />
                    <span>Select all</span>
                    <span class="ml-auto text-xs text-muted-foreground">{selectedIdList.length} selected</span>
                </label>
                <ul class="mt-2 space-y-1">
                    {#each data.repositoryList as repository (repository.id)}
                        {@const providerLabel =
                            repository.modelProviderId != null
                                ? providerLabelById.get(repository.modelProviderId)
                                : null}
                        <li>
                            <label class="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-2 hover:bg-accent">
                                <input
                                    type="checkbox"
                                    class="rounded border-border"
                                    checked={selectedIdList.includes(repository.id)}
                                    onchange={() => toggleRepository(repository.id)} />
                                <GitProviderIcon provider={repository.provider} />
                                <div class="flex min-w-0 flex-col">
                                    <span class="truncate text-sm text-foreground">{repository.path}</span>
                                    <span class="truncate text-xs text-muted-foreground">
                                        {[providerLabel, repository.modelName.trim() || "No model"]
                                            .filter(Boolean)
                                            .join(" · ")}
                                    </span>
                                </div>
                            </label>
                        </li>
                    {/each}
                </ul>
            {/if}
        </Card>
        <div class="flex items-center gap-3">
            <Button primary type="submit" disabled={isSaving}>Save</Button>
            <Button text type="button" onclick={() => goto("/repository")}>Cancel</Button>
        </div>
    </form>
</DefaultLayout>
