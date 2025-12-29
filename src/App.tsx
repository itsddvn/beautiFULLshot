// App - Root application component

import { EditorLayout } from "./components/layout/editor-layout";
import { useKeyboardShortcuts } from "./hooks/use-keyboard-shortcuts";

function App() {
  // Initialize global keyboard shortcuts
  useKeyboardShortcuts();

  return <EditorLayout />;
}

export default App;
