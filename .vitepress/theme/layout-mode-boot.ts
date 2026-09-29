/**
 * Teek 布局模式写在 localStorage + hydration 后才落到 html/CSS 变量。
 * 刷新时首屏先按默认 100% 宽绘制，再跳到「适合宽度」→ 残影/二次动画才正常。
 * 此脚本必须在 body 绘制前同步执行（transformHead 内联）。
 */
export const LAYOUT_MODE_BOOT_SCRIPT = `(function(){try{var g=function(k){try{return localStorage.getItem(k)}catch(e){return null}};var mode=g("tk:layoutMode")||"fullWidth";document.documentElement.setAttribute("layout-mode",mode);var page=g("tk:pageMaxWidthSlide");var doc=g("tk:docMaxWidthSlide");var st=document.documentElement.style;var pct=function(raw,fallback){if(raw==null||raw==="")return fallback;var n=Number(raw);return Number.isFinite(n)?Math.ceil(n/100):fallback};st.setProperty("--tk-page-max-width",pct(page,90)+"%");st.setProperty("--tk-doc-max-width",pct(doc,95)+"%")}catch(e){}})();`
