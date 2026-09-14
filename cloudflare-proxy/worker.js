/**
 * Cloudflare Worker — proxy reverso para o CondoFlow
 * Redireciona condoflow.site → condo-flow-os.lovable.app
 * Remove automaticamente o badge "Edit with Lovable" das páginas HTML.
 */

const ORIGIN = "https://condo-flow-os.lovable.app";

// Script injetado no HTML para remover o badge do Lovable
const REMOVE_LOVABLE_SCRIPT = `<script>
(function(){
  function removeLovable(){
    document.querySelectorAll('*').forEach(function(el){
      try {
        if(el.shadowRoot) return;
        var t = el.innerText || '';
        if(t.includes('Lovable') && (el.tagName==='A'||el.tagName==='BUTTON'||el.tagName==='DIV')){
          var s = window.getComputedStyle(el);
          if(s.position==='fixed'||s.position==='absolute'){
            el.style.display='none';
          }
        }
      } catch(e){}
    });
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', removeLovable);
  } else {
    removeLovable();
  }
  setTimeout(removeLovable, 500);
  setTimeout(removeLovable, 1500);
})();
</script>`;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const origin = new URL(ORIGIN);

    url.hostname = origin.hostname;
    url.protocol = origin.protocol;
    url.port = "";

    const headers = new Headers(request.headers);
    headers.set("Host", origin.hostname);

    const proxyReq = new Request(url.toString(), {
      method: request.method,
      headers,
      body: request.body,
      redirect: "manual",
    });

    const response = await fetch(proxyReq);

    // Corrige redirecionamentos para lovable.app
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("Location") ?? "";
      if (location.includes("lovable.app")) {
        const fixed = location.replace(
          /https?:\/\/condo-flow-os\.lovable\.app/,
          `https://${new URL(request.url).hostname}`
        );
        const newRes = new Response(response.body, response);
        newRes.headers.set("Location", fixed);
        return newRes;
      }
    }

    // Para respostas HTML, injeta o script que remove o badge do Lovable
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("text/html")) {
      const html = await response.text();
      const patched = html.replace("</body>", REMOVE_LOVABLE_SCRIPT + "</body>");
      const newHeaders = new Headers(response.headers);
      newHeaders.delete("content-length"); // tamanho mudou
      return new Response(patched, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    }

    return response;
  },
};
