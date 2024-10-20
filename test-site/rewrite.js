(function() {
    const proxyUrl = 'https://script-monitor-staging.evervault.workers.dev/';

    // Function to proxy script elements
    function proxyScripts() {
      const scripts = document.getElementsByTagName('script');
      const scriptsToProcess = [];

      // Collect scripts to process (excluding this script)
      for (let script of scripts) {
        if (script === document.currentScript || script.getAttribute('data-proxied')) continue;
        scriptsToProcess.push(script);
      }

      for (let script of scriptsToProcess) {
        // Prevent the script from loading
        script.type = 'javascript/blocked';

        if (script.src) {
          // Clone the script element
          const newScript = document.createElement('script');

          // Copy attributes and modify the src
          for (let attr of script.attributes) {
            if (attr.name === 'src') {
              // Prepend proxy URL
              const originalSrc = script.getAttribute('src');
              const absoluteSrc = new URL(originalSrc, document.baseURI).href;
              newScript.src = proxyUrl + absoluteSrc;
            } else if (attr.name !== 'type') {
              // Copy all attributes except type
              newScript.setAttribute(attr.name, attr.value);
            }
          }

          // Mark as proxied
          newScript.setAttribute('data-proxied', 'true');

          // Replace the old script with the new one
          script.parentNode.replaceChild(newScript, script);
        } else {
          // Handle inline scripts if necessary
          // For now, you can choose to leave them or remove them
        }
      }
    }

    // Run the proxying function immediately
    proxyScripts();

    // Observe the document for any new scripts added dynamically
    const observer = new MutationObserver((mutations) => {
      for (let mutation of mutations) {
        for (let node of mutation.addedNodes) {
          if (node.tagName === 'SCRIPT' && !node.getAttribute('data-proxied')) {
            proxyScripts();
            break; // Re-run proxyScripts after handling new scripts
          }
        }
      }
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
  })();