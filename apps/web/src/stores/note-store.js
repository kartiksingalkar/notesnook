import { db, notesFromContext } from "../common/index";
import createStore from "../common/store";
import { store as editorStore } from "./editor-store";
import Vault from "../common/vault";
import BaseStore from ".";
import { EV } from "notes-core/common";

class NoteStore extends BaseStore {
  notes = [];
  context = undefined;
  selectedNote = 0;

  init = async () => {
    EV.subscribe("notes:removeEmptyNote", (id) => {
      const { session, newSession } = editorStore.get();
      if (session.id === id) {
        newSession();
      }
    });

    /* const note = db.notes.note("b2ce3a6053afab9cb1d8012d").data;
    const delta = await db.delta.raw(note.content.delta);

    const note2 = db.notes.note("b2f68f306c560dab97aa196a").data;
    const delta2 = await db.delta.raw(note2.content.delta);

    const delta3 = { ...delta, conflicted: delta2 };

    await db.delta.add(delta3);
    await db.notes.add({ id: note.id, conflicted: true, resolved: false });
    console.log(delta3); */
  };

  setSelectedNote = (id) => {
    this.set((state) => (state.selectedNote = id));
  };

  refresh = () => {
    this.refreshContext();
    this.set((state) => (state.notes = db.notes.group()));
  };

  refreshContext = () => {
    const context = this.get().context;
    if (!context) return;
    this.setContext(context);
  };

  setContext = (context) => {
    let notes = notesFromContext(context);
    this.set((state) => (state.context = { ...context, notes }));
  };

  delete = async (id) => {
    await db.notes.delete(id);
    this.refreshContext();
    this.refresh();
    const { session, newSession } = editorStore.get();
    if (session.id === id) {
      newSession();
    }
  };

  pin = async (id) => {
    const note = db.notes.note(id);
    if (!this._syncEditor(note.id, "pinned", !note.data.pinned)) {
      await note.pin();
      this.refresh();
    }
  };

  favorite = async (id) => {
    const note = db.notes.note(id);
    if (!this._syncEditor(note.id, "favorite", !note.data.favorite)) {
      await note.favorite();
      this.refresh();
    }
  };

  unlock = async (id) => {
    await Vault.unlockNote(id).then(async () => {
      if (editorStore.get().session.id === id)
        await editorStore.openSession(id);
      this.refresh();
    });
  };

  lock = async (id) => {
    await Vault.lockNote(id).then(async () => {
      if (editorStore.get().session.id === id)
        await editorStore.openSession(id);
      this.refresh();
    });
  };

  setColor = async (id, color) => {
    const note = db.notes.note(id);
    if (!note) return;
    let index = note.data.colors.indexOf(color);
    if (index > -1) {
      await note.uncolor(color);
    } else {
      await note.color(color);
    }
    this._setValue(id, "colors", db.notes.note(id).data.colors);
  };

  /**
   * @private
   */
  _setValue = (noteId, prop, value) => {
    this.set((state) => {
      const { context, notes } = state;
      const arr = !context ? notes : context.notes;
      let index = arr.findIndex((note) => note.id === noteId);
      if (index < 0) return;

      arr[index][prop] = value;
      this._syncEditor(noteId, prop, value);
    });
  };

  /**
   * @private
   */
  _syncEditor = (noteId, action, value) => {
    const { session, setSession } = editorStore.get();
    console.log(session.id, noteId, session.id !== noteId);
    if (session.id !== noteId) return false;
    setSession((state) => (state.session[action] = value), true);
    return true;
  };
}

/**
 * @type {[import("zustand").UseStore<NoteStore>, NoteStore]}
 */
const [useStore, store] = createStore(NoteStore);
export { useStore, store };
