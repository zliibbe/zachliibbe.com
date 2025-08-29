'use client';

import React, { useEffect, useRef } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';

// Create a wrapped version of CalendarHeatmap that filters out React internal props
const SafeCalendarHeatmap = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof CalendarHeatmap>
>((props, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Clean up DOM elements in real-time
  useEffect(() => {
    if (!containerRef.current) return;

    // Function to clean attributes from an element
    const cleanElement = (element: Element) => {
      const attributesToRemove: string[] = [];

      // Check all attributes
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        const name = attr.name;

        // Remove React internal props and styled-components props
        if (
          name === '$$typeof' ||
          name.includes('$styled') ||
          name.includes('$theme') ||
          name.includes('__reactInternalInstance') ||
          name.includes('__reactEventHandlers') ||
          (name.startsWith('$') && name !== '$') ||
          (name.startsWith('__') && !name.startsWith('__data'))
        ) {
          attributesToRemove.push(name);
        }
      }

      // Remove the problematic attributes
      attributesToRemove.forEach(attrName => {
        element.removeAttribute(attrName);
      });
    };

    // Clean existing elements
    const cleanAllElements = () => {
      const allElements = containerRef.current?.querySelectorAll('*');
      allElements?.forEach(cleanElement);
    };

    // Initial cleanup
    const timeoutId = setTimeout(cleanAllElements, 0);

    // Set up MutationObserver to clean new elements as they're added
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              cleanElement(element);
              // Also clean any children
              const children = element.querySelectorAll('*');
              children.forEach(cleanElement);
            }
          });
        }

        if (mutation.type === 'attributes') {
          const target = mutation.target as Element;
          if (
            mutation.attributeName &&
            (mutation.attributeName === '$$typeof' ||
              mutation.attributeName.includes('$styled') ||
              mutation.attributeName.includes('$theme') ||
              mutation.attributeName.startsWith('__react'))
          ) {
            target.removeAttribute(mutation.attributeName);
          }
        }
      });
    });

    // Start observing
    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        '$$typeof',
        '$styled',
        '$theme',
        '__reactInternalInstance',
      ],
    });

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  // Filter out problematic props from the component itself
  const cleanProps = Object.keys(props).reduce(
    (acc, key) => {
      // Don't pass through React internal props or styled-components props
      if (
        key !== '$$typeof' &&
        key !== '__self' &&
        key !== '__source' &&
        !key.includes('$styled') &&
        !key.includes('$theme')
      ) {
        (acc as any)[key] = (props as any)[key];
      }
      return acc;
    },
    {} as React.ComponentProps<typeof CalendarHeatmap>
  );

  return (
    <div ref={containerRef}>
      <CalendarHeatmap {...cleanProps} />
    </div>
  );
});

SafeCalendarHeatmap.displayName = 'SafeCalendarHeatmap';

export default SafeCalendarHeatmap;
