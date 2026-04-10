// =============================================
//   Configuracao do frontend - config.js
// =============================================

window.APP_CONFIG = {
  apiUrl: "https://relat-rio-ti.onrender.com"
};

(function initApiConfig() {
  const host = window.location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1";
  const configuredUrl = typeof window.APP_CONFIG.apiUrl === "string"
    ? window.APP_CONFIG.apiUrl.trim().replace(/\/+$/, "")
    : "";

  window.API_URL = configuredUrl || (isLocal ? "http://localhost:3000" : "");
  window.API_CONFIG_ERROR = window.API_URL
    ? ""
    : "Backend nao configurado para este ambiente. Edite config.js e defina window.APP_CONFIG.apiUrl com a URL publica da API.";
})();
