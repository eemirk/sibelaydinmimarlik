// Netlify önizlemesi: /api/form.php isteklerini (GET/POST) karşılar — yalnızca Netlify'da çalışır,
// tools/ cPanel ZIP'ine girmez. Netlify statik dosyaya gelen POST'u kimi sitede 404 sayfasıyla
// yanıtlayabildiği için tools/netlify-preview.mjs'nin yazdığı statik JSON'a ek güvence:
// formlar her durumda bu mesajı gösterir (ok:false → başarı akışı / yönlendirme yok).
const BODY = JSON.stringify({
  ok: false,
  message: 'Bu bir önizleme sitesidir; form gönderimi yalnızca canlı sitede çalışır. Bilgileriniz gönderilmedi.'
});

export default async () => new Response(BODY, {
  status: 200,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
});

export const config = { path: '/api/form.php' };
