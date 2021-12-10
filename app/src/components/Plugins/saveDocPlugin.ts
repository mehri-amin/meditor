import { Plugin, PluginKey } from "prosemirror-state";
import { Socket } from "socket.io-client";
export const saveRetrieveDocPluginKey = new PluginKey("saveRetrieveDoc");

export const saveRetrieveDocPlugin = ({ socket }: { socket: Socket }) => {
  return new Plugin({
    key: saveRetrieveDocPluginKey,
    state: {
      init(config, state) {
      },
      apply(tr) {
        if (tr.docChanged) {
          socket.emit("saveData", JSON.stringify(tr.doc.toJSON()));
          socket.on("updateData", () => {
            socket.emit("getData");
          });
        }
      },
    },
  });
};
