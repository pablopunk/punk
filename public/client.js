async function initializeClient() {
  const React = await import("/node_modules/react/umd/react.development.js");
  const ReactDOM = await import(
    "/node_modules/react-dom/umd/react-dom.development.js"
  );

  async function hydrate() {
    const pathname = window.location.pathname;
    const componentId =
      pathname === "/" ? "index" : pathname.slice(1).replace(/\//g, "_");
    const Component = await import(`./${componentId}.tsx`);

    ReactDOM.hydrateRoot(document, React.createElement(Component));
  }

  hydrate();
}

initializeClient();
