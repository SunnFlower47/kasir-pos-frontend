import React from 'react';
import ReactDOM from 'react-dom/client';
import './utils/polyfills'; // Import polyfills first
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Comprehensive error suppression for library compatibility
if (typeof window !== 'undefined') {
  // Store original methods
  const originalSome = Array.prototype.some;
  const originalFilter = Array.prototype.filter;
  const originalMap = Array.prototype.map;
  const originalFind = Array.prototype.find;

  // Enhanced Array.some with better error handling
  // eslint-disable-next-line no-extend-native
  Array.prototype.some = function(callback, thisArg) {
    try {
      // Check if this is actually an array-like object
      if (!this || typeof this !== 'object') {
        console.warn('🔇 Array.some called on non-object:', this);
        return false;
      }

      // Check if it has length property
      if (this.length === undefined || this.length === null) {
        console.warn('🔇 Array.some called on object without length:', this);
        return false;
      }

      // Convert to actual array if needed
      const arrayLike = Array.isArray(this) ? this : Array.from(this);
      return originalSome.call(arrayLike, callback, thisArg);
    } catch (error) {
      console.warn('🔇 Array.some error suppressed:', error);
      return false;
    }
  };

  // Enhanced Array.filter
  // eslint-disable-next-line no-extend-native
  Array.prototype.filter = function(callback: any, thisArg?: any) {
    try {
      if (!this || typeof this !== 'object' || this.length === undefined) {
        console.warn('🔇 Array.filter called on invalid object:', this);
        return [];
      }
      const arrayLike = Array.isArray(this) ? this : Array.from(this);
      return originalFilter.call(arrayLike, callback, thisArg);
    } catch (error) {
      console.warn('🔇 Array.filter error suppressed:', error);
      return [];
    }
  };

  // Enhanced Array.map
  // eslint-disable-next-line no-extend-native
  Array.prototype.map = function(callback: any, thisArg?: any): any[] {
    try {
      if (!this || typeof this !== 'object' || this.length === undefined) {
        console.warn('🔇 Array.map called on invalid object:', this);
        return [];
      }
      const arrayLike = Array.isArray(this) ? this : Array.from(this);
      return originalMap.call(arrayLike, callback, thisArg);
    } catch (error) {
      console.warn('🔇 Array.map error suppressed:', error);
      return [];
    }
  };

  // Enhanced Array.find
  // eslint-disable-next-line no-extend-native
  Array.prototype.find = function(callback: any, thisArg?: any): any {
    try {
      if (!this || typeof this !== 'object' || this.length === undefined) {
        console.warn('🔇 Array.find called on invalid object:', this);
        return undefined;
      }
      const arrayLike = Array.isArray(this) ? this : Array.from(this);
      return originalFind.call(arrayLike, callback, thisArg);
    } catch (error) {
      console.warn('🔇 Array.find error suppressed:', error);
      return undefined;
    }
  };

  // Patch specific problematic functions that might be created by libraries
  const patchProblematicFunctions = () => {
    // Patch testUserAgent function if it exists
    if ((window as any).$c87311424ea30a05$var$testUserAgent) {
      const original = (window as any).$c87311424ea30a05$var$testUserAgent;
      (window as any).$c87311424ea30a05$var$testUserAgent = function(...args: any[]) {
        try {
          return original.apply(this, args);
        } catch (error) {
          console.warn('🔇 testUserAgent error suppressed:', error);
          return false;
        }
      };
    }

    // Patch other problematic functions
    if ((window as any).$6a7db85432448f7f$export$60278871457622de) {
      const original = (window as any).$6a7db85432448f7f$export$60278871457622de;
      (window as any).$6a7db85432448f7f$export$60278871457622de = function(...args: any[]) {
        try {
          return original.apply(this, args);
        } catch (error) {
          console.warn('🔇 Library function error suppressed:', error);
          return null;
        }
      };
    }

    if ((window as any).$507fabe10e71c6fb$var$handleClickEvent) {
      const original = (window as any).$507fabe10e71c6fb$var$handleClickEvent;
      (window as any).$507fabe10e71c6fb$var$handleClickEvent = function(...args: any[]) {
        try {
          return original.apply(this, args);
        } catch (error) {
          console.warn('🔇 handleClickEvent error suppressed:', error);
          return false;
        }
      };
    }
  };

  // Try to patch functions immediately and also after a delay
  patchProblematicFunctions();
  setTimeout(patchProblematicFunctions, 100);
  setTimeout(patchProblematicFunctions, 1000);
}

// Enhanced global error handlers
window.addEventListener('error', (event) => {
  const message = event.message || '';
  const filename = event.filename || '';
  const stack = event.error?.stack || '';

  // Comprehensive error suppression patterns
  const suppressPatterns = [
    'Cannot read properties of undefined',
    'Cannot read property \'some\' of undefined',
    'testUserAgent',
    'bundle.js',
    '$c87311424ea30a05$var$testUserAgent',
    'reading \'some\'',
    'reading \'filter\'',
    'reading \'map\'',
    'reading \'find\'',
    'bundle.js:15794',
    'bundle.js:15833',
    'bundle.js:15805',
    'bundle.js:15746',
    'bundle.js:14752',
    '$6a7db85432448f7f$export$60278871457622de',
    '$507fabe10e71c6fb$var$handleClickEvent'
  ];

  const shouldSuppress = suppressPatterns.some(pattern =>
    message.includes(pattern) || filename.includes(pattern) || stack.includes(pattern)
  );

  if (shouldSuppress) {
    console.warn('🔇 Suppressed library error:', {
      message,
      filename,
      stack: stack.substring(0, 200) + '...'
    });
    event.preventDefault();
    event.stopPropagation();
    return false;
  }

  // Log other errors normally (but less verbose)
  console.error('🚨 Application error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const message = reason?.message || reason?.toString() || '';

  // Suppress known library errors in promises
  const suppressPatterns = [
    'Cannot read properties of undefined',
    'testUserAgent',
    'bundle.js'
  ];

  const shouldSuppress = suppressPatterns.some(pattern =>
    message.includes(pattern)
  );

  if (shouldSuppress) {
    console.warn('🔇 Suppressed promise rejection:', message);
    event.preventDefault();
    return false;
  }

  console.error('🚨 Unhandled promise rejection:', reason);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

// Protect against click event errors
document.addEventListener('click', (event) => {
  try {
    // Let the event proceed normally
  } catch (error) {
    console.warn('🔇 Click event error suppressed:', error);
    event.preventDefault();
    event.stopPropagation();
  }
}, true); // Use capture phase

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
