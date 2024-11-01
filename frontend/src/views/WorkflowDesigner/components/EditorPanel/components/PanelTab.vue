<template>
  <div class="outer-tab-wrapper">
    <div class="inner-wrapper" v-if="activeTab === 'parameters'">
      <!-- Node content -->
      <template v-if="nodeContent">
        <!-- NODE INFORMATION -->
        <!-- NODE NAME -->
        <div class="form-group">
          <label>Name</label>
          <input
            type="text"
            :value="nodeContent.text"
            @input="updateNodeName"
            spellcheck="false"
            @keydown="handleKeyDown($event, 'name')"
          />
        </div>
        <!-- NODE ID & TYPE-->
        <div class="form-row">
          <div class="form-group stretch">
            <label>Id:</label>
            <div class="right-side">
              <p
                class="static-value"
                @click="copyText(getNodeNameById(nodeContent.id))"
                title="Click to copy"
              >
                {{ getNodeNameById(nodeContent.id) }}
              </p>
            </div>
          </div>
          <div class="form-divider"></div>
          <div class="form-group stretch">
            <label>Type:</label>
            <div class="right-side">
              <SvgIcon
                v-if="nodeContent.icon && nodeContent.type !== 'label'"
                :name="nodeContent.icon"
                class="node-icon"
              />
              <p class="node-type">{{ nodeContent.type }}</p>
            </div>
          </div>
        </div>

        <div class="hr"></div>

        <!-- NODE DESCRIPTION -->
        <div class="form-group">
          <p>{{ nodeContent.description }}</p>
        </div>

        <div class="hr"></div>

        <!-- NODE PARAMETERS -->
        <div
          class="parameter-wrapper"
          v-if="nodeParameters && Object.keys(nodeParameters).length > 0"
        >
          <h3 class="label">Input Parameters</h3>
          <div class="form-row wrap">
            <template v-for="(param, key) in nodeParameters" :key="key">
              <div
                :class="['form-group', getInputSize(key, param)]"
                v-if="shouldShowParameter(key, param)"
              >
                <label>
                  {{ formatParameterLabel(key) }}
                  <i
                    v-if="!isCustomTool || key === 'instructions'"
                    class="fas fa-info-circle info-icon"
                    :title="getInfoTitle(key, param)"
                  ></i>
                </label>
                <!-- IF CUSTOM FIELD IS INSTRUCTIONS -->
                <template v-if="isCustomTool && key === 'instructions'">
                  <textarea
                    :value="nodeContent.parameters[key]"
                    @input="updateParameter(key, $event.target.value)"
                    @focus="onTextareaFocus"
                    @blur="onTextareaBlur"
                    spellcheck="false"
                  ></textarea>
                </template>
                <!-- IF CUSTOM FIELD IS PROVIDER OR MODEL -->
                <template
                  v-else-if="
                    isCustomTool && (key === 'provider' || key === 'model')
                  "
                >
                  <select
                    :value="getCustomParameterValue(key)"
                    @input="updateCustomParameter(key, $event.target.value)"
                  >
                    <option value="">Select {{ key }}</option>
                    <option
                      v-for="option in getOptionsForParameter(key)"
                      :key="option"
                      :value="option"
                    >
                      {{ option }}
                    </option>
                  </select>
                </template>
                <!-- IF CUSTOM FIELD IS INPUT -->
                <template v-else-if="isCustomTool && param.type === 'text'">
                  <input
                    :type="param.inputType || 'text'"
                    :value="getCustomParameterValue(key)"
                    @input="updateCustomParameter(key, $event.target.value)"
                    spellcheck="false"
                  />
                </template>
                <!-- IF CUSTOM FIELD IS TEXTAREA -->
                <template v-else-if="isCustomTool && param.type === 'textarea'">
                  <textarea
                    :value="getCustomParameterValue(key)"
                    @input="updateCustomParameter(key, $event.target.value)"
                    @focus="onTextareaFocus"
                    @blur="onTextareaBlur"
                    spellcheck="false"
                  ></textarea>
                </template>
                <!-- IF CUSTOM FIELD IS SELECT -->
                <template v-else-if="isCustomTool && param.type === 'select'">
                  <select
                    :value="getCustomParameterValue(key)"
                    @input="updateCustomParameter(key, $event.target.value)"
                  >
                    <option
                      v-for="option in param.options"
                      :key="option"
                      :value="option"
                    >
                      {{ option }}
                    </option>
                  </select>
                </template>
                <!-- IF CUSTOM FIELD IS A FILE -->
                <template
                  v-else-if="
                    isCustomTool &&
                    (param.inputType || param.fieldType || param.type) ===
                      'file'
                  "
                >
                  <div class="file-input-wrapper">
                    <div class="file-upload-header">
                      <label class="custom-file-upload">
                        <input
                          type="file"
                          :accept="param.accept"
                          @change="handleFileUpload($event, key)"
                          style="display: none"
                        />
                        <span class="file-upload-button">
                          <i class="fas fa-upload"></i>
                          Upload File
                        </span>
                      </label>
                      <div v-if="getFileName(key)" class="file-text-display">
                        <span>Uploaded File: </span>{{ getFileName(key) }}
                      </div>
                    </div>
                    <div v-if="getFileContent(key)" class="file-content">
                      {{ getFileContent(key) }}
                    </div>
                  </div>
                </template>
                <!-- IF FIELD IS SELECT -->
                <template v-else-if="param.inputType === 'select'">
                  <select
                    :value="getParameterValue(key)"
                    @input="updateParameter(key, $event.target.value)"
                  >
                    <option value="">
                      Select {{ formatParameterLabel(key) }}
                    </option>
                    <template v-if="isAILLMOrCustomTool">
                      <option
                        v-for="option in getOptionsForParameter(key)"
                        :key="option"
                        :value="option"
                      >
                        {{ option }}
                      </option>
                    </template>
                    <template v-else>
                      <option
                        v-for="option in param.options"
                        :key="option"
                        :value="option"
                      >
                        {{ option }}
                      </option>
                    </template>
                  </select>
                </template>
                <!-- IF FIELD IS TEXTAREA -->
                <template
                  v-else-if="
                    (param.inputType || param.fieldType) === 'textarea'
                  "
                >
                  <textarea
                    :value="nodeContent.parameters[key] || param.default"
                    @input="updateParameter(key, $event.target.value)"
                    @focus="onTextareaFocus"
                    @blur="onTextareaBlur"
                    :ref="'textarea-' + key"
                    spellcheck="false"
                  ></textarea>
                </template>
                <!-- IF FIELD IS READONLY -->
                <template
                  v-else-if="(param.inputType || param.fieldType) === 'readonly'"
                >
                  <p
                    class="static-value"
                    @click="copyText(getReplacedValue(key, param.value))"
                    title="Click to copy"
                  >
                    {{ getReplacedValue(key, param.value) }}
                  </p>
                </template>
                <!-- IF FIELD IS A CODEAREA -->
                <template
                  v-else-if="
                    (param.inputType || param.fieldType) === 'codearea'
                  "
                >
                  <codemirror
                    v-model="nodeContent.parameters[key]"
                    :style="{ height: '200px' }"
                    :indent-with-tab="true"
                    :tab-size="2"
                    :extensions="codeEditorExtensions"
                    @change="updateParameter(key, $event)"
                  />
                </template>
                <!-- IF FIELD IS OBJECT -->
                <template
                  v-else-if="typeof nodeContent.parameters[key] === 'object'"
                >
                  <textarea
                    :value="getParameterValue(key)"
                    @input="updateParameter(key, $event.target.value)"
                    spellcheck="false"
                    class="code-area"
                  ></textarea>
                </template>
                <!-- IF FIELD IS NUMBER -->
                <template v-else>
                  <input
                    :type="
                      (param.inputType || param.fieldType) === 'number'
                        ? 'number'
                        : 'text'
                    "
                    :value="nodeContent.parameters[key]"
                    spellcheck="false"
                    @input="updateParameter(key, $event.target.value)"
                  />
                </template>
              </div>
            </template>
          </div>
        </div>
      </template>

      <!-- Edge content -->
      <template v-if="edgeContent">
        <div class="form-group">
          <label>If:</label>
          <input
            type="text"
            v-model="localEdgeContent.if"
            @input="updateEdgeContent"
            spellcheck="false"
          />
        </div>
        <div class="form-group">
          <label>Condition:</label>
          <select
            v-model="localEdgeContent.condition"
            @change="updateEdgeContent"
          >
            <option value="true">True</option>
            <option value="false">False</option>
            <option value="contains">Contains</option>
            <option value="not_contains">Does Not Contain</option>
            <option value="equals">Equals</option>
            <option value="not_equals">Not Equals</option>
            <option value="greater_than">Greater Than</option>
            <option value="less_than">Less Than</option>
            <option value="greater_than_or_equal">Greater Than or Equal</option>
            <option value="less_than_or_equal">Less Than or Equal</option>
            <option value="is_empty">Is Empty</option>
            <option value="is_not_empty">Is Not Empty</option>
          </select>
        </div>
        <div
          v-if="
            localEdgeContent.condition === 'greater_than' ||
            localEdgeContent.condition === 'less_than' ||
            localEdgeContent.condition === 'greater_than_or_equal' ||
            localEdgeContent.condition === 'less_than_or_equal'
          "
          class="form-group"
        >
          <label>Value:</label>
          <input
            type="text"
            v-model="localEdgeContent.value"
            @input="updateEdgeContent"
            spellcheck="false"
          />
        </div>
        <div
          v-if="
            ['equals', 'not_equals', 'contains', 'not_contains'].includes(
              localEdgeContent.condition
            )
          "
          class="form-group"
        >
          <label>Value:</label>
          <input
            type="text"
            v-model="localEdgeContent.value"
            @input="updateEdgeContent"
            spellcheck="false"
          />
        </div>
        <div class="form-group">
          <label>Max Iterations:</label>
          <input
            type="text"
            v-model="localEdgeContent.maxIterations"
            @input="updateEdgeContent"
            spellcheck="false"
            min="1"
          />
        </div>
      </template>
    </div>
    <!-- Outputs -->
    <div
      class="outputs-tab"
      v-else-if="activeTab === 'outputs' && !edgeContent"
    >
      <div class="outputs-wrapper" v-if="nodeOutputs">
        <div v-for="(output, key) in nodeOutputs" :key="key" class="form-group">
          <h4>
            {{ formatCamelCase(key) }}
          </h4>
          <div class="form-group stretch">
            <label>Description:</label>
            <p>{{ output.description }}</p>
          </div>
          <div class="form-group stretch">
            <label>Id:</label>
            <p
              class="static-value"
              @click="copyText(`{{${getNodeNameById(nodeContent.id)}.${key}}}`)"
              title="Click to copy"
            >
              {{ getNodeNameById(nodeContent.id) }}.{{ key }}
            </p>
          </div>
          <div class="form-group stretch output-value">
            <label>Value:</label>
            <p v-if="hasOutputValue(key)">
              {{ getOutputValue(key) }}
            </p>
          </div>
          <div class="hr"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SvgIcon from "@/views/_components/common/SvgIcon.vue";
import { Codemirror } from "vue-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { API_CONFIG, AI_PROVIDERS_CONFIG, IMAP_EMAIL_DOMAIN } from "@/tt.config";

export default {
  name: "PanelTab",
  components: {
    SvgIcon,
    Codemirror,
  },
  props: {
    nodeContent: Object,
    edgeContent: Object,
    activeTab: String,
    toolLibrary: Object,
    nodes: Array,
    nodeOutput: Object,
    customTools: Array,
    workflowId: {
      type: String,
      default: null,
    },
  },
  emits: ["update:nodeContent", "update:edgeContent"],
  data() {
    return {
      localEdgeContent: {
        if: "",
        condition: "true",
        value: "",
        maxIterations: 1,
      },
    };
  },
  computed: {
    nodeParameters() {
      if (this.nodeContent && this.nodeContent.type) {
        const nodeType = this.nodeContent.type;

        // First, check in toolLibrary
        for (const category in this.toolLibrary) {
          const node = this.toolLibrary[category].find(
            (n) => n.type === nodeType
          );
          if (node) {
            // For standard tools, return parameters as is
            return node.parameters || {};
          }
        }

        // If not found in toolLibrary, check in customTools
        const customTool = this.customTools.find(
          (tool) => tool.type === nodeType
        );
        if (customTool) {
          // For custom tools, set the description in the nodeContent
          if (!this.nodeContent.description) {
            this.$emit("update:nodeContent", {
              ...this.nodeContent,
              description:
                "This is a custom tool created by the user in the Tool Forge.",
            });
          }

          // For custom tools, adjust the parameters to include field type
          const adjustedParameters = {};
          for (const [key, value] of Object.entries(customTool.parameters)) {
            adjustedParameters[key] = {
              ...value,
              fieldType: value.type, // Add fieldType based on the custom tool's type
            };
          }
          return adjustedParameters;
        }
      }
      return null;
    },
    nodeOutputs() {
      if (this.nodeContent && this.nodeContent.type) {
        const nodeType = this.nodeContent.type;
        // Check in toolLibrary
        for (const category in this.toolLibrary) {
          const node = this.toolLibrary[category].find(
            (n) => n.type === nodeType
          );
          if (node) {
            return node.outputs;
          }
        }
        // Check in customTools
        const customTool = this.customTools.find(
          (tool) => tool.type === nodeType
        );
        if (customTool) {
          return customTool.outputs;
        }
      }
      return null;
    },
    isNode() {
      return this.nodeContent && !this.edgeContent;
    },
    isCustomTool() {
      return this.nodeContent && this.nodeContent.category === "custom";
    },
    codeEditorExtensions() {
      const languageExtension = this.isPythonNode ? python() : javascript();
      return [languageExtension, oneDark];
    },
    isPythonNode() {
      // Implement your logic to determine if the current node is a Python node
      return this.nodeContent?.type === "execute-python";
    },
    isAILLMOrCustomTool() {
      return (
        this.isCustomTool || this.nodeContent?.type === "generate-with-ai-llm"
      );
    },
    // I THINK THIS MAY NEED TO BE A CLOUD FEATURE? TOO MUCH REMOTE API STUFF NEEDS TO HAPPEN
    webhookUrl() {
      if (this.nodeContent && this.nodeContent.type === 'webhook-receiver' && this.workflowId) {
        return `${API_CONFIG.BASE_URL}/webhook/${this.workflowId}`; // IF USING LOCAL SERVER
        // return `${API_CONFIG.REMOTE_URL}/webhook/${this.workflowId}`; // IF USING REMOTE CLOUD SERVER
      }
      return null;
    },
  },
  mounted() {
    // Load pdf.js from CDN
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.min.js";
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js";
    };
    document.head.appendChild(script);
  },
  methods: {
    capitalizeOption(option) {
      return option
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    },
    handleFileUpload(event, key) {
      console.log("File upload triggered");
      const file = event.target.files[0];
      if (file) {
        console.log("File type:", file.type);
        console.log("File name:", file.name);
        console.log("File size:", file.size, "bytes");

        if (file.type === "application/pdf") {
          const reader = new FileReader();
          reader.onload = async (e) => {
            const typedArray = new Uint8Array(e.target.result);
            try {
              const pdf = await window.pdfjsLib.getDocument(typedArray).promise;
              let fullText = "";
              for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                  .map((item) => item.str)
                  .join(" ");
                fullText += pageText + "\n";
              }
              this.updateParameter(key, {
                filename: file.name,
                type: file.type,
                text: fullText,
              });
            } catch (error) {
              console.error("Error parsing PDF:", error);
              this.updateParameter(key, {
                filename: file.name,
                type: file.type,
                text: "Error parsing PDF. Please try a different file.",
              });
            }
          };
          reader.readAsArrayBuffer(file);
        } else {
          const reader = new FileReader();
          reader.onload = (e) => {
            const content = e.target.result;
            console.log(
              "File content (first 200 chars):",
              content.slice(0, 200)
            );
            this.updateParameter(key, {
              filename: file.name,
              type: file.type,
              text: content,
            });
          };
          reader.readAsText(file);
        }
      }
    },
    getFileName(key) {
      if (
        this.nodeContent &&
        this.nodeContent.parameters &&
        this.nodeContent.parameters[key]
      ) {
        return this.nodeContent.parameters[key].filename || "";
      }
      return "";
    },
    getFileContent(key) {
      if (
        this.nodeContent &&
        this.nodeContent.parameters &&
        this.nodeContent.parameters[key]
      ) {
        if (this.nodeContent.parameters[key].text) {
          return this.nodeContent.parameters[key].text;
        } else if (this.nodeContent.parameters[key].data) {
          return atob(this.nodeContent.parameters[key].data);
        }
      }
      return "";
    },
    updateFileContent(key, value) {
      if (this.nodeContent.parameters[key]) {
        this.nodeContent.parameters[key].text = value;
        this.$emit("update:nodeContent", { ...this.nodeContent });
        this.$nextTick(() => {
          const textarea = this.$refs["textarea-" + key];
          if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = textarea.scrollHeight - 12 + "px";
          }
        });
      }
    },
    getInfoTitle(key, param) {
      if (this.isCustomTool && key === "template-instructions") {
        return "These are the default instructions set by the creator of this custom tool in the Tool Forge.";
      }
      return param.description || "";
    },
    updateNodeContent() {
      if (this.nodeContent) {
        this.$emit("update:nodeContent", {
          ...this.nodeContent,
          text: this.nodeContent.text,
          type: this.nodeContent.type,
          description: this.nodeContent.description,
          parameters: this.nodeContent.parameters || {},
          output: this.nodeContent.output,
          error: this.nodeContent.error,
        });
      }
    },
    handleKeyDown(event, field) {
      if (event.key === "Enter") {
        event.preventDefault();
        this.updateNodeContent();
      }
    },
    updateNodeName(event) {
      if (this.nodeContent) {
        this.nodeContent.text = event.target.value;
        this.updateNodeContent();
      }
    },
    updateType(event) {
      if (this.nodeContent) {
        this.nodeContent.type = event.target.value;
        this.updateNodeContent();
      }
    },
    getInputComponent(inputType) {
      switch (inputType) {
        case "textarea":
          return "textarea";
        case "select":
          return "select";
        default:
          return "input";
      }
    },
    getInputProps(param) {
      const props = {
        type: param.inputType === "number" ? "number" : "text",
      };

      if (param.inputType === "select" && param.options) {
        props.options = param.options;
      }

      return props;
    },
    getParameterValue(key) {
      if (
        this.nodeContent &&
        this.nodeContent.parameters &&
        this.nodeContent.parameters[key] !== undefined
      ) {
        const value = this.nodeContent.parameters[key];
        if (typeof value === "object") {
          return JSON.stringify(value, null, 2);
        } else if (this.isJsonString(value)) {
          return JSON.stringify(JSON.parse(value), null, 2);
        }
        return value;
      }
      return "";
    },
    getReplacedValue(key, value) {
      if (this.nodeContent.type === 'receive-email' && key === 'emailAddress') {
        // Existing email logic
        value = value.replace('{{WORKFLOWID}}', this.workflowId || '');
        const imapUserDomain = IMAP_EMAIL_DOMAIN.BASE_DOMAIN;
        value = value.replace('{{IMAP_EMAIL_DOMAIN}}', imapUserDomain);
      } else if (this.nodeContent.type === 'webhook-listener' && key === 'webhookUrl') {
        // New webhook logic
        value = value.replace('{{REMOTE_URL}}', API_CONFIG.REMOTE_URL);
        value = value.replace('{{BASE_URL}}', API_CONFIG.BASE_URL);
        value = value.replace('{{WEBHOOK_URL}}', API_CONFIG.WEBHOOK_URL);
        value = value.replace('{{WORKFLOWID}}', this.workflowId || '');
      }
      return value;
    },
    onTextareaFocus(event) {
      const textarea = event.target;
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight - 12 + "px";
      // textarea.style.minHeight = "96px"; // Adjust this value as needed
    },
    onTextareaBlur(event) {
      const textarea = event.target;
      textarea.style.height = "auto";
      // textarea.style.minHeight = "96px"; // Adjust this value as needed
    },
    updateParameter(key, value) {
      console.log("Updating parameter:", key, value);
      if (this.nodeContent) {
        if (!this.nodeContent.parameters) {
          this.nodeContent.parameters = {};
        }
        this.nodeContent.parameters[key] = value;

        // Auto-select the first available model when the provider changes
        if (key === "provider") {
          const models = this.getOptionsForParameter("model");
          if (models.length > 0) {
            this.updateParameter("model", models[0]);
          }
        }

        this.$emit("update:nodeContent", { ...this.nodeContent });

        // Force re-computation of nodeParameters
        this.$forceUpdate();
      }
    },
    getInputType(paramType) {
      switch (paramType) {
        case "number":
        case "integer":
          return "number";
        case "boolean":
          return "checkbox";
        default:
          return "text";
      }
    },
    getOutputValue(key) {
      if (this.nodeOutput && this.nodeOutput[key] !== undefined) {
        if (typeof this.nodeOutput[key] === "object") {
          return JSON.stringify(this.nodeOutput[key], null, 2);
        }
        return this.nodeOutput[key];
      }
      return "";
    },
    updateEdgeContent() {
      this.$emit("update:edgeContent", { ...this.localEdgeContent });
    },
    formatCamelCase(str) {
      const formattedStr = str.replace(/([A-Z])/g, " $1").trim();
      return formattedStr.replace(/\b\w/g, (c) => c.toUpperCase());
    },
    async copyText(text) {
      try {
        await navigator.clipboard.writeText(text);
        alert("Content copied to clipboard");
      } catch (err) {
        console.error("Failed to copy: ", err);
      }
    },
    getNodeNameById(id) {
      if (!this.nodes) return id;
      const node = this.nodes.find((node) => node.id === id);
      if (!node) return id;
      return this.toCamelCase(node.text);
    },
    toCamelCase(str) {
      return str
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
          index === 0 ? word.toLowerCase() : word.toUpperCase()
        )
        .replace(/\s+/g, "");
    },
    convertNameToId(nameParam) {
      const [name, param] = nameParam.split(".");
      if (!this.nodes) return nameParam;
      const node = this.nodes.find(
        (node) => this.toCamelCase(node.text) === name
      );
      return node ? `${node.id}.${param}` : nameParam;
    },
    isJsonString(str) {
      try {
        JSON.parse(str);
      } catch (e) {
        return false;
      }
      return true;
    },
    hasOutputValue(key) {
      return (
        this.nodeOutput &&
        this.nodeOutput[key] !== undefined &&
        this.nodeOutput[key] !== null &&
        this.nodeOutput[key] !== ""
      );
    },
    shouldShowParameter(key, param) {
      if (!param || !param.conditional) return true;

      const { field, value } = param.conditional;
      const currentValue = this.nodeContent?.parameters?.[field];

      if (currentValue === undefined) return true;

      if (Array.isArray(value)) {
        return value.includes(currentValue);
      } else {
        return currentValue === value;
      }
    },
    formatParameterLabel(key) {
      if (key === "instructions") return "Instructions";
      return this.formatCamelCase(key);
    },
    getInputSize(key, param) {
      if (this.isCustomTool && (key === "provider" || key === "model")) {
        return "half";
      }
      return param.inputSize || "";
    },
    getOptionsForParameter(key) {
      if (key === "provider") {
        return AI_PROVIDERS_CONFIG.providers;
      } else if (key === "model") {
        const provider = this.getCustomParameterValue("provider");
        return AI_PROVIDERS_CONFIG.modelsByProvider[provider] || [];
      }
      return [];
    },
    getCustomParameterValue(key) {
      if (
        this.nodeContent &&
        this.nodeContent.parameters &&
        this.nodeContent.parameters[key]
      ) {
        const param = this.nodeContent.parameters[key];
        if (typeof param === "object" && param !== null) {
          return param.value || "";
        }
        return param || "";
      }
      return "";
    },
    updateCustomParameter(key, value) {
      if (this.nodeContent && this.nodeContent.parameters) {
        if (
          typeof this.nodeContent.parameters[key] === "object" &&
          this.nodeContent.parameters[key] !== null
        ) {
          this.nodeContent.parameters[key].value = value;
        } else {
          this.nodeContent.parameters[key] = value;
        }

        // Auto-select the first available model when the provider changes
        if (key === "provider") {
          const models = this.getOptionsForParameter("model");
          if (models.length > 0) {
            this.updateCustomParameter("model", models[0]);
          }
        }

        this.$emit("update:nodeContent", { ...this.nodeContent });

        this.$nextTick(() => {
          const textarea = this.$refs["textarea-" + key];
          if (textarea && textarea.scrollHeight > textarea.clientHeight) {
            textarea.style.height = "auto";
            textarea.style.height = textarea.scrollHeight - 12 + "px";
          }
        });
      }
    },
  },
  watch: {
    edgeContent: {
      handler(newEdgeContent) {
        this.localEdgeContent = { ...newEdgeContent };
      },
      immediate: true,
      deep: true,
    },
    "nodeContent.parameters.operation": {
      handler() {
        this.$forceUpdate();
      },
      deep: true,
    },
    customTools: {
      handler(newCustomTools) {
        console.log("Custom tools updated in PanelTab:", newCustomTools);
      },
      deep: true,
    },
  },
};
</script>

<style scoped>
.outer-tab-wrapper {
  width: 100%;
}

.inner-wrapper {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-content: flex-start;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 16px;
  width: 100%;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 0;
  width: 100%;
}

.form-group select {
  height: 32px;
  padding: 3px 3px 1px;
  font-family: "League Spartan", sans-serif;
  font-size: var(--base-font-size);
  color: var(--color-navy);
  border: 1px solid var(--color-light-navy);
  border-radius: 8px;
  background-color: var(--color-dull-white);
}

.form-group select option {
  padding: 8px 4px;
}

.form-group.stretch.output-value {
  width: 100%;
  overflow: hidden;
  justify-content: space-between;
}

.form-group.output-value label {
  width: fit-content;
  align-self: flex-start;
}

.form-group.output-value p {
  overflow: scroll;
  white-space: pre-wrap;
}

.code,
.output {
  width: 100%;
}

.right-side {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-content: center;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
}

.info-icon {
  font-size: 12px;
  margin-left: 4px;
  cursor: help;
  opacity: 0.5;
}

.right-side .info-icon {
  margin-left: 0px;
}

.parameter-wrapper,
.outputs-wrapper {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-content: flex-start;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 16px;
  width: 100%;
}

.hr {
  width: 100%;
  border-bottom: 1px solid #ddd;
}

.form-divider {
  width: 1px;
  height: 24px;
  border-right: 1px solid #ddd;
}

.form-row {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-content: center;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.form-row.wrap {
  flex-wrap: wrap;
}

.form-group.stretch {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-content: center;
  align-items: center;
  justify-content: flex-start;
}

.form-group.stretch p {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-content: center;
  align-items: center;
  justify-content: flex-start;
  text-wrap: nowrap;
}

.form-group.half {
  width: calc(50% - 8px);
}

p.static-value {
  width: fit-content;
  padding: 8px 8px 6px;
  border: 1px solid var(--color-light-navy);
  border-radius: 8px;
  line-height: 100%;
  cursor: pointer;
}

textarea.code-area {
  font-family: monospace;
  font-size: 14px;
  overflow-x: scroll;
  white-space: nowrap;
}

body.dark p.static-value {
  color: var(--color-dull-white);
  border: 1px solid var(--color-dull-navy);
}

p.static-value:hover {
  color: var(--color-pink) !important;
}

.form-group.output-value p {
  margin-top: 0;
  font-family: monospace;
  padding: 6px 8px;
  border: 1px solid var(--color-light-navy);
  /* border-color: limegreen; */
  border-radius: 8px;
  background: var(--color-bright-light-navy);
  text-wrap: pretty;
}

body.dark .hr {
  border-bottom: 1px solid var(--color-dull-navy);
}

body.dark .form-divider {
  border-right: 1px solid var(--color-dull-navy);
}

body.dark .form-group.output-value p {
  border: 1px solid var(--color-dull-navy);
  background: transparent;
  /* border-color: limegreen; */
}

/* CODEMIRROR */
:deep(.cm-editor) {
  height: 100%;
  width: 100%;
  font-family: monospace;
  font-size: 14px;
}

:deep(.cm-scroller) {
  overflow: auto;
}

.file-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.custom-file-upload {
  display: inline-block;
  cursor: pointer;
  width: fit-content;
}

.file-upload-header {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-content: center;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.file-upload-button {
  display: inline-block;
  padding: 6px 12px 4px;
  background-color: var(--color-light-navy);
  color: var(--color-dull-white);
  border-radius: 4px;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

.file-upload-button:hover {
  background-color: var(--color-navy);
}

.file-upload-button i {
  margin-right: 8px;
}

.file-text-display {
  font-size: 16px;
  color: var(--color-navy);
  margin-top: 4px;
  margin-right: 2px;
}

.file-content {
  max-height: 160px;
  overflow: scroll;
}

body.dark .file-upload-button {
  background-color: var(--color-dull-navy);
  color: var(--color-dull-white);
}

body.dark .file-upload-button:hover {
  background-color: var(--color-med-navy);
}

body.dark .file-text-display {
  color: var(--color-dull-white);
  font-weight: 300;
}

body.dark .file-text-display span {
  color: var(--color-med-navy);
  font-weight: 400;
}
</style>

<style>
body.dark .right-side .node-icon svg path[stroke] {
  stroke: var(--color-med-navy) !important;
}

body.dark .right-side .node-icon svg path[fill] {
  fill: var(--color-med-navy) !important;
}

body.dark .right-side .node-icon svg rect[stroke] {
  stroke: var(--color-med-navy) !important;
}

body.dark .right-side .node-icon svg rect[fill] {
  fill: var(--color-med-navy) !important;
}

/* CODEMIRROR */
.cm-editor {
  background: var(--color-navy) !important;
  /* color: #3e405ae7; */
  outline: 1px solid var(--color-light-navy);
  border-radius: 8px;
  font-weight: 300;
}

body.dark .cm-editor {
  background: var(--color-navy) !important;
}

.ͼo .cm-gutters {
  /* display: none !important; */
  background-color: transparent;
  color: var(--color-light-navy);
  margin-left: 4px;
  border: none;
}

.ͼ1 .cm-foldGutter span {
  opacity: 0;
}

.cm-content {
  margin-left: -6px !important;
  padding: 12px 6px !important;
  padding-left: 0 !important;
}

.ͼo .cm-cursor,
.ͼo .cm-dropCursor {
  border-left-color: var(--color-pink) !important;
}

.cm-activeLine .cm-line {
  caret-color: var(--color-pink) !important;
}

.cm-focused {
  outline: 2px solid var(--color-pink) !important;
}

.cm-activeLine {
  background: transparent !important;
  border-left-color: var(--color-pink) !important;
}

.cm-content {
  color: var(--color-pink);
  font-weight: 600;
}

.ͼt {
  color: var(--color-dull-white);
  font-weight: 300;
}

.ͼp {
  color: var(--color-blue);
  font-weight: 300;
}

.ͼq {
  color: var(--color-dull-white);
  font-weight: 300;
}

.ͼr {
  color: #ffd97d;
  font-weight: 300;
}

.ͼ13 {
  color: var(--color-pink);
  font-weight: 600;
}

.ͼu {
  color: var(--color-green);
  font-weight: 300;
}

.ͼv {
  /* color: #19EF83; */
  color: var(--color-dull-white);
}

.ͼw {
  color: #7d8799;
  opacity: 0.85;
}

.cm-focused {
  outline: 1px solid var(--color-pink) !important;
}

.ͼo .cm-gutters {
  color: #3e405a85;
}

.ͼo .cm-activeLineGutter {
  background-color: #3e405a50;
}

.ͼo.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground,
.ͼo .cm-selectionBackground,
.ͼo .cm-content ::selection {
  background-color: #3e405a50;
}

body.dark .ͼo .cm-activeLineGutter {
  background-color: var(--color-dark-navy) !important;
}

body.dark
  .ͼo.cm-focused
  > .cm-scroller
  > .cm-selectionLayer
  .cm-selectionBackground,
body.dark .ͼo .cm-selectionBackground,
body.dark .ͼo .cm-content ::selection {
  background-color: var(--color-dark-navy) !important;
}

body.dark .ͼo.cm-focused .cm-matchingBracket,
body.dark .ͼo.cm-focused .cm-nonmatchingBracket {
  background-color: var(--color-dull-navy) !important;
}

body.dark .cm-editor {
  background: var(--color-black-navy) !important;
  outline: 1px solid var(--color-dull-navy);
  color: var(--color-light-navy);
}
</style>
