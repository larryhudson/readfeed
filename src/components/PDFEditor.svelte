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
  let selectedIds = [];
  let translateX = 0,
    translateY = 0;
  let isReadyToOrder = false;
  let isOrdering = false;
  let holdingCtrl = false;

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
    console.log("Rendering page", currentPage);
    const pdfPageData = pdfData[currentPage - 1];
    console.log("Page data");
    console.log(pdfPageData);
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

    const pageToRender = pdfData[currentPage - 1];
    if (pageToRender && pageToRender.modified) {
      paragraphs.set(pageToRender.paragraphs);
    } else {
      const paragraphsForPage = pageToRender.paragraphs;
      const paragraphCoords = transformParagraphData(paragraphsForPage);
      paragraphs.set(
        paragraphCoords.map((p, index) => ({ ...p, order: index + 1 })),
      );
    }
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
    // this feels like React :(
    paragraphs.update((items) => {
      return items.map((item) => {
        if (selectedIds.includes(item.id)) {
          return { ...item, tag };
        }
        return item;
      });
    });
    // update paragraphs in pdfData
    pdfData[currentPage - 1].paragraphs = $paragraphs;
    pdfData[currentPage - 1].modified = true;
    pdfData = [...pdfData];
    console.log(pdfData);
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

  function handleKeydown(event) {
    if (event.key === "Control") {
      holdingCtrl = true;
    }
  }

  function handleKeyup(event) {
    if (event.key === "Control") {
      holdingCtrl = false;
    }
  }

  async function savePdfData() {
    const formData = new FormData();
    formData.append("data", JSON.stringify(pdfData, null, 2));

    const saveUrl = "./save";

    const response = await fetch(saveUrl, {
      body: JSON.stringify(pdfData, null, 2),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      console.log("Saved PDF data");
    } else {
      console.log("Failed to save PDF data");
    }
  }

  async function updateContentParts() {
    const saveUrl = "./update-content-parts";

    const response = await fetch(saveUrl, {
      method: "POST",
    });

    if (response.ok) {
      console.log("Updated content parts");
    } else {
      console.log("Failed to update content parts");
    }
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
  <button
    on:click={() => setParagraphTag("h1")}
    disabled={selectedIds.length === 0}>H1</button
  >
  <button
    on:click={() => setParagraphTag("h2")}
    disabled={selectedIds.length === 0}>H2</button
  >
  <button
    on:click={() => setParagraphTag("artifact")}
    disabled={selectedIds.length === 0}>Artifact</button
  >
</div>

<div
  class="pdf-container"
  on:mousedown={startPanOrOrder}
  on:mousemove={doPanOrOrder}
  on:mouseup={endPanOrOrder}
  on:wheel={handleWheel}
  on:keydown={handleKeydown}
  on:keyup={handleKeyup}
  on:click={() => (selectedIds = [])}
  class:dragging
>
  <canvas
    bind:this={canvas}
    style="transform: translate({translateX}px, {translateY}px);"
  ></canvas>

  {#each $paragraphs as coord (coord.id)}
    <button
      on:click={(event) => {
        if (holdingCtrl) {
          selectedIds = [...selectedIds, coord.id];
        } else {
          selectedIds = [coord.id];
        }
        event.stopPropagation();
      }}
      on:mouseover={() => handleHover(coord)}
      class:selected={selectedIds.includes(coord.id)}
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
<button on:click={savePdfData}>Save PDF data</button>
<button on:click={updateContentParts}>Update content parts</button>

<style>
  .pdf-container {
    width: 100%;
    height: 90vh; /* Adjust the height as needed */
    position: relative;
    overflow: hidden; /* This will clip the overflow */
    border: 2px solid black;
    background-color: lightgray;
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

  .interactive-box.tag-artifact {
    background-color: rgba(0, 0, 0, 0.5);
  }
</style>
