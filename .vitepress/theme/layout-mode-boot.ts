/**
 * Teek 布局模式写在 localStorage，hydration 后才落到 html / CSS 变量。
 * 刷新时首屏先按默认 100% 宽绘制，再跳到「适合宽度」→ 残影，需再切一次布局才正常。
 * 此脚本必须在 body 绘制前同步执行（dev: vite transformIndexHtml；prod: head 内联）。
 *
 * Teek 运行时写 body.style；head 阶段 body 可能未就绪，先写 html，再同步 body。
 */
export const LAYOUT_MODE_BOOT_SCRIPT = `(function(){try{var g=function(k){try{return localStorage.getItem(k)}catch(e){return null}};var mode=g("tk:layoutMode")||"fullWidth";document.documentElement.setAttribute("layout-mode",mode);var page=g("tk:pageMaxWidthSlide");var doc=g("tk:docMaxWidthSlide");var pct=function(raw,fallback){if(raw==null||raw==="")return fallback;var n=Number(raw);return Number.isFinite(n)?Math.ceil(n/100):fallback};var apply=function(el){if(!el)return;el.style.setProperty("--tk-page-max-width",pct(page,90)+"%");el.style.setProperty("--tk-doc-max-width",pct(doc,95)+"%")};apply(document.documentElement);apply(document.body);if(!document.body)document.addEventListener("DOMContentLoaded",function(){apply(document.body)},{once:true})}catch(e){}})();`
