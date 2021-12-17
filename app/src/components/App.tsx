import React, { useEffect } from "react";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema, DOMParser } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";
import { exampleSetup } from "prosemirror-example-setup";
import {
  collab,
  receiveTransaction,
  getVersion,
  sendableSteps,
} from "prosemirror-collab";

import "./App.css";
import { AuthorityType } from "../types";
import Authority from "./CentralAuthority";
import socketIOClient, { Socket } from "socket.io-client";

const ENDPOINT = "http://127.0.0.1:4001";

function collabEditor(
  authority: AuthorityType,
  place: any,
  mySchema: Schema,
  socket: Socket
) {
  const examplePlugins = exampleSetup({ schema: mySchema });
  const state = EditorState.create({
    doc: authority.doc,
    plugins: [
      ...examplePlugins,
      collab({ version: authority.steps.length }),
    ],
  });
  let view = new EditorView(place, {
    state,
    dispatchTransaction(transaction) {
      let newState = view.state.apply(transaction);
      view.updateState(newState);
      let sendable = sendableSteps(newState);
      if (sendable) {
        let newDoc = authority.receiveSteps(
          sendable.version,
          sendable.steps,
          sendable.clientID
        );
        if (newDoc) {
          socket.emit("update", {
            doc: newDoc,
            clientId: sendable.clientID,
            version: sendable.version,
            steps: sendable.steps,
          });
        }
      }
    },
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
    let myAuthority: any;
    socket.emit("hello");
    socket.on("init", (data) => {
      if (!(window as any).view) {
        const doc = data
          ? mySchema.nodeFromJSON(data)
          : DOMParser.fromSchema(mySchema).parse(
              document.querySelector("#content") as Node
            );
        myAuthority = new Authority(doc);
        const place = document.querySelector("#editor") as Node;
        const myView = collabEditor(myAuthority, place, mySchema, socket);
        (window as any).view = myView;
      }
    });
    socket.on("updateDoc", (data) => {
      const examplePlugins = exampleSetup({ schema: mySchema });
      const doc = mySchema.nodeFromJSON(data.doc);
      myAuthority.doc = doc;
      const newState = EditorState.create({
        doc: doc,
        plugins: [
          ...examplePlugins,
          collab({ version: myAuthority.steps.length }),
        ],
      });
      (window as any).view.updateState(newState);
    });

    return () => {
      if (!!socket) socket.disconnect();
      if ((window as any).view) {
        (window as any).view.destroy();
        (window as any).view = undefined;
      }
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
