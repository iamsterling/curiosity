import { executeSearxngSearch, type Fetcher, type SearchOptions } from "./searxng-adapter.js";

export { SEARCH_API_ENDPOINT } from "./searxng-adapter.js";

const input = {
  type: "object",
  properties: {
    query: { type: "string", minLength: 1, maxLength: 500 },
    maxResults: { type: "integer", minimum: 1, maximum: 10 },
  },
  required: ["query"],
  additionalProperties: false,
};

export const executeWebSearch = executeSearxngSearch;

export const createSearchDefinitions = (options: SearchOptions = {}, fetcher: Fetcher = fetch) => {
  const execute = (value: unknown) => executeWebSearch(value, options, fetcher);
  return [
    {
      name: "web_search",
      description: "Search the public web and return bounded, untrusted evidence candidates with source URLs.",
      input,
      execute,
    },
    {
      name: "formerhuman_search",
      description:
        "Deprecated compatibility alias for web_search; returns the same bounded untrusted evidence candidates.",
      input,
      execute,
    },
  ];
};

export const searchDefinitions = createSearchDefinitions();
