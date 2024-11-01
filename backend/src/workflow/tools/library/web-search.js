import BaseAction from './BaseAction.js';
import axios from 'axios';

class WebSearch extends BaseAction {
  constructor() {
    super('webSearch');
  }
  async execute(params, inputData, workflowEngine) {
    this.validateParams(params);

    try {
      const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
      const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
      const { searchQuery, numResults = 5, sort = "relevance" } = params;

      let url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&num=${numResults}&q=${encodeURIComponent(
        searchQuery
      )}`;

      if (sort !== "relevance") {
        url += `&sort=${sort}`;
      }

      const response = await axios.get(url);

      if (response.data.items && Array.isArray(response.data.items)) {
        const results = response.data.items.map((item) => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
        }));

        return this.formatOutput({
          success: true,
          results,
          error: null,
        });
      } else {
        return this.formatOutput({
          success: true,
          results: [],
          error: null,
        });
      }
    } catch (error) {
      console.error("Error in WebSearch:", error);
      return this.formatOutput({
        success: false,
        results: [],
        error: error.message,
      });
    }
  }
  validateParams(params) {
    if (!params.searchQuery) {
      throw new Error('Search query is required for web search');
    }
  }
}

export default new WebSearch();