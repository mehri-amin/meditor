import React, { useEffect } from "react";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema, DOMParser } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";
import { exampleSetup } from "prosemirror-example-setup";
import { collab, receiveTransaction, getVersion } from "prosemirror-collab";

import "./App.css";
import { AuthorityType } from "../types";
import Authority from "./CentralAuthority";
import socketIOClient, { Socket } from "socket.io-client";
import { saveRetrieveDocPlugin } from "./Plugins/saveDocPlugin";

const ENDPOINT = "http://127.0.0.1:4001";

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

/**
 * TO-DO:
 * Each document has a channel. Each client subscribes to the channel
 * to receive latest document state and sending their local steps.
 */

function collabEditor(
  authority: AuthorityType,
  place: any,
  mySchema: Schema,
  socket: Socket,
  isUpdate: boolean
) {
  const examplePlugins = exampleSetup({ schema: mySchema });
  if (isUpdate) {
    const newState = EditorState.create({
      doc: authority.doc,
      plugins: [
        saveRetrieveDocPlugin({ socket }),
        ...examplePlugins,
        collab({ version: authority.steps.length }),
      ],
    });
    ((window as any).view as EditorView).updateState(newState);
    return (window as any).view;
  }
  let view = new EditorView(place, {
    state: EditorState.create({
      doc: authority.doc,
      plugins: [
        saveRetrieveDocPlugin({ socket }),
        ...examplePlugins,
        collab({ version: authority.steps.length }),
      ],
    }),
  });
  authority.onNewSteps.push(function () {
    let newData = authority.stepsSince(getVersion(view.state));
    view.dispatch(
      receiveTransaction(view.state, newData.steps, newData.clientIDs)
    );
  });
  return view;
}

function App() {
  useEffect(() => {
    const socket = socketIOClient(ENDPOINT);

    const mySchema = new Schema({
      nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
      marks: schema.spec.marks,
    });
    socket.emit("getData");
    socket.on("receiveDocument", (data) => {
      const isUpdate = (window as any).view;
      const doc = data
        ? mySchema.nodeFromJSON(JSON.parse(data))
        : DOMParser.fromSchema(mySchema).parse(
            document.querySelector("#content") as Node
          );
      const place = document.querySelector("#editor") as Node;
      const myAuthority = new Authority(doc);
      const myView = collabEditor(
        myAuthority,
        place,
        mySchema,
        socket,
        isUpdate
      );
      (window as any).view = myView;
    });
    socket.on("updateData", () => {
      socket.emit("getData");
    });
    return () => {
      socket.disconnect();
      (window as any).view.destroy();
      (window as any).view = undefined;
    };
  }, []);

  return (
    <div className="App">
      <div id="editor" />
      <div id="content" />
    </div>
  );
}

export default App;
