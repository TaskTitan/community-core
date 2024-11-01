<template>
  <main-area>
    <LoadingOverlay v-if="isLoading" />
    <div class="docs-container">
      <div class="sidebar">
        <div
          v-for="(docsList, type) in docsLists"
          :key="type"
          class="sidebar-section"
        >
          <h3>{{ type.charAt(0).toUpperCase() + type.slice(1) }} Docs</h3>
          <ul>
            <li v-for="doc in docsList" :key="doc.path">
              <a href="#" @click.prevent="navigateTo(doc.path)">
                {{ doc.title }}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div class="doc-content-wrapper" ref="contentWrapper">
        <div
          class="content markdown-body"
          v-html="renderedContent"
          @click="handleContentClick"
        ></div>
      </div>
    </div>
  </main-area>
</template>

<script>
import { ref, onMounted, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import showdown from "showdown";
import hljs from "highlight.js";
import { addCopyEventListenerToPreButtons } from '../_components/base/response.js';
import LoadingOverlay from "@/views/_components/utility/LoadingOverlay.vue";

// Dynamically import all markdown files from the docs directory
const markdownFiles = {
  dev: import.meta.glob("./docfiles/dev/*.md", {
    query: "?raw",
    import: "default",
  }),
  roadmap: import.meta.glob("./docfiles/roadmap/*.md", {
    query: "?raw",
    import: "default",
  }),
  legal: import.meta.glob("./docfiles/legal/*.md", {
    query: "?raw",
    import: "default",
  }),
  //   user: import.meta.glob("./docfiles/user/*.md", { query: "?raw", import: "default" }),
  // add new sections as needed
};

export default {
  name: "DocsView",
  components: {
    LoadingOverlay
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const docs = ref({});
    const docsLists = ref({});
    const renderedContent = ref("");
    const contentWrapper = ref(null);
    const isDarkMode = ref(false);
    const converter = new showdown.Converter({
      tables: true,
      tasklists: true,
      strikethrough: true,
      ghCodeBlocks: true,
      smoothLivePreview: true,
      simpleLineBreaks: true,
      parseImgDimensions: true,
      emoji: true,
    });
    const isLoading = ref(true);

    // detect if dark mode so we can change doc images
    const updateDarkMode = () => {
      isDarkMode.value = localStorage.getItem("darkMode") === "true";
    };
    // custom image rendering extension
    converter.addExtension(
      {
        type: "output",
        filter: function (text) {
          return text.replace(
            /<img([^>]*)src="([^"]*)"([^>]*)>/g,
            function (match, before, src, after) {
              const altMatch = match.match(/alt="([^"]*)"/);
              const alt = altMatch ? altMatch[1] : "";

              // Modify the src attribute if NOT in dark mode
              if (!isDarkMode.value) {
                const lastDotIndex = src.lastIndexOf(".");
                if (lastDotIndex !== -1) {
                  src =
                    src.substring(0, lastDotIndex) +
                    "-dark" +
                    src.substring(lastDotIndex);
                }
              }

              return `<img${before}src="${src}"${after} title="${alt}">`;
            }
          );
        },
      },
      "addTitleToImagesAndHandleDarkMode"
    );
    const fetchDocsList = async () => {
      for (const [type, files] of Object.entries(markdownFiles)) {
        const importedDocs = await Promise.all(
          Object.entries(files).map(async ([path, importFunc]) => {
            const content = await importFunc();
            const fileName = path.split("/").pop().replace(".md", "");
            const title = fileName
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");
            return { path: `${type}/${fileName}`, title, content };
          })
        );

        docs.value = {
          ...docs.value,
          ...Object.fromEntries(
            importedDocs.map((doc) => [doc.path, doc.content])
          ),
        };
        docsLists.value[type] = importedDocs.map(({ path, title }) => ({
          path,
          title,
        }));
      }
    };
    const fetchDoc = async (path) => {
      if (docs.value[path]) {
        updateDarkMode();
        let content = docs.value[path];
        
        // Process MathJax blocks
        content = content.replace(/```mathjax([\s\S]*?)```/g, (match, p1) => {
          // Replace $$ with display math delimiters
          p1 = p1.replace(/\$\$(.*?)\$\$/g, '<div class="math display">\\[$1\\]</div>');
          // Replace $ with inline math delimiters
          p1 = p1.replace(/\$(.*?)\$/g, '<span class="math inline">\\($1\\)</span>');
          return p1;
        });
        
        renderedContent.value = converter.makeHtml(content);
        await nextTick();
        highlightCode();
        renderMathJax();
        addCopyButtons();
        if (contentWrapper.value) {
          contentWrapper.value.scrollTop = 0;
        }
      } else {
        renderedContent.value = "<h1>Documentation not found</h1>";
      }
    };
    const navigateTo = (path) => {
      const [type, page] = path.split("/");
      router.push({ name: "DocsPage", params: { type, page } });
    };
    const handleContentClick = (event) => {
      if (event.target.tagName === "A") {
        event.preventDefault();
        const href = event.target.getAttribute("href");
        if (href.startsWith("/docs/")) {
          const [, , type, page] = href.split("/");
          router.push({ name: "DocsPage", params: { type, page } });
        } else {
          window.open(href, "_blank");
        }
      }
    };
    const highlightCode = () => {
      document.querySelectorAll("pre code").forEach((block) => {
        hljs.highlightElement(block);
      });
    };
    const renderMathJax = () => {
      if (window.MathJax) {
        window.MathJax.typesetPromise([contentWrapper.value]).then(() => {
        }).catch((err) => console.error('MathJax error:', err));
      } else {
        console.warn("MathJax not loaded");
      }
    };
    const addCopyButtons = () => {
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
      });
    
      // Add event listeners to the copy buttons
      addCopyEventListenerToPreButtons();
    };
    onMounted(async () => {
      await fetchDocsList();
      const { type, page } = route.params;
      const currentPage =
        type && page
          ? `${type}/${page}`
          : Object.values(docsLists.value)[0]?.[0]?.path;
      if (currentPage) {
        await fetchDoc(currentPage);
      }

      // event listener for dark mode changes
      window.addEventListener("storage", (event) => {
        if (event.key === "darkMode") {
          updateDarkMode();
          fetchDoc(route.params.type + "/" + route.params.page);
        }
      });

      setTimeout(() => {
        isLoading.value = false;
      }, 500);
    });
    watch(
      () => route.params,
      async (newParams) => {
        const { type, page } = newParams;
        if (type && page) {
          await fetchDoc(`${type}/${page}`);
        } else {
          const firstDocsList = Object.values(docsLists.value)[0];
          if (firstDocsList && firstDocsList.length > 0) {
            await fetchDoc(firstDocsList[0].path);
          }
        }
        if (contentWrapper.value) {
          contentWrapper.value.scrollTop = 0;
        }
      }
    );
    return {
      docsLists,
      renderedContent,
      navigateTo,
      handleContentClick,
      contentWrapper,
      isLoading
    };
  },
};
</script>

<style>
.docs-container {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  width: 100%;
  height: 100%;
  font-weight: 400;
  background: var(--color-dull-white);
}

.doc-content-wrapper {
  flex: 1;
  padding-left: 193px;
  overflow-y: auto;
  height: 100%;
}

body.dark .docs-container {
  font-weight: 300;
  background: var(--color-ultra-dark-navy);
}

.docs-container .sidebar {
  position: fixed;
  min-width: 160px;
  height: 100%;
  padding: 16px;
  border-right: 1px solid var(--color-light-navy);
}

/* FORCE BLUE ON LINKS OR IT DOES WEIRD STUFF */
.docs-container a {
  color: #0000ee;
  cursor: pointer;
}
.docs-container a:visited {
  color: #0000ee;
}

/* FORCE WHITE ON LINKS IN DARK MODE OR IT DOES WEIRD STUFF */
body.dark .docs-container a {
  color: var(--color-dull-white);
}
body.dark .docs-container a:visited {
  color: var(--color-dull-white);
}

body.dark .docs-container .sidebar {
  border-right: 1px solid var(--color-dull-navy);
}

.docs-container div.sidebar-section {
  border-bottom: 1px solid var(--color-light-navy);
}

.docs-container body.dark div.sidebar-section {
  border-bottom: 1px solid var(--color-dull-navy);
}

.docs-container .content {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-content: flex-start;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 24px;
  flex-grow: 1;
  padding: 24px 24px 48px;
  max-width: 800px;
  margin: 0 auto;
}

.docs-container pre {
  width: calc(100% - 64px);
  cursor: text;
}

/* Highlight.js overrides */
.docs-container .hljs {
  background: transparent;
}

.docs-container pre {
  padding: 16px;
}

.docs-container mjx-container {
  padding: 8px 16px;
}

.docs-container .content.markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial,
    sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
  word-wrap: break-word;
  max-width: 800px;
  min-height: 100%;
  border-left: 1px solid var(--color-light-navy);
  border-right: 1px solid var(--color-light-navy);
}

.docs-container .content.markdown-body img {
  max-width: calc(100% - 2px);
  border-radius: 8px;
  border: 1px solid var(--color-light-navy);
}

body.dark .docs-container .content.markdown-body img {
  border: 1px solid var(--color-dull-navy);
}

body.dark .docs-container .content.markdown-body {
  border-left: 1px solid var(--color-dull-navy);
  border-right: 1px solid var(--color-dull-navy);
  font-weight: 300;
}

.docs-container .content.markdown-body h1 {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-content: center;
  justify-content: flex-start;
  align-items: center;
}

.docs-container .content.markdown-body h1 img {
  margin-right: 24px;
}

.docs-container .content.markdown-body h1,
.docs-container .content.markdown-body h2 {
  width: 100%;
  padding-top: 24px;
  border-top: 1px solid var(--color-light-navy);
}

body.dark .docs-container .content.markdown-body h1,
body.dark .docs-container .content.markdown-body h2 {
  border-top: 1px solid var(--color-dull-navy);
}

/* .docs-container .content.markdown-body h3 {
  margin-bottom: 8px;
} */

.docs-container details p {
  margin-bottom: 24px;
}

.docs-container details p:last-child {
  margin-bottom: 0 !important;
}

.docs-container .content hr {
  width: 100%;
  margin: 0;
  border-bottom: none;
  border-top: 1px solid var(--color-light-navy);
  border-left: 1px solid var(--color-light-navy);
  border-right: 1px solid var(--color-light-navy);
}

body.dark .docs-container .content hr {
  border-top: 1px solid var(--color-dull-navy);
  border-left: 1px solid var(--color-dull-navy);
  border-right: 1px solid var(--color-dull-navy);
}

.docs-container .content.markdown-body ul,
.docs-container .content.markdown-body ol {
  padding-left: 2em;
}

.docs-container .content.markdown-body ul ul,
.docs-container .content.markdown-body ul ol,
.docs-container .content.markdown-body ol ol,
.docs-container .content.markdown-body ol ul {
  margin-top: 0;
  margin-bottom: 0;
}

.docs-container .content.markdown-body li {
  word-wrap: break-all;
}

.docs-container .content.markdown-body li p {
  margin-bottom: 16px;
}

.docs-container .content.markdown-body li + li {
  margin-top: 0.25em;
}

.docs-container .content.markdown-body p:empty {
  display: none;
}

.docs-container ul {
  list-style: disc;
}

.docs-container ol {
  list-style: decimal;
}

.docs-container .sidebar-section {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-content: flex-start;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 16px;
  padding: 16px 0;
}

.docs-container .sidebar-section:first-child {
  padding-top: 0;
}

.docs-container .sidebar-section ul {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-content: flex-start;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 8px;
}

.docs-container .sidebar-section h3 {
  line-height: 100%;
}

.docs-container .sidebar ol,
.docs-container .sidebar ul {
  list-style: none;
  font-weight: 400;
}

body.dark .docs-container .sidebar ol,
body.dark .docs-container .sidebar ul {
  list-style: none;
  font-weight: 300;
}

.docs-container .content.markdown-body a {
    color: var(--color-pink) !important;
}

body.dark .docs-container .content.markdown-body a {
    color: var(--color-green) !important;
}

.docs-container p code,
.docs-container li code {
    font-weight: 600;
}

.docs-container summary:hover {
    cursor: pointer;
}
</style>
