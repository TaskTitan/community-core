import { ref } from "vue";

export function useTutorial() {
  const tutorialConfig = ref([
    {
      target: "main-area",
      position: "center",
      title: "Welcome to Workflow Designer",
      content:
        "Create, test, and share powerful Workflows for your Agents to use to perform complex sequences of tasks.",
      buttonText: "Start Walkthrough",
    },
    {
      target: "#sidebar",
      position: "right",
      title: "Combine Nodes to build Workflows",
      content:
        "Choose Nodes from the Node Library and drop them onto the canvas to design your Workflows.",
      buttonText: "Next",
      // hideButton: true,
      // autoProgress: 5000,
    },
    {
      target: "#sidebar-triggers",
      position: "right",
      title: "Start with a Trigger Node",
      content: "Start your Workflow with a Trigger Node.",
      buttonText: "Next",
      // hideButton: true,
      // autoProgress: 5000,
    },
    {
      target: "#sidebar-actions",
      position: "right",
      title: "Add Action Nodes",
      content: "Combine Action Nodes to enhance your Workflow.",
      buttonText: "Next",
      // hideButton: true,
      // autoProgress: 5000,
    },
    {
      target: "#sidebar-controls",
      position: "right",
      title: "Manage flows with Control Nodes",
      content:
        "Direct complex conditional flows with Control type Nodes like timers, delays, or switches.",
      buttonText: "Next",
      // hideButton: true,
      // autoProgress: 5000,
    },
    {
      target: "#sidebar-utilities",
      position: "right",
      title: "Common Utility Nodes",
      content:
        "Perform common tasks with Utility Nodes like text labels, data conversion, or code running.",
      buttonText: "Next",
      // hideButton: true,
      // autoProgress: 5000,
    },
    // {
    //   target: "sidebar-custom",
    //   position: "right",
    //   title: "Custom Tools",
    //   content: "Use Custom Tool Nodes crafted from the Tool Forge.",
    //   buttonText: "Next",
    //   // hideButton: true,
    //   // autoProgress: 5000,
    // },
    {
      target: "#workflow-magic-button",
      position: "bottom",
      title: "✧✧ The Magic Button ✧✧",
      content:
        "Describe your Workflow and Titan AI™ will generate it for you automatically.",
      buttonText: "Next",
      // hideButton: true,
      // autoProgress: 5000,
    },
    {
      target: "#workflow-engine-toggle",
      position: "bottom",
      title: "Run your Workflow",
      content:
        "Once your Nodes are added and connected, press play to run your workflow.",
      buttonText: "Next",
      // hideButton: true,
      // autoProgress: 5000,
    },
    {
      target: "#save-workflow",
      position: "bottom",
      title: "Save your Workflow",
      content: "Once your Workflow meets your standards, save it here.",
      buttonText: "Next",
      // hideButton: true,
      // autoProgress: 5000,
    },
    // {
    //   target: "load-workflow",
    //   position: "bottom",
    //   title: "Load your Workflow",
    //   content: "Once your Workflow meets your standards, load it.",
    //   buttonText: "Next",
    //   // hideButton: true,
    //   // autoProgress: 5000,
    // },
  ]);

  const startTutorial = ref(false);

  const onTutorialClose = () => {
    startTutorial.value = false;
    // You can add any additional logic here, such as setting a flag in localStorage
    // to remember that the user has seen or closed the tutorial
  };

  return {
    tutorialConfig,
    startTutorial,
    onTutorialClose,
  };
}
