<script>
  import { writable } from "svelte/store";

  import { onMount } from "svelte";
  import * as pdfjsLib from "pdfjs-dist";
  import workerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
  export let pdfUrl;
  export let pdfData;
  let pdfDocument;

  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

  let currentPage = 1;
  let numPages = 0;
  let scale = 1;
  const paragraphs = writable([]);
  let canvas;
  let file;
  let dragging = false;
  let startX, startY;
  let selectedParagraph = null;
  let translateX = 0,
    translateY = 0;
  let isReadyToOrder = false;
  let isOrdering = false;

  let hoverTimeout;
  let currentOrderIndex = 1;

  onMount(async () => {
    // Initial setup if needed
    const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
    pdfDocument = pdf;
    numPages = pdf.numPages;
    renderPdfPage();

    console.log("PDF loaded");
    console.log(pdfDocument);
  });

  async function renderPdfPage() {
    if (!pdfDocument) return;
    const page = await pdfDocument.getPage(currentPage);
    const viewport = page.getViewport({ scale });
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };
    page.render(renderContext);

    const paragraphsForPage = pdfData[currentPage - 1].paragraphs;
    const paragraphCoords = transformParagraphData(paragraphsForPage);
    paragraphs.set(
      paragraphCoords.map((p, index) => ({ ...p, order: index + 1 })),
    );
  }

  function startPan(event) {
    dragging = true;
    startX = event.clientX - translateX;
    startY = event.clientY - translateY;
  }

  function doPan(event) {
    if (dragging) {
      translateX = event.clientX - startX;
      translateY = event.clientY - startY;
    }
  }

  function endPan() {
    dragging = false;
  }

  function startPanOrOrder(event) {
    if (isReadyToOrder) {
      startOrder();
    } else {
      startPan(event);
    }
  }

  function doPanOrOrder(event) {
    if (isReadyToOrder) {
      // doOrder(event);
    } else {
      doPan(event);
    }
  }

  function endPanOrOrder() {
    if (isReadyToOrder) {
      endOrder();
    } else {
      endPan();
    }
  }

  $: if (scale !== 1) {
    renderPdfPage();
  }

  const zoomIn = () => (scale *= 1.2);
  const zoomOut = () => (scale /= 1.2);

  function nextPage() {
    if (currentPage < numPages) {
      currentPage++;
    }
  }

  function prevPage() {
    if (currentPage > 1) {
      currentPage--;
    }
  }

  function handleWheel(event) {
    event.preventDefault();
    const zoomSensitivity = 0.1;
    if (event.deltaY < 0) {
      scale *= 1 + zoomSensitivity;
    } else {
      scale /= 1 + zoomSensitivity;
    }
  }

  function startOrder() {
    isOrdering = true;
    paragraphs.update((ps) => ps.map((p) => ({ ...p, ordered: false })));
  }

  function endOrder() {
    isOrdering = false;
    currentOrderIndex = 1;
    console.log({ $paragraphs });
  }

  function handleHover(paragraph) {
    if (!isOrdering) return;
    hoverTimeout = setTimeout(() => orderParagraph(paragraph), 200);
  }

  function orderParagraph(paragraph) {
    paragraphs.update((ps) => {
      const updatedParagraphs = ps.map((p) => {
        if (p.id === paragraph.id && !p.ordered) {
          return { ...p, order: currentOrderIndex++, ordered: true };
        }
        return p;
      });
      return updatedParagraphs.sort((a, b) => a.order - b.order);
    });
  }

  function transformParagraphData(paragraphs) {
    return paragraphs.map((paragraph, pIndex) => {
      const boundingBox = paragraph.boundingRegions[0].polygon;
      const topLeft = boundingBox[0];
      const bottomRight = boundingBox[2];

      return {
        x: topLeft.x * 72,
        y: topLeft.y * 72,
        width: (bottomRight.x - topLeft.x) * 72,
        height: (bottomRight.y - topLeft.y) * 72,
        content: paragraph.content,
        id: pIndex,
      };
    });
  }

  function setParagraphTag(tag) {
    const id = selectedParagraph;
    // this feels like React :(
    paragraphs.update((items) => {
      return items.map((item) => {
        if (item.id === id) {
          return { ...item, tag };
        }
        return item;
      });
    });
  }

  async function extractContent() {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("page", currentPage);

    const response = await fetch("/api/extract-pdf-content", {
      body: formData,
      method: "POST",
    });

    const responseJson = await response.json();
    const paragraphCoords = transformParagraphData(responseJson.paragraphs);
    paragraphs.set(
      paragraphCoords.map((p, index) => ({ ...p, order: index + 1 })),
    );
  }

  $: currentPage, renderPdfPage(); // Re-render when currentPage changes
</script>

<p>Zoom: {Math.floor(scale * 100)}%</p>
<button on:click={zoomIn}>Zoom In</button>
<button on:click={zoomOut}>Zoom Out</button>

<div class="toolbar">
  <button
    on:click={() => {
      isReadyToOrder = !isReadyToOrder;
    }}>{isReadyToOrder ? "Stop ordering" : "Set order"}</button
  >
  <button on:click={() => setParagraphTag("h1")} disabled={!selectedParagraph}
    >H1</button
  >
  <button on:click={() => setParagraphTag("h2")} disabled={!selectedParagraph}
    >H2</button
  >
</div>

<div
  class="pdf-container"
  on:mousedown={startPanOrOrder}
  on:mousemove={doPanOrOrder}
  on:mouseup={endPanOrOrder}
  on:wheel={handleWheel}
  on:click={() => (selectedParagraph = null)}
  class:dragging
>
  <canvas
    bind:this={canvas}
    style="transform: translate({translateX}px, {translateY}px);"
  ></canvas>

  {#each $paragraphs as coord (coord.id)}
    <button
      on:click={(event) => {
        selectedParagraph = coord.id;
        event.stopPropagation();
      }}
      on:mouseover={() => handleHover(coord)}
      class:selected={selectedParagraph === coord.id}
      class="interactive-box button-reset tag-{coord.tag}"
      style="left: {coord.x * scale + translateX}px; top: {coord.y * scale +
        translateY}px; width: {coord.width * scale}px; height: {coord.height *
        scale}px;"
    >
      {#if isReadyToOrder}{coord.order}{/if}
    </button>
  {/each}
</div>

<button on:click={prevPage} disabled={currentPage <= 1}>Previous Page</button>
<button on:click={nextPage} disabled={currentPage >= numPages}>Next Page</button
>
<button on:click={extractContent}>Extract Content</button>

<style>
  .pdf-container {
    width: 100%;
    height: 90vh; /* Adjust the height as needed */
    position: relative;
    overflow: hidden; /* This will clip the overflow */
    border: 2px solid black;
  }

  .pdf-container.dragging {
    cursor: grabbing;
  }

  canvas {
    position: absolute;
    top: 0;
    left: 0;
  }

  .button-reset {
    all: unset;
    border: 2px solid black;
    cursor: pointer;
  }

  .interactive-box {
    position: absolute;
    background-color: rgba(255, 255, 0, 0.5);
  }

  .interactive-box.selected {
    border: 4px solid blue;
    background-color: rgba(0, 0, 255, 0.5);
  }
</style>
