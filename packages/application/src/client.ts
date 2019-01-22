// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

// Local CSS must be loaded prior to loading other libs.
import '../style/index.css';

import { CommandLinker } from '@jupyterlab/apputils';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { ServiceManager } from '@jupyterlab/services';

import { IIterator } from '@phosphor/algorithm';

import { Application } from '@phosphor/application';

import { Widget } from '@phosphor/widgets';

/**
 * The base Jupyter client application class.
 *
 * #### Notes
 * This type is useful as a generic application against which front-end plugins
 * can be authored. It inherits from the phosphor `Application`.
 */
export class JupyterClient<
  T extends JupyterClient.Shell = JupyterClient.Shell,
  U = any
> extends Application<T> {
  /**
   * Construct a new JupyterClient object.
   */
  constructor(options: JupyterClient.IOptions<T, U>) {
    super(options);

    // The default restored promise if one does not exist in the options.
    const restored = new Promise<U>(resolve => {
      requestAnimationFrame(() => {
        resolve();
      });
    });

    this.commandLinker =
      options.commandLinker || new CommandLinker({ commands: this.commands });
    this.docRegistry = options.docRegistry || new DocumentRegistry();
    this.restored =
      options.restored ||
      this.started.then(() => restored).catch(() => restored);
    this.serviceManager = options.serviceManager || new ServiceManager();
  }

  /**
   * The command linker used by the application.
   */
  readonly commandLinker: CommandLinker;

  /**
   * The document registry instance used by the application.
   */
  readonly docRegistry: DocumentRegistry;

  /**
   * Promise that resolves when state is first restored, returning layout
   * description.
   */
  readonly restored: Promise<U>;

  /**
   * The service manager used by the application.
   */
  readonly serviceManager: ServiceManager;

  /**
   * Walks up the DOM hierarchy of the target of the active `contextmenu`
   * event, testing the nodes for a user-supplied funcion. This can
   * be used to find a node on which to operate, given a context menu click.
   *
   * @param test - a function that takes an `HTMLElement` and returns a
   *   boolean for whether it is the element the requester is seeking.
   *
   * @returns an HTMLElement or undefined, if none is found.
   */
  contextMenuFirst(
    test: (node: HTMLElement) => boolean
  ): HTMLElement | undefined {
    for (let node of this._getContextMenuNodes()) {
      if (test(node)) {
        return node;
      }
    }
    return undefined;
  }

  /**
   * A method invoked on a document `'contextmenu'` event.
   */
  protected evtContextMenu(event: MouseEvent): void {
    this._contextMenuEvent = event;
    super.evtContextMenu(event);
  }

  /**
   * Gets the hierarchy of html nodes that was under the cursor
   * when the most recent contextmenu event was issued
   */
  private _getContextMenuNodes(): HTMLElement[] {
    if (!this._contextMenuEvent) {
      return [];
    }

    // this one-liner doesn't work, but should at some point
    // in the future (https://developer.mozilla.org/en-US/docs/Web/API/Event)
    // return this._contextMenuEvent.composedPath() as HTMLElement[];

    let nodes: HTMLElement[] = [this._contextMenuEvent.target as HTMLElement];
    while (
      'parentNode' in nodes[nodes.length - 1] &&
      nodes[nodes.length - 1].parentNode &&
      nodes[nodes.length - 1] !== nodes[nodes.length - 1].parentNode
    ) {
      nodes.push(nodes[nodes.length - 1].parentNode as HTMLElement);
    }
    return nodes;
  }

  private _contextMenuEvent: MouseEvent;
}

/**
 * The namespace for `JupyterClient` class statics.
 */
export namespace JupyterClient {
  /**
   * The options used to initialize a JupyterClient.
   */
  export interface IOptions<T extends Shell = Shell, U = any>
    extends Application.IOptions<T> {
    /**
     * The document registry instance used by the application.
     */
    docRegistry?: DocumentRegistry;

    /**
     * The command linker used by the application.
     */
    commandLinker?: CommandLinker;

    /**
     * The service manager used by the application.
     */
    serviceManager?: ServiceManager;

    /**
     * Promise that resolves when state is first restored, returning layout
     * description.
     */
    restored?: Promise<U>;
  }

  export type Shell = Widget & {
    activateById(id: string): void;
    add(
      widget: Widget,
      area?: string,
      options?: DocumentRegistry.IOpenOptions
    ): void;
    readonly currentWidget: Widget;
    widgets(area?: string): IIterator<Widget>;
  };
}
