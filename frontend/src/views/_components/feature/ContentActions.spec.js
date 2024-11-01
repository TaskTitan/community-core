import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import SharedContentActions from "./ContentActions.vue";
import axios from "axios";
import { API_CONFIG } from '@/tt.config.js';

// Mock axios
vi.mock("axios");

// Mock the vue-router
vi.mock("vue-router", () => ({
  useRoute: vi.fn(() => ({
    path: "/tool-forge",
  })),
}));

// Mock the store
vi.mock("@/store/state", () => ({
  default: {
    state: {
      chat: {
        messages: [],
      }
    },
  },
}));

// Mock MathJax
global.MathJax = {
  typesetPromise: vi.fn(() => Promise.resolve()),
};

// Mock navigator.clipboard
global.navigator = {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
};

describe("SharedContentActions", () => {
  let wrapper;

  beforeEach(() => {
    // Setup fake timers
    vi.useFakeTimers();

    // Mock DOM elements and methods
    document.body.innerHTML = `
      <div id="response-area" data-output-id="test-id">Some test content</div>
      <div id="content-actions" style="display: none;"></div>
    `;

    // Mock global methods
    global.alert = vi.fn();
    global.confirm = vi.fn(() => true);
    global.prompt = vi.fn(() => "test-id");

    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn(() =>
          JSON.stringify({ "test-id": "Some test content" })
        ),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });

    // Mock document.execCommand to return true by default
    document.execCommand = vi.fn(() => true);

    // Mock html2canvas and jspdf
    global.html2canvas = vi.fn(() =>
      Promise.resolve({ width: 100, height: 100 })
    );
    global.jspdf = {
      jsPDF: vi.fn(() => ({ addImage: vi.fn(), save: vi.fn() })),
    };

    // Mount the component
    wrapper = mount(SharedContentActions, {
      global: {
        mocks: {
          $route: { path: "/tool-forge" },
        },
      },
    });

    // SUPPRESS TEST LOGS
    console.log = vi.fn();
  });

  afterEach(() => {
    // Clean up fake timers
    vi.useRealTimers();
  });

  it("renders correctly", () => {
    expect(wrapper.find(".content-actions-wrapper").exists()).toBe(true);
  });

  it("copies output to clipboard when copy button is clicked", async () => {
    await wrapper.find('button[title="Copy"]').trigger("click");
    expect(document.execCommand).toHaveBeenCalledWith("copy");
    expect(global.alert).toHaveBeenCalledWith("Content copied to clipboard!");
  });

  it("shows error message when copy fails", async () => {
    document.execCommand = vi.fn(() => false);
    await wrapper.find('button[title="Copy"]').trigger("click");
    expect(document.execCommand).toHaveBeenCalledWith("copy");
    expect(global.alert).toHaveBeenCalledWith("Unable to copy!");
  });

  it("clears response area when clear button is clicked", async () => {
    await wrapper.find('button[title="Clear Content"]').trigger("click");
    expect(document.getElementById("response-area").innerHTML).toBe("");
    expect(document.getElementById("content-actions").style.display).toBe(
      "none"
    );
  });

  it('deletes output when delete button is clicked and confirmed', async () => {
    // Mock confirm to return true (user confirms deletion)
    global.confirm = vi.fn(() => true);
  
    // Mock axios.delete to resolve successfully
    axios.delete.mockResolvedValue({ data: { message: "Output deleted successfully" } });
  
    const deleteButton = wrapper.find('button[title="Delete Content"]');
    expect(deleteButton.exists()).toBe(true);
  
    // Trigger the delete button click
    await deleteButton.trigger('click');
  
    // Wait for any promises to resolve
    await wrapper.vm.$nextTick();
  
    // Check if confirm was called
    expect(global.confirm).toHaveBeenCalled();
  
    // Check if axios.delete was called with the correct URL
    expect(axios.delete).toHaveBeenCalledWith(`${API_CONFIG.BASE_URL}/api/content-outputs/test-id`);
  
    // Check if alert was called with the success message
    expect(global.alert).toHaveBeenCalledWith('Output deleted successfully.');
  
    // Check if the response area is cleared
    expect(document.getElementById('response-area').innerHTML).toBe('');
  });

  it('saves output when save button is clicked', async () => {
    // Mock confirm to return true (user wants to make content shareable)
    global.confirm = vi.fn(() => true);
  
    // Mock axios.put to resolve successfully (since we're updating an existing output)
    axios.put.mockResolvedValue({ 
      data: { 
        id: 'new-test-id', 
        message: "Content output updated successfully" 
      } 
    });
  
    const saveButton = wrapper.find('button[title="Save"]');
    expect(saveButton.exists()).toBe(true);
  
    await saveButton.trigger('click');
  
    // Wait for any promises to resolve
    await wrapper.vm.$nextTick();
  
    // Check if confirm was called
    expect(global.confirm).toHaveBeenCalled();
  
    // Check if axios.put was called with the correct URL and data
    expect(axios.put).toHaveBeenCalledWith(
      `${API_CONFIG.REMOTE_URL}/api/content-outputs/test-id`,
      {
        content: "Some test content",
        id: "test-id",
        isShareable: true,
        toolId: null,
        workflowId: null,
      }
    );
  
    // Check if alert was called with the success message
    expect(global.alert).toHaveBeenCalledWith('Output updated successfully!');
  
    // Check if the response area's data-output-id was updated
    expect(document.getElementById('response-area').getAttribute('data-output-id')).toBe('new-test-id');
  });

  it('prompts for output ID when import button is clicked', async () => {
    global.prompt = vi.fn(() => 'test-id');
  
    // Mock axios.get to resolve successfully
    axios.get.mockResolvedValue({
      data: {
        content: 'Imported content',
        workflow_id: 'workflow-id',
        tool_id: 'tool-id'
      }
    });
  
    const importButton = wrapper.find('button[title="Import"]');
    expect(importButton.exists()).toBe(true);
  
    await importButton.trigger('click');
  
    // Wait for any promises to resolve
    await wrapper.vm.$nextTick();
  
    expect(global.prompt).toHaveBeenCalledWith('Please enter the output ID you wish to import:');
    expect(axios.get).toHaveBeenCalledWith(`${API_CONFIG.REMOTE_URL}/api/content-outputs/test-id`);
    expect(document.getElementById('response-area').innerHTML).toBe('Imported content');
  });
});