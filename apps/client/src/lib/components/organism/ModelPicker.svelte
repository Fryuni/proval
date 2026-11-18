<script lang="ts">
    import InputText from "../atom/InputText.svelte";
    import fetchApi from "$lib/utils";
    import { reasoningEffortValueList } from "@proval/types";
    import type { ModelProviderModelListResponse, ModelProviderResponse } from "@proval/types";
    import FormField from "../molecule/FormField.svelte";
    import Select from "../atom/Select.svelte";
    import Button from "../atom/Button.svelte";
    import Modal from "../atom/Modal.svelte";
    import Description from "../atom/Description.svelte";
    import FieldTitle from "../atom/FieldTitle.svelte";

    interface Props {
        modelList: ModelProviderResponse[];
        modelProviderId: string;
        modelName: string;
        reasoningEffort: string;
        providerDescription?: string;
    }

    let {
        modelList,
        modelProviderId = $bindable(),
        modelName = $bindable(),
        reasoningEffort = $bindable(),
        providerDescription = "LLM connection for this repository",
    }: Props = $props();

    const isXaiOauth = $derived(
        modelList.find((item) => item.id === Number(modelProviderId))?.authMethod === "xai_oauth",
    );
    let catalogReasoningEffortList = $state<(typeof reasoningEffortValueList)[number][] | null>(null);
    const reasoningEffortSelectOptionList = $derived([
        {
            value: "",
            label: "Default",
        },
        ...(catalogReasoningEffortList ?? reasoningEffortValueList)
            .filter((value) => !isXaiOauth || ["low", "medium", "high", "xhigh"].includes(value))
            .map((value) => ({
                value,
                label: value,
            })),
    ]);
    $effect(() => {
        if (isXaiOauth && reasoningEffort && !["low", "medium", "high", "xhigh"].includes(reasoningEffort))
            reasoningEffort = "";
    });
    $effect(() => {
        const id = modelName.trim();
        catalogReasoningEffortList = null;
        if (!id) return;
        void loadCatalogReasoningEffort(id);
    });
    let availableModels = $state<{ id: string }[]>([]);
    let isLoadingModels = $state(false);
    let modelListError = $state("");

    let previousModelProviderId = modelProviderId;

    $effect(() => {
        const id = modelProviderId;
        if (id !== previousModelProviderId) {
            if (previousModelProviderId !== "") modelName = "";
            previousModelProviderId = id;
            availableModels = [];
        }
        void loadModelList();
    });

    let modelListModalOpen = $state(false);
    let modelNameDraft = $state("");

    async function loadModelList() {
        const id = modelProviderId;
        if (!id) return;
        isLoadingModels = true;
        modelListError = "";
        try {
            const res = await fetchApi(`/model-provider/${id}/model`);
            if (id !== modelProviderId) return;
            if (res.ok) availableModels = ((await res.json()) as ModelProviderModelListResponse).models;
            else {
                const body = await res.json().catch(() => ({}));
                availableModels = [];
                modelListError = body.error ?? "Model discovery is unavailable. You can enter a model ID manually.";
            }
        } catch {
            if (id === modelProviderId) availableModels = [];
        } finally {
            if (id === modelProviderId) isLoadingModels = false;
        }
    }

    async function loadCatalogReasoningEffort(id: string) {
        try {
            const res = await fetchApi(`/catalog/model?id=${encodeURIComponent(id)}`);
            if (id !== modelName.trim() || !res.ok) return;
            const body = (await res.json()) as { reasoningEffort?: unknown };
            if (id !== modelName.trim() || !Array.isArray(body.reasoningEffort)) return;
            const effortList = body.reasoningEffort.filter(
                (value): value is (typeof reasoningEffortValueList)[number] =>
                    typeof value === "string" && (reasoningEffortValueList as readonly string[]).includes(value),
            );
            if (effortList.length > 0) catalogReasoningEffortList = effortList;
        } catch {
            return;
        }
    }

    function openModelModal() {
        if (!modelProviderId) return;
        modelNameDraft = modelName;
        modelListModalOpen = true;
    }

    function confirmModelSelection() {
        const trimmed = modelNameDraft.trim();
        if (!trimmed) return;
        modelName = trimmed;
        modelListModalOpen = false;
    }

    function selectModelFromList(id: string) {
        modelName = id;
        modelListModalOpen = false;
    }

    const filteredAvailableModels = $derived.by(() => {
        const query = modelNameDraft.trim().toLowerCase();
        if (!query) return availableModels;
        return availableModels.filter((m) => m.id.toLowerCase().includes(query));
    });

    const selectClass =
        "h-10 w-full rounded-lg border border-input bg-input-background px-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50";

    const modelProviderSelectOptionList = $derived(
        modelList.map((mp) => ({
            value: mp.id.toString(),
            label: mp.label,
        })),
    );
</script>

<div>
    <Select
        label="Model Provider"
        description={providerDescription}
        bind:value={modelProviderId}
        placeholder="Select a model provider"
        options={modelProviderSelectOptionList} />
</div>
<div>
    <FormField label="Model" description="Model ID sent to the API. Click to type or choose from the provider list.">
        {#snippet children({ id })}
            <button
                type="button"
                {id}
                disabled={!modelProviderId}
                onclick={openModelModal}
                class="{selectClass} text-left {modelProviderId ? 'cursor-pointer' : ''} {modelName
                    ? 'text-foreground'
                    : 'text-muted-foreground'}">
                {modelName || "anthropic/claude-sonnet-4.6"}
            </button>
        {/snippet}
    </FormField>
</div>
<div>
    <Select
        label="Reasoning effort"
        description="Chosen value is sent to the model API. (Default sends empty)"
        bind:value={reasoningEffort}
        options={reasoningEffortSelectOptionList} />
</div>

<Modal bind:open={modelListModalOpen} class="max-w-lg">
    <div class="space-y-4">
        <FieldTitle>Select model</FieldTitle>
        <Description>Type to filter the list, or enter a custom model ID.</Description>
        <InputText
            placeholder="anthropic/claude-sonnet-4.6"
            bind:value={modelNameDraft}
            onkeydown={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    confirmModelSelection();
                }
            }} />
        {#if isLoadingModels}
            <Description>Loading models...</Description>
        {:else if availableModels.length > 0}
            <div class="h-72 overflow-y-auto rounded-xl border border-border p-1">
                {#if filteredAvailableModels.length === 0}
                    <div class="flex h-full items-center justify-center px-3">
                        <Description class="text-center">
                            No matching models. Confirm to use your custom model ID.
                        </Description>
                    </div>
                {:else}
                    <ul class="space-y-1">
                        {#each filteredAvailableModels as m (m.id)}
                            <li>
                                <button
                                    type="button"
                                    class="w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent {modelNameDraft ===
                                    m.id
                                        ? 'bg-primary/10 text-foreground'
                                        : 'text-foreground'}"
                                    onclick={() => selectModelFromList(m.id)}>
                                    {m.id}
                                </button>
                            </li>
                        {/each}
                    </ul>
                {/if}
            </div>
        {:else}
            <Description>{modelListError || "No models were returned by this provider."}</Description>
        {/if}
        <div class="flex justify-end gap-3 pt-1">
            <Button text type="button" onclick={() => (modelListModalOpen = false)}>Cancel</Button>
            <Button primary type="button" onclick={confirmModelSelection}>Confirm</Button>
        </div>
    </div>
</Modal>
