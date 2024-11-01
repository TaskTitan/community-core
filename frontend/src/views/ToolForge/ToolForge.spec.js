import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import ToolForge from "./ToolForge.vue";

// Mock all external components and composables
vi.mock("@/views/_components/feature/ContentActions.vue", () => ({
  default: { template: '<div class="content-actions"></div>' },
}));
vi.mock("@/views/_components/feature/ResponseArea.vue", () => ({
  default: { template: '<div class="response-area"></div>' },
}));
vi.mock("./components/ToolPanel/ToolPanel.vue", () => ({
  default: { template: '<div class="tool-panel"></div>' },
}));
vi.mock("@/views/_components/utility/PopupTutorial.vue", () => ({
  default: {
    template: '<div class="popup-tutorial"></div>',
    props: ["config", "startTutorial"],
  },
}));

const mockUseToolForge = {
  tutorialConfig: [],
  startTutorial: false,
  onTutorialClose: vi.fn(),
  initializeToolForge: vi.fn(),
};

vi.mock("./useToolForge", () => ({
  default: vi.fn(() => mockUseToolForge),
}));

describe("ToolForge", () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(ToolForge, {
      global: {
        stubs: {
          "main-area": {
            template: '<div class="main-area"><slot></slot></div>',
          },
          "editor-area": {
            template: '<div class="editor-area"><slot></slot></div>',
          },
        },
      },
    });
  });

  it("renders correctly", () => {
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find(".main-area").exists()).toBe(true);
    expect(wrapper.find(".tool-panel").exists()).toBe(true);
    expect(wrapper.find(".editor-area").exists()).toBe(true);
    expect(wrapper.find(".response-area").exists()).toBe(true);
    expect(wrapper.find(".content-actions").exists()).toBe(true);
    expect(wrapper.find(".popup-tutorial").exists()).toBe(true);
  });

  it("calls initializeToolForge on mount", () => {
    expect(mockUseToolForge.initializeToolForge).toHaveBeenCalled();
  });

  it("passes correct props to PopupTutorial", () => {
    const popupTutorial = wrapper.findComponent(".popup-tutorial");
    expect(popupTutorial.props("config")).toEqual([]);
    expect(popupTutorial.props("startTutorial")).toBe(false);
  });

  it("emits close event when PopupTutorial is closed", async () => {
    const popupTutorial = wrapper.findComponent(".popup-tutorial");
    await popupTutorial.vm.$emit("close");
    expect(mockUseToolForge.onTutorialClose).toHaveBeenCalled();
  });
});
