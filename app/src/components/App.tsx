import React, { useEffect } from "react";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema, DOMParser } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";
import { exampleSetup } from "prosemirror-example-setup";
import "./App.css";

/**
 * TO-DO:
 * prosemirror-example-setup is a placeholder. Will need to
 * replace later as its not production ready code. These
 * plugins are created by the example setup:
 * - Input rules
 * - Keymaps
 * - Drop Cursor and Gap Cursor
 * - Undo history
 * - Menu bar
 */

function App() {
  useEffect(() => {
    const mySchema = new Schema({
      nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
      marks: schema.spec.marks,
    });

    (window as any).view = new EditorView(
      document.querySelector("#editor") as Node,
      {
        state: EditorState.create({
          doc: DOMParser.fromSchema(mySchema).parse(
            document.querySelector("#content") as Node
          ),
          plugins: exampleSetup({ schema: mySchema }),
        }),
      }
    );
  });
  return (
    <div className="App">
      <div id="editor" />
      <div id="content" />
    </div>
  );
}

export default App;
