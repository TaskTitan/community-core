import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import SharedResponseArea from "./ResponseArea.vue";
import { createRouter, createWebHistory } from "vue-router";

// Mock the vue-router
vi.mock("vue-router", () => ({
  useRoute: vi.fn(() => ({
    path: "/tool-forge",
  })),
  createRouter: vi.fn(),
  createWebHistory: vi.fn(),
}));

describe("SharedResponseArea", () => {
  let wrapper;

  beforeEach(() => {
    // Mock DOM elements and methods
    document.body.innerHTML = `
      <editor-area>
        <inner-editor-area id="response-area"></inner-editor-area>
      </editor-area>
    `;

    // Mock addEventListener
    Element.prototype.addEventListener = vi.fn();

    // Create a mock router
    const router = {
      install: vi.fn(),
    };

    // Mount the component
    wrapper = mount(SharedResponseArea, {
      global: {
        plugins: [router],
        stubs: {
          "inner-editor-area": true,
        },
      },
    });
  });

  it("renders correctly", () => {
    expect(wrapper.find("#response-area").exists()).toBe(true);
  });

  it("sets contenteditable attribute correctly for tool-forge route", () => {
    expect(wrapper.find("#response-area").attributes("contenteditable")).toBe(
      "true"
    );
  });

  // Add more tests as needed for the SharedResponseArea component
});
