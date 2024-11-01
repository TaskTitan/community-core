import { removeStreamId } from "./stream";
import { useRoute } from "vue-router";
import axios from "axios";
import { API_CONFIG } from '@/tt.config.js';

export function getContentFromQueryParam() {
  const route = useRoute();
  const contentId = route.query["content-id"];
  if (contentId) {
    importOutputById(contentId);
  }
}

export function updateContentArea(fullMarkdownContent, message) {
  const responseArea = document.getElementById("response-area");

  let converter = new showdown.Converter({
    tables: true,
    strikethrough: true,
  });
  let htmlText = converter.makeHtml(removeStreamId(fullMarkdownContent));

  // create a shadown dom element to house this first

  message.innerHTML = htmlText.trim();

  responseArea.setAttribute("contenteditable", "true");

  responseArea.querySelectorAll("pre code:not([highlighted])").forEach((el) => {
    hljs.highlightElement(el);
    el.setAttribute("highlighted", "true");
  });

  responseArea.querySelectorAll("code").forEach((el) => {
    el.setAttribute("spellcheck", "false");
  });

  // Modified MathJax handling
  if (typeof MathJax !== "undefined" && MathJax.typesetPromise) {
    MathJax.typesetPromise()
      .then(() => {
        responseArea.querySelectorAll("mjx-container").forEach((el) => {
          MathJax.typesetClear([el]);
        });
      })
      .catch((error) => {
        console.error("Error in MathJax typesetting:", error);
      });
  } else {
    console.warn("MathJax is not available or not fully loaded");
  }

  _addCopyButtonsToPre();
}

// TODO: THIS NEEDS UPDATED TO ADD PLACEHOLDER WHEN CLICK AWAY IF NO OTHER CONTENT IS PRESENT
export function addPlaceholderEventListeners() {
  document
    .querySelector("inner-editor-area")
    .addEventListener("focus", function () {
      let innerEditorArea = document.querySelector("inner-editor-area");
      let placeholder = document.getElementById("placeholder-text");

      if (placeholder) {
        placeholder.style.display = "none";

        // Set the cursor at the start of the div
        let range = document.createRange();
        let selection = window.getSelection();
        range.setStart(innerEditorArea, 0);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    });

  document
    .querySelector("inner-editor-area")
    .addEventListener("blur", function () {
      let responseArea = document.getElementById("response-area");
      let placeholder = document.getElementById("placeholder-text");

      if (placeholder) {
        // If only includes the placeholder text and no other content
        if (responseArea.innerHTML.trim() === placeholder.outerHTML.trim()) {
          placeholder.style.display = "flex";
        }
      }

      responseArea.blur();
    });
}

export async function importOutputById(outputId) {
  try {
    const response = await axios.get(
      `${API_CONFIG.BASE_URL}/api/content-outputs/${outputId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    const outputContent = response.data.content;

    if (outputContent) {
      const responseArea = document.getElementById("response-area");
      responseArea.setAttribute("data-output-id", outputId);
      responseArea.innerHTML = outputContent;
      document.getElementById("content-actions").style.display = "flex";

      // Highlight code blocks
      responseArea
        .querySelectorAll("pre code:not([highlighted])")
        .forEach((el) => {
          hljs.highlightElement(el);
          el.setAttribute("highlighted", "true");
        });

      // Set spellcheck to false for code elements
      responseArea.querySelectorAll("code").forEach((el) => {
        el.setAttribute("spellcheck", "false");
      });

      // Handle MathJax rendering
      if (typeof MathJax !== "undefined" && MathJax.typesetPromise) {
        MathJax.typesetPromise()
          .then(() => {
            responseArea.querySelectorAll("mjx-container").forEach((el) => {
              MathJax.typesetClear([el]);
            });
          })
          .catch((error) => {
            console.error("Error in MathJax typesetting:", error);
          });
      } else {
        console.warn("MathJax is not available or not fully loaded");
      }

      // Add copy buttons to pre elements
      _addCopyButtonsToPre();

      responseArea.setAttribute("contenteditable", "true");
      console.log("Output content successfully imported.");
    } else {
      console.log(`No content found for output ID: ${outputId}`);
    }
  } catch (error) {
    console.error("Error importing output:", error);
    alert(`Failed to import output with ID: ${outputId}`);
  }
}

export function addCopyEventListenerToPreButtons() {
  document.querySelectorAll("pre").forEach((pre) => {
    const button = pre.querySelector(".copy-button");
    const listenerIdentifier = "click-listener-added";
    if (button && !button.hasAttribute(listenerIdentifier)) {
      button.addEventListener("click", () => {
        const code = pre.querySelector("code").innerText;
        _copyToClipboard(code);
        button.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
          button.innerHTML = '<i class="fas fa-copy"></i>';
        }, 1000);
      });
      button.setAttribute(listenerIdentifier, "true");
    }
  });
}

function _copyToClipboard(text) {
  const dummy = document.createElement("textarea");
  document.body.appendChild(dummy);
  dummy.value = text;
  dummy.select();
  document.execCommand("copy");
  document.body.removeChild(dummy);
}

function _addCopyButtonsToPre() {
  document.querySelectorAll("pre").forEach((pre) => {
    let button = pre.querySelector(".copy-button");

    // If the button doesn't exist, create it
    if (!button) {
      button = document.createElement("button");
      button.classList.add("copy-button");
      button.innerHTML = '<i class="fas fa-copy"></i>'; // Font Awesome copy icon

      // Position the button in the top right corner of the pre element
      button.style.position = "absolute";
      button.style.top = "0";
      button.style.right = "0";
      button.style.zIndex = 2;
      button.style.padding = "16px";
      pre.style.position = "relative"; // Ensure pre is relative for absolute positioning of button

      pre.appendChild(button);
    }

    // Remove existing event listeners
    button.replaceWith(button.cloneNode(true));
    button = pre.querySelector(".copy-button");

    // Add the event listener
    button.addEventListener("click", () => {
      const code = pre.querySelector("code").innerText;
      _copyToClipboard(code);
      button.innerHTML = '<i class="fas fa-check"></i>'; // Change icon to checkmark
      setTimeout(() => {
        button.innerHTML = '<i class="fas fa-copy"></i>'; // Change back after 1s
      }, 1000);
    });
  });
}
