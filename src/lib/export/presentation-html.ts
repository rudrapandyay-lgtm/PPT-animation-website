import { type PresentationDocument, type PresentationElement } from "@/lib/types";

type HtmlRenderOptions = {
  title?: string;
  showToolbar?: boolean;
  exportMode?: boolean;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderElement(element: PresentationElement) {
  const baseStyle = [
    `left:${element.position.x}%`,
    `top:${element.position.y}%`,
    `width:${element.position.w}%`,
    `height:${element.position.h}%`,
    element.style.color ? `color:${element.style.color}` : "",
    element.style.background ? `background:${element.style.background}` : "",
    element.style.border ? `border:${element.style.border}` : "",
    typeof element.style.borderRadius === "number"
      ? `border-radius:${element.style.borderRadius}px`
      : typeof element.style.borderRadius === "string"
        ? `border-radius:${element.style.borderRadius}`
        : "",
    typeof element.style.boxShadow === "string" ? `box-shadow:${element.style.boxShadow}` : "",
    typeof element.style.fontSize === "number" ? `font-size:${element.style.fontSize}px` : "",
    typeof element.style.fontWeight === "number" || typeof element.style.fontWeight === "string"
      ? `font-weight:${element.style.fontWeight}`
      : "",
    typeof element.style.lineHeight === "number" || typeof element.style.lineHeight === "string"
      ? `line-height:${element.style.lineHeight}`
      : "",
  ]
    .filter(Boolean)
    .join(";");

  if (element.type === "IMAGE") {
    return `<div class="el" style="${baseStyle}"><img src="${escapeHtml(String(element.content.src ?? ""))}" alt="${escapeHtml(String(element.content.alt ?? element.name))}" /></div>`;
  }

  const content = element.type === "TEXT" ? String(element.content.text ?? "") : String(element.content.label ?? "");
  return `<div class="el ${element.type.toLowerCase()}" style="${baseStyle}">${escapeHtml(content).replace(/\n/g, "<br />")}</div>`;
}

export function renderPresentationHtml(
  document: PresentationDocument,
  options: HtmlRenderOptions = {},
) {
  const { title = document.name, showToolbar = true, exportMode = false } = options;

  const slidesMarkup = document.slides
    .map(
      (slide, index) => `
        <section class="slide ${index === 0 ? "active" : ""}" style="background:linear-gradient(135deg, ${String(slide.background.gradientFrom ?? slide.background.base)} 0%, ${String(slide.background.gradientTo ?? slide.background.base)} 100%)">
          ${slide.elements.map((element) => renderElement(element)).join("\n")}
        </section>`,
    )
    .join("\n");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      body{margin:0;background:#050816;color:#fff;font-family:Arial,Helvetica,sans-serif}
      .deck{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:${exportMode ? "0" : "24px"}}
      .player{width:${exportMode ? "1280px" : "min(1100px,100%)"}}
      .toolbar{display:${showToolbar ? "flex" : "none"};justify-content:space-between;align-items:center;margin-bottom:16px;color:#cbd5e1}
      .controls button{margin-left:8px;padding:10px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:transparent;color:#fff;cursor:pointer}
      .viewport{position:relative;${exportMode ? "width:1280px;height:720px;" : "aspect-ratio:16/9;"}overflow:hidden;border-radius:${exportMode ? "0" : "28px"};border:${exportMode ? "0" : "1px solid rgba(255,255,255,.12)"};box-shadow:${exportMode ? "none" : "0 30px 80px rgba(2,6,23,.45)"}}
      .slide{position:absolute;inset:0;display:none}
      .slide.active{display:block}
      .el{position:absolute;overflow:hidden}
      .el img{width:100%;height:100%;object-fit:cover;display:block}
      .shape{display:flex;align-items:center;justify-content:center;padding:0 16px;text-align:center;white-space:pre-wrap}
      .text{white-space:pre-wrap}
    </style>
  </head>
  <body>
    <div class="deck">
      <div class="player">
        <div class="toolbar">
          <div>${escapeHtml(document.name)}</div>
          <div class="controls">
            <button id="prev">Prev</button>
            <button id="next">Next</button>
          </div>
        </div>
        <div class="viewport">${slidesMarkup}</div>
      </div>
    </div>
    <script>
      const slides=[...document.querySelectorAll('.slide')];
      let index=0;
      function render(){slides.forEach((slide,i)=>slide.classList.toggle('active',i===index));}
      window.__setSlide=(nextIndex)=>{index=Math.max(0,Math.min(slides.length-1,nextIndex));render();};
      document.getElementById('prev')?.addEventListener('click',()=>{index=Math.max(0,index-1);render();});
      document.getElementById('next')?.addEventListener('click',()=>{index=Math.min(slides.length-1,index+1);render();});
      document.addEventListener('keydown',(event)=>{if(event.key==='ArrowRight'){index=Math.min(slides.length-1,index+1);render();} if(event.key==='ArrowLeft'){index=Math.max(0,index-1);render();}});
      render();
    </script>
  </body>
</html>`;
}
