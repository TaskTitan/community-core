import store from "../../store/state";
import {
  getContentFromQueryParam,
  addPlaceholderEventListeners,
} from "../_components/base/response";
import { useTutorial } from './useTutorial';

export default function useToolForge() {
  const { tutorialConfig, startTutorial, onTutorialClose } = useTutorial();

  const initializeToolForge = () => {
    getContentFromQueryParam();
    addPlaceholderEventListeners();
    document.body.setAttribute("data-page", "create");
    store.commit('chat/SET_PAGE', "create");

    // Start the tutorial after a delay
    setTimeout(() => {
      startTutorial.value = true;
    }, 3000);
  };

  return {
    tutorialConfig,
    startTutorial,
    onTutorialClose,
    initializeToolForge,
  };
}