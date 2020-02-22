import CachedCollection from "../database/cached-collection";
import fuzzysearch from "fuzzysearch";
import Notebook from "../models/notebook";
import Notes from "./notes";
import Trash from "./trash";
var tfun = require("transfun/transfun.js").tfun;
if (!tfun) {
  tfun = global.tfun;
}
export default class Notebooks {
  constructor(context) {
    this._collection = new CachedCollection(context, "notebooks");
  }

  /**
   *
   * @param {Notes} notes
   * @param {Trash} trash
   */
  init(notes, trash) {
    this._trash = trash;
    this._notes = notes;
    return this._collection.init();
  }

  async add(notebookArg) {
    if (!notebookArg) throw new Error("Notebook cannot be undefined or null.");
    //TODO reliably and efficiently check for duplicates.
    const id = notebookArg.id || Date.now().toString() + "_notebook";
    let oldNotebook = this._collection.getItem(id);

    if (!oldNotebook && !notebookArg.title)
      throw new Error("Notebook must contain at least a title.");

    let notebook = {
      ...oldNotebook,
      ...notebookArg
    };

    notebook = {
      id,
      type: "notebook",
      title: notebook.title,
      description: notebook.description,
      dateCreated: notebook.dateCreated,
      pinned: !!notebook.pinned,
      favorite: !!notebook.favorite,
      topics: notebook.topics || [],
      totalNotes: 0
    };
    if (!oldNotebook) {
      notebook.topics.splice(0, 0, "General");
    }

    await this._collection.addItem(notebook);

    //if (!oldNotebook) {
    await this.notebook(notebook.id).topics.add(...notebook.topics);
    //}
    return notebook.id;
  }

  get all() {
    return this._collection.getAllItems();
  }

  /**
   *
   * @param {string} id The id of the notebook
   * @returns {Notebook} The notebook of the given id
   */
  notebook(id) {
    let notebook = this._collection.getItem(id);
    if (!notebook) return;
    return new Notebook(this, notebook);
  }

  async delete(...ids) {
    for (let id of ids) {
      let notebook = this.notebook(id);
      if (!notebook) continue;
      await this._collection.transaction(() =>
        notebook.topics.delete(...notebook.data.topics)
      );
      await this._collection.removeItem(id);
      await this._trash.add(notebook.data);
    }
  }

  filter(query) {
    if (!query) return [];
    let queryFn = v => fuzzysearch(query, v.title + " " + v.description);
    if (query instanceof Function) queryFn = query;
    return tfun.filter(queryFn)(this.all);
  }
}
