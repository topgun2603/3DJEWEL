/*!
 * BirthDiamond configurator loader.
 * Usage: <div data-birthdiamond data-retailer="aurelia"></div>
 *        <script src="https://<studio-host>/embed.js" async></script>
 * Emits a "birthdiamond:add-to-cart" CustomEvent (on the container and window)
 * with { line } whenever the shopper adds a piece to their bag.
 */
(function () {
  var script = document.currentScript;
  var origin = script ? new URL(script.src).origin : window.location.origin;
  var EVENT = "birthdiamond:add-to-cart";

  function mount(el) {
    if (el.__birthdiamond) return;
    el.__birthdiamond = true;
    var retailer = el.getAttribute("data-retailer");
    if (!retailer) return console.warn("[birthdiamond] data-retailer is required");
    var iframe = document.createElement("iframe");
    iframe.src = origin + "/embed/" + encodeURIComponent(retailer) + window.location.search;
    iframe.title = "Design your BirthDiamond jewelry";
    iframe.allow = "clipboard-write";
    iframe.loading = "lazy";
    iframe.style.cssText = "width:100%;height:100%;min-height:" + (el.getAttribute("data-height") || "760") + "px;border:0;border-radius:16px;display:block";
    el.appendChild(iframe);

    window.addEventListener("message", function (e) {
      if (e.origin !== origin || e.source !== iframe.contentWindow) return;
      if (!e.data || e.data.type !== EVENT) return;
      var detail = { retailer: e.data.tenant, line: e.data.line };
      el.dispatchEvent(new CustomEvent(EVENT, { detail: detail, bubbles: true }));
      window.dispatchEvent(new CustomEvent(EVENT, { detail: detail }));
    });
  }

  function init() {
    document.querySelectorAll("[data-birthdiamond]").forEach(mount);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  window.BirthDiamond = { mount: mount };
})();
