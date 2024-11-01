import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import ContentActions from "./ContentActions.vue";
import SharedContentActions from "@/views/_components/feature/ContentActions.vue";
import { createRouter, createWebHistory } from "vue-router";

// Mock the vue-router
vi.mock("vue-router", () => ({
  useRoute: vi.fn(() => ({
    path: "/tool-forge",
  })),
  createRouter: vi.fn(),
  createWebHistory: vi.fn(),
}));

describe("ToolForge ContentActions", () => {
  beforeEach(() => {
    // Mock DOM elements and methods
    document.body.innerHTML = `
      <div id="response-area" data-output-id="test-id"></div>
      <div id="content-actions"></div>
    `;

    // Mock global methods
    global.alert = vi.fn();
    global.confirm = vi.fn(() => true);
    global.prompt = vi.fn(() => "test-id");

    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(() => null),
      },
      writable: true,
    });

    // Mock document.execCommand
    document.execCommand = vi.fn();

    // Mock html2canvas and jspdf if they are used
    global.html2canvas = vi.fn(() =>
      Promise.resolve({ width: 100, height: 100 })
    );
    global.jspdf = {
      jsPDF: vi.fn(() => ({ addImage: vi.fn(), save: vi.fn() })),
    };

    console.log = vi.fn();
  });

  it("renders SharedContentActions component", () => {
    // Create a mock router
    const router = {
      install: vi.fn(),
    };
    // Mount the component with the router
    const wrapper = mount(ContentActions, {
      global: {
        plugins: [router],
        stubs: {
          // Add any components that need to be stubbed
        },
      },
    });

    expect(wrapper.findComponent(SharedContentActions).exists()).toBe(true);
  });
});
