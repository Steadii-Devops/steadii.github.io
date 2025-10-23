/**
 * Meeting Page - Zoom Iframe Integration
 *
 * This code handles the Zoom meeting iframe integration on the meeting page.
 * It extracts URL parameters and displays the appropriate Zoom meeting.
 *
 * IMPORTANT: This code should be placed in the meeting page's custom code block.
 *
 * Version: 1.0
 * Date: 2025-10-23
 */

(function() {
  'use strict';

  const TAG = '[MeetingPage]';

  // Parse URL parameters - declare variables ONCE
  const urlParams = new URLSearchParams(window.location.search);
  const meetingUrl = urlParams.get('meetingUrl');
  const sessionId = urlParams.get('sessionId');

  // Log for debugging
  console.log(TAG, 'Initializing meeting page...');
  console.log(TAG, 'Meeting URL:', meetingUrl);
  console.log(TAG, 'Session ID:', sessionId);

  /**
   * Creates and displays the Zoom iframe
   */
  function initializeZoomIframe() {
    // Find the container for the iframe
    const container = document.getElementById('zoom-meeting-container');

    if (!container) {
      console.error(TAG, 'Zoom meeting container not found!');
      showError('Meeting container not found. Please contact support.');
      return;
    }

    // Validate meeting URL
    if (!meetingUrl) {
      console.error(TAG, 'No meeting URL provided');
      showError('No meeting URL provided. Please try joining the meeting again.');
      return;
    }

    // Create iframe element
    const iframe = document.createElement('iframe');
    iframe.src = meetingUrl;
    iframe.allow = 'camera; microphone; fullscreen; display-capture';
    iframe.style.cssText = `
      width: 100%;
      height: 100vh;
      border: none;
      position: fixed;
      top: 0;
      left: 0;
      z-index: 9999;
    `;
    iframe.id = 'zoom-meeting-iframe';

    // Clear container and add iframe
    container.innerHTML = '';
    container.appendChild(iframe);

    console.log(TAG, 'Zoom iframe created successfully');

    // Hide any loading spinners
    hideLoadingSpinner();
  }

  /**
   * Displays an error message to the user
   */
  function showError(message) {
    const container = document.getElementById('zoom-meeting-container');
    if (container) {
      container.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          padding: 20px;
          text-align: center;
        ">
          <h2 style="color: #e53e3e; margin-bottom: 16px;">Unable to Load Meeting</h2>
          <p style="color: #4a5568; margin-bottom: 24px;">${message}</p>
          <button onclick="window.history.back()" style="
            background-color: #4299e1;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
          ">Go Back</button>
        </div>
      `;
    }
    hideLoadingSpinner();
  }

  /**
   * Hides any loading spinners on the page
   */
  function hideLoadingSpinner() {
    const spinners = document.querySelectorAll('.spinner, .loading-spinner, [data-loading]');
    spinners.forEach(spinner => {
      spinner.style.display = 'none';
    });
  }

  /**
   * Main initialization
   * Runs when DOM is ready
   */
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeZoomIframe);
    } else {
      initializeZoomIframe();
    }
  }

  // Start initialization
  init();

  // Expose utilities for debugging
  window.MeetingPageDebug = {
    version: '1.0',
    meetingUrl: meetingUrl,
    sessionId: sessionId,
    reinitialize: initializeZoomIframe
  };

})();
