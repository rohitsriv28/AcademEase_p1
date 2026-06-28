export function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function formatDate(dateString) {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

export function showLoader(loading) {
  let loader = document.getElementById("global-loader");
  if (!loader) {
    loader = document.createElement("div");
    loader.id = "global-loader";
    loader.innerHTML = `
            <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(255,255,255,0.8); z-index:9999; display:flex; justify-content:center; align-items:center;">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
    document.body.appendChild(loader);
  }
  loader.style.display = loading ? "flex" : "none";
}

export function showToast(message, isError = false) {
  // Simple custom toast to avoid native alerts
  const toast = document.createElement("div");
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.right = "20px";
  toast.style.padding = "15px 25px";
  toast.style.background = isError ? "#f44336" : "#4caf50";
  toast.style.color = "#fff";
  toast.style.borderRadius = "5px";
  toast.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
  toast.style.zIndex = "10000";
  toast.style.transition = "opacity 0.3s ease";
  toast.innerText = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
