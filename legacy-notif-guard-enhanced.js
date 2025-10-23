/**
 * Enhanced Legacy Notification Guard v4
 *
 * Purpose: Prevents errors from Softr's legacy notification badge code
 * that attempts to access #home-header2 .container > div .lastChild
 *
 * Key improvements over v3:
 * - Multi-stage initialization (immediate, DOMContentLoaded, and continuous monitoring)
 * - Mutation observer to maintain stub structure even if removed
 * - Comprehensive error wrapping for all legacy functions
 * - Special handling for Zoom "Join session" button clicks
 * - Aggressive error suppression to prevent spinner lockup
 */

(function () {
  'use strict';

  const TAG = '[LegacyNotifGuard-v4]';
  const SEL = '#home-header2 .container > div';
  const HEADER_ID = 'home-header2';

  let stubEnsured = false;
  let observer = null;

  // Comprehensive error suppression
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const msg = args.join(' ');
    // Suppress known problematic errors
    if (msg.includes('lastChild') && msg.includes('home-header2')) {
      console.warn(TAG, 'Suppressed error:', msg);
      return;
    }
    if (msg.includes('updateTabletBadge') || msg.includes('initNotificationBadge')) {
      console.warn(TAG, 'Suppressed notification badge error:', msg);
      return;
    }
    originalConsoleError.apply(console, args);
  };

  /**
   * Creates or ensures the stub DOM structure exists
   * This must be bulletproof and work even if called multiple times
   */
  function ensureStub() {
    try {
      let header = document.getElementById(HEADER_ID);

      // Create header if it doesn't exist
      if (!header) {
        console.log(TAG, 'Creating stub header element');
        header = document.createElement('div');
        header.id = HEADER_ID;
        header.style.cssText = 'display: none !important; visibility: hidden !important; position: absolute; left: -9999px;';
        header.setAttribute('data-legacy-guard', 'v4');

        // Insert at the very beginning of body
        if (document.body) {
          document.body.insertBefore(header, document.body.firstChild);
        } else {
          // If body doesn't exist yet, wait for it
          if (document.documentElement) {
            document.documentElement.appendChild(header);
          }
        }
      }

      // Ensure container structure: .container > div
      let container = header.querySelector('.container');
      if (!container) {
        container = document.createElement('div');
        container.className = 'container';
        container.style.cssText = 'display: none !important;';
        header.appendChild(container);
      }

      let innerDiv = container.querySelector('div');
      if (!innerDiv) {
        innerDiv = document.createElement('div');
        innerDiv.style.cssText = 'display: none !important;';
        container.appendChild(innerDiv);
      }

      // Ensure lastChild exists
      if (!innerDiv.lastChild) {
        const stub = document.createElement('span');
        stub.className = 'notification-badge-stub';
        stub.style.cssText = 'display: none !important;';
        stub.setAttribute('data-stub', 'true');
        innerDiv.appendChild(stub);
      }

      stubEnsured = true;
      console.log(TAG, 'Stub structure verified/created successfully');

      return true;
    } catch (err) {
      console.warn(TAG, 'ensureStub error (will retry):', err);
      return false;
    }
  }

  /**
   * Wraps a function with comprehensive error handling
   */
  function safeWrap(fn, name) {
    return function(...args) {
      try {
        ensureStub(); // Ensure stub before every legacy function call
        return fn.apply(this, args);
      } catch (err) {
        console.warn(TAG, `Caught error in ${name}:`, err);
        return null; // Return safely instead of throwing
      }
    };
  }

  /**
   * Intercepts and wraps legacy notification functions
   */
  function wrapLegacyFunctions() {
    const legacyFunctions = [
      'updateTabletBadge',
      'initNotificationBadge',
      'checkLoggedInUser',
      'updateNotificationCount',
      'refreshNotifications'
    ];

    legacyFunctions.forEach(fname => {
      if (typeof window[fname] === 'function') {
        const original = window[fname];
        window[fname] = safeWrap(original, fname);
        console.log(TAG, `Wrapped function: ${fname}`);
      }
    });

    // Also wrap any functions that might be added later
    const originalDefineProperty = Object.defineProperty;
    Object.defineProperty = function(obj, prop, descriptor) {
      if (obj === window && legacyFunctions.includes(prop) && descriptor.value && typeof descriptor.value === 'function') {
        console.log(TAG, `Intercepting late-bound function: ${prop}`);
        descriptor.value = safeWrap(descriptor.value, prop);
      }
      return originalDefineProperty.call(this, obj, prop, descriptor);
    };
  }

  /**
   * Sets up mutation observer to maintain stub structure
   */
  function setupMutationObserver() {
    if (observer) return; // Already set up

    observer = new MutationObserver((mutations) => {
      let needsCheck = false;

      for (const mutation of mutations) {
        // Check if our header was removed
        if (mutation.type === 'childList') {
          for (const node of mutation.removedNodes) {
            if (node.id === HEADER_ID || (node.nodeType === 1 && node.querySelector(`#${HEADER_ID}`))) {
              console.warn(TAG, 'Stub structure was removed! Recreating...');
              needsCheck = true;
              break;
            }
          }
        }
      }

      if (needsCheck) {
        stubEnsured = false;
        ensureStub();
      }
    });

    // Observe the entire document for changes
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      console.log(TAG, 'Mutation observer activated');
    }
  }

  /**
   * Patches querySelector to return safe results
   */
  function patchQuerySelector() {
    const originalQuerySelector = Document.prototype.querySelector;
    const originalQuerySelectorAll = Document.prototype.querySelectorAll;

    Document.prototype.querySelector = function(selector) {
      const result = originalQuerySelector.call(this, selector);

      // If querying for our problematic selector and it returns null, ensure stub
      if (!result && selector.includes('home-header2')) {
        console.warn(TAG, `querySelector returned null for: ${selector}, ensuring stub...`);
        ensureStub();
        return originalQuerySelector.call(this, selector);
      }

      return result;
    };
  }

  /**
   * Special handling for Zoom "Join session" button clicks
   * Ensures stub is present before and after the click event
   */
  function setupJoinSessionGuard() {
    // Use capture phase to run before any other handlers
    document.addEventListener('click', function(e) {
      const target = e.target;
      if (!target) return;

      // Check if this is a "Join session" button or link
      const isJoinButton =
        target.matches('button, a, [role="button"]') &&
        (target.textContent.includes('Join session') ||
         target.textContent.includes('Start meeting') ||
         target.href && target.href.includes('zoom'));

      if (isJoinButton) {
        console.log(TAG, 'Join session click detected, ensuring stub...');
        ensureStub();

        // Also ensure stub after a short delay (for async operations)
        setTimeout(() => {
          ensureStub();
        }, 100);
        setTimeout(() => {
          ensureStub();
        }, 500);
      }
    }, true); // Use capture phase

    console.log(TAG, 'Join session guard installed');
  }

  /**
   * Main initialization
   * Runs at multiple stages to ensure coverage
   */
  function init() {
    console.log(TAG, 'Initializing Enhanced Legacy Notif Guard v4...');

    // Stage 1: Immediate
    ensureStub();
    wrapLegacyFunctions();
    patchQuerySelector();
    setupJoinSessionGuard();

    // Stage 2: After DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        console.log(TAG, 'DOM ready, re-ensuring stub...');
        ensureStub();
        setupMutationObserver();
      });
    } else {
      ensureStub();
      setupMutationObserver();
    }

    // Stage 3: After full page load
    window.addEventListener('load', () => {
      console.log(TAG, 'Page fully loaded, final stub check...');
      ensureStub();
    });

    // Stage 4: Continuous monitoring
    setInterval(() => {
      if (!stubEnsured || !document.getElementById(HEADER_ID)) {
        console.warn(TAG, 'Periodic check found stub missing, recreating...');
        ensureStub();
      }
    }, 2000);

    console.log(TAG, 'Guard initialization complete');
  }

  // Execute immediately
  init();

  // Make guard functions available globally for debugging
  window.LegacyNotifGuard = {
    version: '4.0',
    ensureStub,
    getStatus: () => ({
      stubEnsured,
      headerExists: !!document.getElementById(HEADER_ID),
      observerActive: !!observer
    })
  };

})();
