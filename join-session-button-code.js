/**
 * Join Session Button Handler
 *
 * This code handles the "Join Session" button click on the caregiver details page.
 * It extracts the necessary parameters and redirects to the meeting page.
 *
 * IMPORTANT: Place this code in the caregiver details page custom code block.
 * Make sure variables are NOT declared multiple times.
 *
 * Version: 1.0
 * Date: 2025-10-23
 */

(function() {
  'use strict';

  const TAG = '[JoinSessionButton]';

  /**
   * Handles the join session button click
   * @param {string} zoomMeetingUrl - The Zoom meeting URL
   * @param {string} sessionIdParam - The session ID (optional)
   */
  function handleJoinSession(zoomMeetingUrl, sessionIdParam) {
    console.log(TAG, 'Join session clicked');
    console.log(TAG, 'Zoom URL:', zoomMeetingUrl);
    console.log(TAG, 'Session ID:', sessionIdParam);

    // Validate meeting URL
    if (!zoomMeetingUrl || zoomMeetingUrl.trim() === '') {
      console.error(TAG, 'No meeting URL provided');
      alert('Unable to start meeting: No meeting URL found. Please contact support.');
      return;
    }

    // Build the meeting page URL with parameters
    const meetingPageUrl = new URL('/meeting', window.location.origin);
    meetingPageUrl.searchParams.set('meetingUrl', zoomMeetingUrl);

    if (sessionIdParam) {
      meetingPageUrl.searchParams.set('sessionId', sessionIdParam);
    }

    console.log(TAG, 'Redirecting to:', meetingPageUrl.toString());

    // Redirect to meeting page
    window.location.href = meetingPageUrl.toString();
  }

  /**
   * Extracts caregiver ID from URL parameters
   * @returns {string|null} The caregiver ID or null if not found
   */
  function getCaregiverIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('caregiver_id') || params.get('caregiverId') || params.get('id');
  }

  /**
   * Extracts Zoom meeting URL from the page
   * This function looks for the meeting URL in various possible locations
   * @returns {string|null} The Zoom meeting URL or null if not found
   */
  function getZoomMeetingUrl() {
    // Method 1: Check if URL is in a data attribute
    const meetingElement = document.querySelector('[data-zoom-url]');
    if (meetingElement) {
      return meetingElement.getAttribute('data-zoom-url');
    }

    // Method 2: Check if URL is in a hidden input field
    const hiddenInput = document.querySelector('input[name="zoom_meeting_url"], input[name="meetingUrl"]');
    if (hiddenInput) {
      return hiddenInput.value;
    }

    // Method 3: Check if URL is in the page's Softr data
    if (window.softrPageData && window.softrPageData.zoomMeetingUrl) {
      return window.softrPageData.zoomMeetingUrl;
    }

    // Method 4: Look for a link with 'zoom.us' in it
    const zoomLink = document.querySelector('a[href*="zoom.us"]');
    if (zoomLink) {
      return zoomLink.href;
    }

    console.warn(TAG, 'Could not find Zoom meeting URL on page');
    return null;
  }

  /**
   * Initializes the join session button handler
   */
  function init() {
    console.log(TAG, 'Initializing join session button handler...');

    // Find all "Join Session" buttons
    const buttons = document.querySelectorAll('button, a, [role="button"]');

    buttons.forEach(button => {
      const buttonText = button.textContent.trim().toLowerCase();

      if (buttonText.includes('join session') ||
          buttonText.includes('start meeting') ||
          buttonText.includes('join meeting')) {

        console.log(TAG, 'Found join session button:', button);

        // Add click handler
        button.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();

          // Get the meeting URL
          const meetingUrl = getZoomMeetingUrl();

          if (!meetingUrl) {
            alert('Unable to start meeting: Meeting URL not found. Please contact support.');
            return;
          }

          // Get session ID (could be from URL or button data attribute)
          const sessionId = button.getAttribute('data-session-id') || getCaregiverIdFromUrl();

          // Handle the join session
          handleJoinSession(meetingUrl, sessionId);
        });
      }
    });

    console.log(TAG, 'Join session button handler initialized');
  }

  // Run initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for debugging and manual triggering
  window.JoinSessionHandler = {
    version: '1.0',
    handleJoinSession: handleJoinSession,
    getZoomMeetingUrl: getZoomMeetingUrl,
    getCaregiverIdFromUrl: getCaregiverIdFromUrl,
    reinitialize: init
  };

})();
