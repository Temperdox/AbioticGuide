// ==================== UTILITY FUNCTIONS ====================

function setCookie(name, value, days = 365) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "expires=" + date.toUTCString();
  document.cookie = name + "=" + JSON.stringify(value) + ";" + expires + ";path=/";
}

function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      try {
        return JSON.parse(c.substring(nameEQ.length, c.length));
      } catch(e) {
        return null;
      }
    }
  }
  return null;
}

function deleteCookie(name) {
  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

function getImageTag(type, name, className = "") {
  const url = imageUrls[type][name];
  if (url && url.trim() !== "") {
    return `<img src="${url}" alt="${name}" class="${className}" onerror="this.style.display='none'">`;
  }
  return "";
}
