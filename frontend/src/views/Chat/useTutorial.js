import { ref } from "vue";

export function useTutorial() {
  const tutorialConfig = ref([
    {
      target: "inner-editor-area",
      position: "center",
      title: "Welcome to Chat",
      content: "This is where you can interact with the AI assistant. Let's walk through the main features.",
      buttonText: "Start Walkthrough",
    },
    {
      target: "#model-selector",
      position: "top",
      title: "Choose AI Model",
      content: "Select the AI model you want to chat with. Different models have different capabilities.",
    },
    {
      target: "chat-input",
      position: "top",
      title: "Chat Input",
      content: "Type your messages here to interact with the AI assistant.",
    },
    {
      target: ".generate",
      position: "left",
      title: "Send Message",
      content: "Click this button or press Enter to send your message to the AI.",
    },
    {
      target: ".content-actions",
      position: "left",
      title: "Content Actions",
      content: "More content actions (Copy, Share, Save, etc) will show up here when your content has been generated.",
      buttonText: "Finish Walkthrough",
      waitForVisible: true
    }
  ]);

  const startTutorial = ref(false);

  const onTutorialClose = () => {
    startTutorial.value = false;
    // You can add additional logic here, such as setting a flag in localStorage
    // to remember that the user has seen or closed the tutorial
  };

  return {
    tutorialConfig,
    startTutorial,
    onTutorialClose,
  };
}