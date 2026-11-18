import fetchApi from "$lib/utils";
import type { ModelProviderResponse, RepositoryResponse } from "@proval/types";
import type { PageLoad } from "./$types";

export const ssr = false;

export const load: PageLoad = async () => {
    const [repositoryResponse, modelListResponse] = await Promise.all([
        fetchApi("/repository"),
        fetchApi("/model-provider"),
    ]);
    const repositoryList: RepositoryResponse[] = repositoryResponse.ok ? await repositoryResponse.json() : [];
    const modelList: ModelProviderResponse[] = modelListResponse.ok ? await modelListResponse.json() : [];
    return { repositoryList, modelList };
};
