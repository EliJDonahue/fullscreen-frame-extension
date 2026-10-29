// Fullscreen Frame: runs when the toolbar button is clicked or Alt+Shift+F is pressed.
chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: toggleFrameFullscreen
  });
});

// This function is injected into the page, so it must be self-contained.
function toggleFrameFullscreen() {
  const OVERLAY_ATTR = 'data-ff-overlay';

  // 1. Toggle off: exit native fullscreen or undo the overlay fallback.
  if (document.fullscreenElement) {
    document.exitFullscreen();
    return;
  }
  const active = document.querySelector('[' + OVERLAY_ATTR + ']');
  if (active) {
    active.style.cssText = active.getAttribute(OVERLAY_ATTR);
    active.removeAttribute(OVERLAY_ATTR);
    return;
  }

  // 2. Find the largest visible frame.
  const frames = [...document.querySelectorAll('iframe, frame')]
    .filter((f) => f.offsetWidth > 0 && f.offsetHeight > 0)
    .sort((a, b) => b.offsetWidth * b.offsetHeight - a.offsetWidth * a.offsetHeight);
  const frame = frames[0];

  if (!frame) {
    const toast = document.createElement('div');
    toast.textContent = 'Fullscreen Frame: no frame found on this page';
    toast.style.cssText =
      'position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:2147483647;' +
      'background:#222;color:#fff;padding:10px 16px;border-radius:6px;' +
      'font:14px system-ui,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.4)';
    document.documentElement.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
    return;
  }

  // 3. Try true fullscreen first; fall back to a page-covering overlay.
  const useOverlay = () => {
    frame.setAttribute(OVERLAY_ATTR, frame.style.cssText || '');
    Object.assign(frame.style, {
      position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
      zIndex: '2147483647', border: '0', background: '#fff'
    });
  };
  try {
    frame.requestFullscreen().catch(useOverlay);
  } catch (e) {
    useOverlay();
  }
}
