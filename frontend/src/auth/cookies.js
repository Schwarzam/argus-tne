function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// Function to save sessionId and csrfToken cookies to localStorage
function saveCookiesToLocalStorage() {
    const sessionId = getCookie('sessionid'); // Replace getCookie with your method to get cookies
    const csrfToken = getCookie('csrftoken'); // Replace getCookie with your method to get cookies
  
    localStorage.setItem('sessionid', sessionId);
    localStorage.setItem('csrftoken', csrfToken);

    deleteCookie('sessionid');
    deleteCookie('csrftoken');
}
  
  // Function to get sessionId and csrfToken from localStorage and delete them
function getCookiesFromLocalStorage() {
    const sessionId = localStorage.getItem('sessionid');
    const csrfToken = localStorage.getItem('csrftoken');
  
    // After retrieving, remove them from localStorage
    localStorage.removeItem('sessionid');
    localStorage.removeItem('csrftoken');
    
    setCookie('sessionid', sessionId, 0.5);
    setCookie('csrftoken', csrfToken, 0.5);

    return { sessionId, csrfToken };
}
  
  // Utility function to set a cookie
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
      let date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

module.exports = { getCookie, deleteCookie, saveCookiesToLocalStorage, getCookiesFromLocalStorage };