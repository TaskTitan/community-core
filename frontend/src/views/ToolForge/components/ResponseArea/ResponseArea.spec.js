import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import ResponseArea from "./ResponseArea.vue";
import SharedResponseArea from "@/views/_components/feature/ResponseArea.vue";
import { createRouter, createWebHistory } from "vue-router";

// Mock the vue-router
vi.mock("vue-router", () => ({
  useRoute: vi.fn(() => ({
    path: "/tool-forge",
  })),
  createRouter: vi.fn(),
  createWebHistory: vi.fn(),
}));

describe("ToolForge ResponseArea", () => {
  beforeEach(() => {
    // Mock DOM elements and methods
    document.body.innerHTML = `
      <editor-area>
        <inner-editor-area id="response-area"></inner-editor-area>
      </editor-area>
    `;

    // Mock addEventListener
    Element.prototype.addEventListener = vi.fn();
  });

  it("renders SharedResponseArea component", () => {
    // Create a mock router
    const router = {
      install: vi.fn(),
    };

    // Mount the component with the router
    const wrapper = mount(ResponseArea, {
      global: {
        plugins: [router],
        stubs: {
          "inner-editor-area": true, // Stub the inner-editor-area component
        },
      },
    });

    expect(wrapper.findComponent(SharedResponseArea).exists()).toBe(true);
  });
});
