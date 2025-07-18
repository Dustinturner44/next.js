export function register() {
  console.log('Client instrumentation loaded');

  if (typeof window !== 'undefined') {
    console.log('Initializing client-side OTEL instrumentation');
    
    // Critique tool implementation
    let isDrawing = false;
    let startX = 0;
    let startY = 0;
    let currentBox: HTMLDivElement | null = null;
    let overlay: HTMLDivElement | null = null;

    // Create overlay for drawing
    function createOverlay() {
      overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.zIndex = "999999";
      overlay.style.pointerEvents = "none";
      overlay.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
      
      // Add instruction banner
      const banner = document.createElement("div");
      banner.id = "critique-banner";
      banner.style.position = "fixed";
      banner.style.top = "20px";
      banner.style.left = "50%";
      banner.style.transform = "translateX(-50%)";
      banner.style.backgroundColor = "#ff0066";
      banner.style.color = "white";
      banner.style.padding = "8px 16px";
      banner.style.borderRadius = "4px";
      banner.style.fontSize = "14px";
      banner.style.fontWeight = "500";
      banner.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
      banner.style.zIndex = "1000001";
      banner.style.display = "none";
      banner.textContent = "Critique Mode: Click and drag to add comments";
      
      document.body.appendChild(overlay);
      document.body.appendChild(banner);
    }

    // Create bounding box element
    function createBoundingBox(x: number, y: number) {
      const box = document.createElement("div");
      box.style.position = "fixed";
      box.style.border = "2px solid #ff0066";
      box.style.backgroundColor = "rgba(255, 0, 102, 0.1)";
      box.style.left = `${x}px`;
      box.style.top = `${y}px`;
      box.style.width = "0px";
      box.style.height = "0px";
      box.style.pointerEvents = "none";
      box.style.zIndex = "999999";
      return box;
    }

    // Create comment input
    function createCommentInput(x: number, y: number, width: number, height: number) {
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = `${x}px`;
      container.style.top = `${y + height + 5}px`;
      container.style.zIndex = "1000000";
      container.style.backgroundColor = "white";
      container.style.border = "2px solid #ff0066";
      container.style.borderRadius = "4px";
      container.style.padding = "8px";
      container.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";

      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Add comment...";
      input.style.border = "none";
      input.style.outline = "none";
      input.style.fontSize = "14px";
      input.style.width = "200px";
      input.style.marginRight = "8px";

      const submitBtn = document.createElement("button");
      submitBtn.textContent = "Add";
      submitBtn.style.padding = "4px 12px";
      submitBtn.style.backgroundColor = "#ff0066";
      submitBtn.style.color = "white";
      submitBtn.style.border = "none";
      submitBtn.style.borderRadius = "4px";
      submitBtn.style.cursor = "pointer";
      submitBtn.style.fontSize = "14px";

      const cancelBtn = document.createElement("button");
      cancelBtn.textContent = "Cancel";
      cancelBtn.style.padding = "4px 12px";
      cancelBtn.style.backgroundColor = "#ccc";
      cancelBtn.style.color = "black";
      cancelBtn.style.border = "none";
      cancelBtn.style.borderRadius = "4px";
      cancelBtn.style.cursor = "pointer";
      cancelBtn.style.fontSize = "14px";
      cancelBtn.style.marginLeft = "4px";

      container.appendChild(input);
      container.appendChild(submitBtn);
      container.appendChild(cancelBtn);

      return { container, input, submitBtn, cancelBtn };
    }

    // Enable critique mode with Ctrl+Shift+C
    function toggleCritiqueMode() {
      if (!overlay) {
        createOverlay();
      }

      const critiqueMode = !overlay?.style.pointerEvents || overlay.style.pointerEvents === "none";
      
      if (critiqueMode) {
        overlay!.style.pointerEvents = "auto";
        overlay!.style.cursor = "crosshair";
        console.log("Critique mode enabled");
      } else {
        overlay!.style.pointerEvents = "none";
        overlay!.style.cursor = "default";
        console.log("Critique mode disabled");
      }
    }

    // Expose toggle function globally
    (window as any).toggleCritiqueMode = toggleCritiqueMode;

    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "C") {
        e.preventDefault();
        toggleCritiqueMode();
      }
    });

    // Mouse event handlers
    document.addEventListener("mousedown", (e) => {
      if (overlay && overlay.style.pointerEvents === "auto" && e.target === overlay) {
        isDrawing = true;
        startX = e.clientX;
        startY = e.clientY;

        currentBox = createBoundingBox(startX, startY);
        document.body.appendChild(currentBox);
      }
    });

    document.addEventListener("mousemove", (e) => {
      if (isDrawing && currentBox) {
        const width = Math.abs(e.clientX - startX);
        const height = Math.abs(e.clientY - startY);
        const left = Math.min(e.clientX, startX);
        const top = Math.min(e.clientY, startY);

        currentBox.style.left = `${left}px`;
        currentBox.style.top = `${top}px`;
        currentBox.style.width = `${width}px`;
        currentBox.style.height = `${height}px`;
      }
    });

    document.addEventListener("mouseup", (e) => {
      if (isDrawing && currentBox && overlay) {
        isDrawing = false;
        
        const width = Math.abs(e.clientX - startX);
        const height = Math.abs(e.clientY - startY);
        const left = Math.min(e.clientX, startX);
        const top = Math.min(e.clientY, startY);

        if (width > 10 && height > 10) {
          // Show comment input
          const { container, input, submitBtn, cancelBtn } = createCommentInput(left, top, width, height);
          document.body.appendChild(container);

          // Focus input
          input.focus();

          // Handle submit
          const handleSubmit = async () => {
            const comment = input.value.trim();
            if (comment) {
              try {
                await fetch("http://localhost:50631/api/critiques", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    bbox: { x: left, y: top, width, height },
                    comment,
                    url: window.location.href,
                  }),
                });
                console.log("Critique saved:", comment);
              } catch (err) {
                console.error("Failed to save critique:", err);
              }
            }
            
            // Clean up
            container.remove();
            currentBox?.remove();
            currentBox = null;
          };

          // Handle cancel
          const handleCancel = () => {
            container.remove();
            currentBox?.remove();
            currentBox = null;
          };

          submitBtn.onclick = handleSubmit;
          cancelBtn.onclick = handleCancel;
          
          // Submit on Enter
          input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
              handleSubmit();
            } else if (e.key === "Escape") {
              handleCancel();
            }
          });

          // Disable critique mode after adding comment
          overlay.style.pointerEvents = "none";
          overlay.style.cursor = "default";
        } else {
          // Box too small, remove it
          currentBox.remove();
          currentBox = null;
        }
      }
    });

    console.log("Critique tool ready - press Ctrl+Shift+C to enable");
    
    // Load modern-screenshot from CDN
    const loadScreenshotLibrary = () => {
      if (!(window as any).modernScreenshotLoaded) {
        const script = document.createElement('script');
        script.type = 'module';
        script.textContent = `
          import { domToPng } from 'https://unpkg.com/modern-screenshot@4.4.38/dist/index.js';
          window.domToPng = domToPng;
          window.modernScreenshotLoaded = true;
          console.log('Modern screenshot library loaded');
        `;
        document.head.appendChild(script);
      }
    };
    
    loadScreenshotLibrary();
    
    // Video recording functionality
    let mediaRecorder: MediaRecorder | null = null;
    let recordedChunks: Blob[] = [];
    let isRecording = false;
    let recordingStream: MediaStream | null = null;
    
    // Create recording UI
    function createRecordingUI() {
      const container = document.createElement('div');
      container.id = 'video-recording-ui';
      container.style.position = 'fixed';
      container.style.top = '20px';
      container.style.right = '20px';
      container.style.zIndex = '1000000';
      container.style.backgroundColor = 'white';
      container.style.padding = '12px';
      container.style.borderRadius = '8px';
      container.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
      container.style.display = 'none';
      
      const recordBtn = document.createElement('button');
      recordBtn.id = 'record-btn';
      recordBtn.textContent = 'Start Recording';
      recordBtn.style.padding = '8px 16px';
      recordBtn.style.backgroundColor = '#ff0066';
      recordBtn.style.color = 'white';
      recordBtn.style.border = 'none';
      recordBtn.style.borderRadius = '4px';
      recordBtn.style.cursor = 'pointer';
      recordBtn.style.fontSize = '14px';
      recordBtn.style.fontWeight = '500';
      
      const status = document.createElement('div');
      status.id = 'recording-status';
      status.style.marginTop = '8px';
      status.style.fontSize = '12px';
      status.style.color = '#666';
      status.style.display = 'none';
      
      container.appendChild(recordBtn);
      container.appendChild(status);
      document.body.appendChild(container);
      
      return { container, recordBtn, status };
    }
    
    // Initialize recording UI
    const recordingUI = createRecordingUI();
    
    // Start screen recording
    async function startRecording() {
      try {
        // Request screen capture with auto-tab selection
        recordingStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: 'browser'
          },
          audio: false,
          preferCurrentTab: true
        } as any);
        
        // Create MediaRecorder
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
          ? 'video/webm;codecs=vp9' 
          : 'video/webm';
          
        mediaRecorder = new MediaRecorder(recordingStream, {
          mimeType,
          videoBitsPerSecond: 2500000
        });
        
        recordedChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunks.push(event.data);
          }
        };
        
        mediaRecorder.onstop = async () => {
          const blob = new Blob(recordedChunks, { type: 'video/webm' });
          await sendVideoToDevTool(blob);
          
          // Clean up
          recordedChunks = [];
          recordingStream?.getTracks().forEach(track => track.stop());
          recordingStream = null;
        };
        
        // Handle stream end (user stops sharing)
        recordingStream.getVideoTracks()[0].onended = () => {
          if (isRecording) {
            stopRecording();
          }
        };
        
        mediaRecorder.start();
        isRecording = true;
        
        // Update UI
        recordingUI.recordBtn.textContent = 'Stop Recording';
        recordingUI.recordBtn.style.backgroundColor = '#ff3333';
        recordingUI.status.textContent = 'Recording...';
        recordingUI.status.style.display = 'block';
        recordingUI.status.style.color = '#ff3333';
        
        console.log('Screen recording started');
      } catch (error) {
        console.error('Failed to start recording:', error);
        recordingUI.status.textContent = 'Failed to start recording';
        recordingUI.status.style.color = '#ff3333';
        recordingUI.status.style.display = 'block';
      }
    }
    
    // Stop screen recording
    function stopRecording() {
      if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        
        // Update UI
        recordingUI.recordBtn.textContent = 'Start Recording';
        recordingUI.recordBtn.style.backgroundColor = '#ff0066';
        recordingUI.status.textContent = 'Processing video...';
        recordingUI.status.style.color = '#666';
        
        console.log('Screen recording stopped');
      }
    }
    
    // Send video to dev tool
    async function sendVideoToDevTool(blob: Blob) {
      try {
        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          
          // Send to dev tool
          const response = await fetch('http://localhost:63423/api/video-recording', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              videoData: base64data,
              metadata: {
                url: window.location.href,
                timestamp: new Date().toISOString(),
                duration: recordedChunks.length,
                mimeType: blob.type,
                size: blob.size
              }
            })
          });
          
          if (response.ok) {
            recordingUI.status.textContent = 'Video saved successfully!';
            recordingUI.status.style.color = '#00aa00';
            
            // Notify parent iframe if exists
            if (window.parent !== window) {
              window.parent.postMessage({
                type: 'VIDEO_RECORDING_COMPLETE',
                data: await response.json()
              }, '*');
            }
            
            setTimeout(() => {
              recordingUI.status.style.display = 'none';
            }, 3000);
          } else {
            throw new Error('Failed to save video');
          }
        };
      } catch (error) {
        console.error('Failed to send video:', error);
        recordingUI.status.textContent = 'Failed to save video';
        recordingUI.status.style.color = '#ff3333';
      }
    }
    
    // Toggle recording
    recordingUI.recordBtn.onclick = () => {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    };
    
    // Expose recording functions globally
    (window as any).startVideoRecording = startRecording;
    (window as any).stopVideoRecording = stopRecording;
    (window as any).toggleVideoRecording = () => {
      recordingUI.container.style.display = 
        recordingUI.container.style.display === 'none' ? 'block' : 'none';
    };
    
    // Add keyboard shortcut (Ctrl/Cmd + Shift + R)
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        (window as any).toggleVideoRecording();
      }
    });
    
    console.log('Video recording ready - press Ctrl/Cmd+Shift+R to toggle UI');
    
    // DOM logging functionality
    let domObserver: MutationObserver | null = null;
    let domEventListeners: Array<{ event: string; handler: EventListener }> = [];
    let isDOMLoggingEnabled = false;
    
    // Helper function to get element selector for DOM logging
    const getDOMElementSelector = (element: Element): string => {
      if (element.id) return `#${element.id}`;
      if (element.className) {
        const classes = element.className.split(' ').filter(c => c).join('.');
        if (classes) return `.${classes}`;
      }
      return element.tagName.toLowerCase();
    };

    // Helper function to send DOM data to dev tool
    const sendDOMLogData = async (data: any) => {
      try {
        await fetch('http://localhost:61905/api/dom-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            url: window.location.href,
            timestamp: Date.now()
          })
        });
      } catch (error) {
        console.error('Failed to send DOM log data:', error);
      }
    };

    // Start DOM mutation observer
    const startDOMMutationObserver = () => {
      if (domObserver) return;

      domObserver = new MutationObserver((mutations) => {
        if (!isDOMLoggingEnabled) return;
        
        mutations.forEach((mutation) => {
          const target = mutation.target as Element;
          const selector = target instanceof Element ? getDOMElementSelector(target) : 'text-node';
          
          const mutationData = {
            type: 'mutation',
            target: selector,
            details: {
              mutationType: mutation.type,
              addedNodes: mutation.addedNodes.length,
              removedNodes: mutation.removedNodes.length,
              attributeName: mutation.attributeName,
              oldValue: mutation.oldValue
            }
          };

          sendDOMLogData(mutationData);
        });
      });

      domObserver.observe(document.body, {
        childList: true,
        attributes: true,
        characterData: true,
        subtree: true,
        attributeOldValue: true,
        characterDataOldValue: true
      });

      console.log('DOM Logger: MutationObserver started');
    };

    // Set up DOM event listeners
    const setupDOMEventListeners = () => {
      const eventsToTrack = [
        'click', 'dblclick', 'mouseenter', 'mouseleave',
        'focus', 'blur', 'input', 'change', 'submit',
        'keydown', 'keyup', 'scroll', 'resize'
      ];

      eventsToTrack.forEach(eventType => {
        const handler = (event: Event) => {
          if (!isDOMLoggingEnabled) return;
          
          const target = event.target as Element;
          if (!target) return;

          const selector = target instanceof Element ? getDOMElementSelector(target) : 'unknown';
          
          const eventData = {
            type: 'event',
            target: selector,
            details: {
              eventType: event.type,
              timestamp: event.timeStamp,
              isTrusted: event.isTrusted,
              bubbles: event.bubbles
            }
          };

          // Add event-specific details
          if (event instanceof MouseEvent) {
            eventData.details.coordinates = {
              x: event.clientX,
              y: event.clientY
            };
          } else if (event instanceof KeyboardEvent) {
            eventData.details.key = event.key;
            eventData.details.code = event.code;
          } else if (event instanceof InputEvent) {
            eventData.details.inputType = event.inputType;
            eventData.details.data = event.data;
          }

          sendDOMLogData(eventData);
        };

        document.addEventListener(eventType, handler, true);
        domEventListeners.push({ event: eventType, handler });
      });

      console.log('DOM Logger: Event listeners set up');
    };

    // Initialize DOM logging
    const initializeDOMLogging = () => {
      startDOMMutationObserver();
      setupDOMEventListeners();
      
      // Send initial snapshot
      sendDOMLogData({
        type: 'snapshot',
        target: 'body',
        details: {
          nodeCount: document.querySelectorAll('*').length,
          ready: true,
          pageTitle: document.title,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        }
      });
    };

    // Toggle DOM logging
    (window as any).toggleDOMLogging = () => {
      isDOMLoggingEnabled = !isDOMLoggingEnabled;
      console.log(`DOM logging ${isDOMLoggingEnabled ? 'enabled' : 'disabled'}`);
      
      if (isDOMLoggingEnabled) {
        // Send a notification that logging started
        sendDOMLogData({
          type: 'event',
          target: 'system',
          details: {
            eventType: 'dom-logging-started'
          }
        });
      } else {
        // Send a notification that logging stopped
        sendDOMLogData({
          type: 'event',
          target: 'system',
          details: {
            eventType: 'dom-logging-stopped'
          }
        });
      }
    };

    // Start DOM logging automatically
    (window as any).startDOMLogging = () => {
      isDOMLoggingEnabled = true;
      console.log('DOM logging started');
      sendDOMLogData({
        type: 'event',
        target: 'system',
        details: {
          eventType: 'dom-logging-started'
        }
      });
    };

    // Stop DOM logging
    (window as any).stopDOMLogging = () => {
      isDOMLoggingEnabled = false;
      console.log('DOM logging stopped');
      sendDOMLogData({
        type: 'event',
        target: 'system',
        details: {
          eventType: 'dom-logging-stopped'
        }
      });
    };

    // Initialize after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeDOMLogging);
    } else {
      initializeDOMLogging();
    }

    // Handle page visibility changes for DOM logging
    document.addEventListener('visibilitychange', () => {
      if (isDOMLoggingEnabled) {
        sendDOMLogData({
          type: 'event',
          target: 'document',
          details: {
            eventType: 'visibilitychange',
            hidden: document.hidden
          }
        });
      }
    });

    // Listen for DOM logging commands from dev tool
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'DOM_LOGGING_COMMAND') {
        const { command } = event.data;
        if (command === 'start') {
          (window as any).startDOMLogging();
        } else if (command === 'stop') {
          (window as any).stopDOMLogging();
        } else if (command === 'toggle') {
          (window as any).toggleDOMLogging();
        }
      }
    });

    console.log('DOM Logger ready - use window.startDOMLogging() to begin');
    
    // Navigation tracking with Chrome APIs and loading bar
    let navigationLoadingBar: HTMLDivElement | null = null;
    let currentNavigationId: string | null = null;
    let navigationStartTime: number = 0;
    
    // Create YouTube-style loading bar
    function createLoadingBar() {
      if (navigationLoadingBar) return navigationLoadingBar;
      
      navigationLoadingBar = document.createElement('div');
      navigationLoadingBar.style.position = 'fixed';
      navigationLoadingBar.style.top = '0';
      navigationLoadingBar.style.left = '0';
      navigationLoadingBar.style.width = '0%';
      navigationLoadingBar.style.height = '3px';
      navigationLoadingBar.style.backgroundColor = '#ff0000';
      navigationLoadingBar.style.zIndex = '999999';
      navigationLoadingBar.style.transition = 'width 0.2s ease';
      navigationLoadingBar.style.display = 'none';
      
      document.body.appendChild(navigationLoadingBar);
      return navigationLoadingBar;
    }
    
    // Show loading bar
    function showLoadingBar() {
      const bar = createLoadingBar();
      bar.style.display = 'block';
      bar.style.width = '10%';
      
      // Animate to 80% over time
      let progress = 10;
      const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress > 80) {
          progress = 80;
          clearInterval(interval);
        }
        bar.style.width = progress + '%';
      }, 100);
      
      return interval;
    }
    
    // Complete loading bar
    function completeLoadingBar() {
      if (navigationLoadingBar) {
        navigationLoadingBar.style.width = '100%';
        setTimeout(() => {
          if (navigationLoadingBar) {
            navigationLoadingBar.style.display = 'none';
            navigationLoadingBar.style.width = '0%';
          }
        }, 200);
      }
    }
    
    // Track navigation start
    function trackNavigationStart(url: string, type: string) {
      currentNavigationId = generateTraceId();
      navigationStartTime = Date.now();
      
      const loadingInterval = showLoadingBar();
      
      // Send navigation start event
      fetch('/api/navigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentNavigationId,
          url: url,
          type: 'start',
          timestamp: navigationStartTime
        })
      }).catch(err => console.error('Failed to track navigation start:', err));
      
      // Store interval for cleanup
      (window as any).__navInterval = loadingInterval;
    }
    
    // Track navigation complete
    function trackNavigationComplete(url?: string) {
      if (currentNavigationId) {
        const endTime = Date.now();
        const duration = endTime - navigationStartTime;
        
        // Clear loading animation
        if ((window as any).__navInterval) {
          clearInterval((window as any).__navInterval);
        }
        completeLoadingBar();
        
        // Send navigation complete event
        fetch('/api/navigation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: currentNavigationId,
            url: url || window.location.href,
            type: 'complete',
            timestamp: endTime,
            duration: duration
          })
        }).catch(err => console.error('Failed to track navigation complete:', err));
        
        currentNavigationId = null;
      }
    }
    
    // Track navigation error
    function trackNavigationError(url: string, error: string) {
      if (currentNavigationId) {
        const endTime = Date.now();
        const duration = endTime - navigationStartTime;
        
        // Clear loading animation
        if ((window as any).__navInterval) {
          clearInterval((window as any).__navInterval);
        }
        completeLoadingBar();
        
        fetch('/api/navigation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: currentNavigationId,
            url: url,
            type: 'error',
            timestamp: endTime,
            duration: duration,
            error: error
          })
        }).catch(err => console.error('Failed to track navigation error:', err));
        
        currentNavigationId = null;
      }
    }
    
    // Hook into Chrome Navigation API if available
    if ('navigation' in window) {
      (window as any).navigation.addEventListener('navigate', (event: any) => {
        trackNavigationStart(event.destination.url, 'navigate');
      });
      
      (window as any).navigation.addEventListener('navigatesuccess', (event: any) => {
        trackNavigationComplete();
      });
      
      (window as any).navigation.addEventListener('navigateerror', (event: any) => {
        trackNavigationError(window.location.href, event.error?.message || 'Navigation failed');
      });
    }
    
    // Hook into history API
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      trackNavigationStart(String(args[2] || window.location.href), 'pushState');
      const result = originalPushState.apply(history, args);
      setTimeout(() => trackNavigationComplete(), 100);
      return result;
    };
    
    history.replaceState = function(...args) {
      trackNavigationStart(String(args[2] || window.location.href), 'replaceState');
      const result = originalReplaceState.apply(history, args);
      setTimeout(() => trackNavigationComplete(), 100);
      return result;
    };
    
    // Track popstate (back/forward)
    window.addEventListener('popstate', (event) => {
      trackNavigationStart(window.location.href, 'popstate');
      setTimeout(() => trackNavigationComplete(), 100);
    });
    
    // Track full page loads
    if (document.readyState === 'loading') {
      trackNavigationStart(window.location.href, 'page-load');
      window.addEventListener('load', () => trackNavigationComplete());
    }
    
    // Track link clicks for external navigation
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href && !link.href.startsWith(window.location.origin)) {
        trackNavigationStart(link.href, 'external-link');
        setTimeout(() => trackNavigationComplete(link.href), 50);
      }
    });
    
    console.log('Navigation tracking initialized with loading bar');
    
    // Add screenshot functionality
    (window as any).captureScreenshot = async () => {
      try {
        if (window.parent !== window) {
          return window.parent.postMessage({ 
            type: 'CAPTURE_SCREENSHOT',
            origin: window.location.href
          }, '*');
        }
        
        let attempts = 0;
        while (!(window as any).domToPng && attempts < 20) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (!(window as any).domToPng) {
          throw new Error('Screenshot library not loaded');
        }
        
        const dataUrl = await (window as any).domToPng(document.body);
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        
        const formData = new FormData();
        formData.append('screenshot', blob, 'screenshot.png');
        formData.append('path', window.location.pathname);
        formData.append('url', window.location.href);
        formData.append('timestamp', new Date().toISOString());
        
        await fetch('http://localhost:63380/api/screenshot', {
          method: 'POST',
          body: formData
        });
        
        console.log('Screenshot captured and sent');
        return { success: true };
      } catch (error) {
        console.error('Failed to capture screenshot:', error);
        return { success: false, error };
      }
    };
    
    // Listen for messages from iframes
    window.addEventListener('message', async (event) => {
      if (event.data?.type === 'CAPTURE_SCREENSHOT' && window.parent === window) {
        const result = await (window as any).captureScreenshot();
        event.source?.postMessage({ 
          type: 'SCREENSHOT_RESULT', 
          result 
        }, { targetOrigin: event.origin });
      }
      
      if (event.data?.type === 'TOGGLE_VIDEO_RECORDING') {
        (window as any).toggleVideoRecording?.();
      }
    });
    
    // Add keyboard shortcut (Cmd/Ctrl + Shift + S)
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        (window as any).captureScreenshot();
      }
    });
    
    // Create a simple trace for client-side navigation and interactions
    const sendClientTrace = async (spanData: any) => {
      try {
        await fetch('http://localhost:58422/api/otel/traces', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resourceSpans: [{
              resource: {
                attributes: [
                  { key: 'service.name', value: { stringValue: 'nextjs-client' } },
                  { key: 'service.version', value: { stringValue: '1.0.0' } },
                  { key: 'telemetry.sdk.name', value: { stringValue: 'custom-browser' } }
                ]
              },
              scopeSpans: [{
                spans: [spanData]
              }]
            }]
          })
        });
      } catch (error) {
        console.error('Failed to send client trace:', error);
      }
    };

    // Track page navigation for OTEL traces
    const originalPushStateForOtel = history.pushState;
    
    history.pushState = function(...args) {
      const startTime = Date.now();
      const result = originalPushStateForOtel.apply(history, args);
      
      sendClientTrace({
        traceId: generateTraceId(),
        spanId: generateSpanId(),
        name: `navigate:${args[2]}`,
        kind: 2, // SERVER
        startTimeUnixNano: (startTime * 1000000).toString(),
        endTimeUnixNano: ((startTime + 50) * 1000000).toString(),
        attributes: [
          { key: 'navigation.type', value: { stringValue: 'pushState' } },
          { key: 'navigation.url', value: { stringValue: String(args[2]) } }
        ]
      });
      
      return result;
    };

    // Track fetch requests
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      const startTime = Date.now();
      const [input, init] = args;
      const url = typeof input === 'string' ? input : input.url;
      const method = init?.method || 'GET';
      
      const traceId = generateTraceId();
      const spanId = generateSpanId();
      
      try {
        const response = await originalFetch.apply(window, args);
        const endTime = Date.now();
        
        sendClientTrace({
          traceId,
          spanId,
          name: `${method} ${new URL(url, window.location.origin).pathname}`,
          kind: 3, // CLIENT
          startTimeUnixNano: (startTime * 1000000).toString(),
          endTimeUnixNano: (endTime * 1000000).toString(),
          attributes: [
            { key: 'http.method', value: { stringValue: method } },
            { key: 'http.url', value: { stringValue: url } },
            { key: 'http.status_code', value: { intValue: response.status } },
            { key: 'http.response_content_length', value: { intValue: parseInt(response.headers.get('content-length') || '0') } }
          ],
          status: {
            code: response.ok ? 1 : 2
          }
        });
        
        return response;
      } catch (error: any) {
        const endTime = Date.now();
        
        sendClientTrace({
          traceId,
          spanId,
          name: `${method} ${new URL(url, window.location.origin).pathname}`,
          kind: 3, // CLIENT
          startTimeUnixNano: (startTime * 1000000).toString(),
          endTimeUnixNano: (endTime * 1000000).toString(),
          attributes: [
            { key: 'http.method', value: { stringValue: method } },
            { key: 'http.url', value: { stringValue: url } },
            { key: 'error', value: { boolValue: true } },
            { key: 'error.message', value: { stringValue: error.message } }
          ],
          status: {
            code: 2,
            message: error.message
          }
        });
        
        throw error;
      }
    };

    // Track user interactions
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.tagName === 'A') {
        const startTime = Date.now();
        
        sendClientTrace({
          traceId: generateTraceId(),
          spanId: generateSpanId(),
          name: `click:${target.tagName.toLowerCase()}`,
          kind: 1, // INTERNAL
          startTimeUnixNano: (startTime * 1000000).toString(),
          endTimeUnixNano: ((startTime + 10) * 1000000).toString(),
          attributes: [
            { key: 'user_interaction.type', value: { stringValue: 'click' } },
            { key: 'user_interaction.element', value: { stringValue: target.tagName } },
            { key: 'user_interaction.text', value: { stringValue: target.textContent?.substring(0, 50) || '' } }
          ]
        });
      }
    });

    // Track performance metrics
    window.addEventListener('load', () => {
      const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navTiming) {
        sendClientTrace({
          traceId: generateTraceId(),
          spanId: generateSpanId(),
          name: 'page-load',
          kind: 2, // SERVER
          startTimeUnixNano: (navTiming.fetchStart * 1000000).toString(),
          endTimeUnixNano: (navTiming.loadEventEnd * 1000000).toString(),
          attributes: [
            { key: 'performance.dns', value: { doubleValue: navTiming.domainLookupEnd - navTiming.domainLookupStart } },
            { key: 'performance.tcp', value: { doubleValue: navTiming.connectEnd - navTiming.connectStart } },
            { key: 'performance.ttfb', value: { doubleValue: navTiming.responseStart - navTiming.requestStart } },
            { key: 'performance.dom_ready', value: { doubleValue: navTiming.domContentLoadedEventEnd - navTiming.fetchStart } },
            { key: 'performance.load_complete', value: { doubleValue: navTiming.loadEventEnd - navTiming.fetchStart } }
          ]
        });
      }
    });

    // Helper functions
    function generateTraceId(): string {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    function generateSpanId(): string {
      const bytes = new Uint8Array(8);
      crypto.getRandomValues(bytes);
      return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Component Click Inspector
    console.log("React Component Click Inspector loading...");

    // Helper function to extract React component info from DOM element
    function getReactComponentInfo(element: HTMLElement): any {
      // Try to find React fiber node
      for (const key in element) {
        if (key.startsWith('__reactInternalInstance$') || key.startsWith('__reactFiber')) {
          const fiberNode = (element as any)[key];
          
          if (fiberNode) {
            // Traverse up the fiber tree to find the nearest component
            let current = fiberNode;
            while (current) {
              // Check if this is a component (not a DOM element)
              if (current.elementType && typeof current.elementType !== 'string') {
                const componentType = current.elementType;
                return {
                  name: componentType.displayName || componentType.name || 'Unknown',
                  props: current.memoizedProps,
                  state: current.memoizedState,
                  key: current.key,
                  type: typeof componentType === 'function' ? 
                    (componentType.prototype?.isReactComponent ? 'Class' : 'Function') : 
                    'Other'
                };
              }
              current = current.return;
            }
          }
        }
      }
      
      return null;
    }

    // Helper to get element path
    function getComponentElementPath(element: HTMLElement): string {
      const path: string[] = [];
      let current: HTMLElement | null = element;
      
      while (current && current !== document.body) {
        let selector = current.tagName.toLowerCase();
        
        if (current.id) {
          selector += `#${current.id}`;
        } else if (current.className) {
          selector += `.${current.className.split(' ').join('.')}`;
        }
        
        path.unshift(selector);
        current = current.parentElement;
      }
      
      return path.join(' > ');
    }

    // Click handler with modifier key (hold Alt/Option key)
    document.addEventListener('click', (event) => {
      // Only activate when Alt key is held
      if (!event.altKey) return;
      
      event.preventDefault();
      event.stopPropagation();
      
      const target = event.target as HTMLElement;
      const componentInfo = getReactComponentInfo(target);
      
      const data = {
        timestamp: Date.now(),
        elementPath: getComponentElementPath(target),
        tagName: target.tagName,
        className: target.className,
        id: target.id,
        textContent: target.textContent?.slice(0, 50), // First 50 chars
        componentInfo: componentInfo,
        boundingRect: target.getBoundingClientRect(),
      };
      
      console.log('React Component clicked:', data);
      
      // Send to dev tool endpoint
      fetch('http://localhost:61595/api/component-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(err => console.error('Failed to send component info:', err));
      
      // Visual feedback
      const originalBorder = target.style.border;
      const originalBoxShadow = target.style.boxShadow;
      target.style.border = '2px solid #ff0066';
      target.style.boxShadow = '0 0 10px #ff0066';
      
      setTimeout(() => {
        target.style.border = originalBorder;
        target.style.boxShadow = originalBoxShadow;
      }, 1000);
    }, true); // Use capture phase to catch clicks before React

    // Add visual indicator when Alt key is pressed
    let componentIndicator: HTMLDivElement | null = null;
    
    document.addEventListener('keydown', (event) => {
      if (event.altKey && !componentIndicator) {
        componentIndicator = document.createElement('div');
        componentIndicator.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #ff0066;
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 14px;
          z-index: 999999;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;
        componentIndicator.textContent = '🎯 Component Inspector Active';
        document.body.appendChild(componentIndicator);
      }
    });
    
    document.addEventListener('keyup', (event) => {
      if (!event.altKey && componentIndicator) {
        componentIndicator.remove();
        componentIndicator = null;
      }
    });

    console.log('React Component Inspector ready - Hold Alt/Option key and click any component to inspect it');
  }
}