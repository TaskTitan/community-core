<template>
  <span class="svg-icon" v-html="svgContent"></span>
</template>

<script>
export default {
  name: 'SvgIcon',
  props: {
    name: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      svgContent: '',
    };
  },
  mounted() {
    this.loadSvg();
  },
  watch: {
    name() {
      this.loadSvg();
    },
  },
  methods: {
    async loadSvg() {
      // const isDev = import.meta.env.DEV;
      const isDev = true; // change on production
      const basePath = isDev ? '/src/assets/icons' : '/assets/icons';

      try {
        const response = await fetch(`${basePath}/${this.name}.svg`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        let svgContent = await response.text();

        // Inject gradient definition
        svgContent = this.injectGradient(svgContent);

        this.svgContent = svgContent;
      } catch (error) {
        console.error(`Failed to load SVG: ${this.name}`, error);
        this.svgContent = ''; // Clear content on error

        // If in production and failed, try the development path as fallback
        if (!isDev) {
          try {
            const devResponse = await fetch(`/src/assets/icons/${this.name}.svg`);
            if (devResponse.ok) {
              this.svgContent = await devResponse.text();
            }
          } catch (devError) {
            console.error(`Failed to load SVG from dev path: ${this.name}`, devError);
          }
        }
      }
    },
    injectGradient(svgContent) {
      const gradientDef = `
        <linearGradient id="SVG-Gradient" gradientTransform="rotate(-45)">
          <stop offset="0%" stop-color="#E53d8F" />
          <stop offset="50%" stop-color="#3E405A" />
        </linearGradient>
        <linearGradient id="SVG-Gradient-Dark" gradientTransform="rotate(-45)">
          <stop offset="0%" stop-color="#19EF83" />
          <stop offset="50%" stop-color="#12E0FF" />
        </linearGradient>
      `;

      // Use a more robust regex to find the right spot to inject the gradient
      const svgOpenTagRegex = /<svg[^>]*>/i;
      const match = svgContent.match(svgOpenTagRegex);

      if (match) {
        const insertionPoint = match.index + match[0].length;
        return svgContent.slice(0, insertionPoint) + `<defs>${gradientDef}</defs>` + svgContent.slice(insertionPoint);
      }

      // If we can't find a suitable injection point, return the original SVG
      return svgContent;
    },
  },
};
</script>

<style>
body.dark .svg-icon path[fill] {
  fill: var(--color-dull-white);
}

body.dark .svg-icon path[stroke] {
  stroke: var(--color-dull-white);
}
</style>

<style scoped>
span.svg-icon {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-content: center;
  justify-content: center;
  align-items: center;
}

#sidebar.closed .node.starter .svg-icon {
  transform: scale(1);
}

#sidebar.closed .node.starter svg:last-child {
  display: none;
}
</style>
