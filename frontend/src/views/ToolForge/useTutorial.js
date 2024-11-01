import { ref } from "vue";

export function useTutorial() {
  const tutorialConfig = ref([
    {
      target: "template-fields",
      position: "right",
      title: "Welcome to Tool Forge",
      content:
        "Create, test, and share powerful custom Tool Templates to use within Agent Workflows.",
      buttonText: "Start Walkthrough",
    },
    {
      target: "#template-name",
      position: "right",
      title: "Name Your Tool",
      content: `Give your new Tool Template a name (e.g. Tweet Generator, Document Summarizer, etc)`,
      // autoProgress: 5000,
    },
    {
      target: "#template-instructions",
      position: "right",
      title: "Add Instructions",
      content:
        "Give your new Tool Template detailed instructions (e.g. Generate a tweet based on the topic provided)",
      // autoProgress: 5000,
    },
    {
      target: "#icon-selector",
      position: "right",
      title: "Choose an Icon",
      content: "Pick the icon to use for this Tool",
      // autoProgress: 5000,
    },
    {
      target: "#model-selector",
      position: "right",
      title: "Choose AI Model",
      content:
        "Pick the Titan AI™ model to use for this Tool (e.g. Fast Thinking for easy tasks, Slow Thinking for hard tasks)",
      // autoProgress: 5000,
    },
    {
      target: "#add-new-field",
      position: "right",
      title: "Add New Fields (Optional)",
      content:
        "Add optional fields as needed to give Titan AI™ more context (e.g. Examples, Code, Documents, etc)",
      // autoProgress: 5000,
    },
    {
      target: "#generate",
      position: "top",
      title: "Generate Test",
      content:
        "When you are ready to test the outputs of your new Tool Template, click generate!",
      // buttonText: 'Finish',
      // hideButton: true,
      // autoProgress: 5000,
    },
    {
      target: "#save-template",
      position: "right",
      title: "Save Your Tool Template",
      content: `When your Tool's output meets your requirements, save it as a Tool Template to reuse later.`,
      // buttonText: 'Finish',
      // hideButton: true,
      // autoProgress: 5000,
    },
    {
      target: ".custom-select",
      position: "right",
      title: "Select Saved Templates",
      content:
        "Build up your library of useful Tools for your Agents to use and deploy as needed.",
      // buttonText: 'Finish',
      // hideButton: true,
      // autoProgress: 5000,
    },
    {
      target: "#magic-template",
      position: "right",
      title: "✧✧ The Magic Button ✧✧",
      content:
        "Describe your task and Titan AI™ will generate a Tool Template for you automatically.",
      buttonText: "Finish Walkthrough",
      // hideButton: true,
      // autoProgress: 5000,
    },
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
