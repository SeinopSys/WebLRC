/**
 * Sets up the minimal DOM structure required by TimingEditor's constructor.
 * Must be called before instantiating TimingEditor in jsdom tests.
 */
export function setupEditorFixture(): void {
  document.body.innerHTML = `
    <div id="timings">
      <div class="editor mode-edit"></div>
    </div>
    <button
      id="lrcmodebtn"
      data-syncmode="Switch to sync mode"
      data-editmode="Switch to edit mode"
    >
      <span class="fa fa-clock"></span>
      <span class="modename">Switch to sync mode</span>
    </button>
    <a id="lrcfilebtn"></a>
    <a id="lrcpastebtn"></a>
    <a id="lrcexportbtn"></a>
    <a id="lrcexportnometabtn"></a>
    <a id="lrcexportaudiobtn"></a>
    <a id="lrcimportaudiobtn"></a>
    <a id="lrcmergetogglebtn">
      <strong class="status text-success" data-true="On" data-false="Off">On</strong>
    </a>
    <button id="lrcclrbtn">Discard lyrics</button>
    <button id="lrcmetadatabtn">
      <span class="badge metadata-count"></span>
    </button>
    <div>
      <button id="restore-backup" title="Restore automatic backup…">
        <span class="fa fa-trash-can-arrow-up"></span>
      </button>
      <button id="clear-backup" title="Discard automatic backup…">
        <span class="fa fa-trash-can"></span>
      </button>
    </div>

    <!-- Entry template cloned for each lyric row -->
    <div id="editor-entry-template" class="d-none">
      <div class="time-entry">
        <div class="tools tools-start btn-group">
          <button class="btn btn-warning goto text-nowrap" title="Jump to timestamp" disabled="disabled">
            <span class="fa fa-step-forward"></span>
          </button>
          <div class="btn-group-vertical step-buttons">
            <button class="btn btn-primary step-forward text-nowrap" title="Step forward 100ms">
              <span class="fa fa-caret-up"></span>
            </button>
            <button class="btn btn-primary step-backward text-nowrap" title="Step backward 100ms">
              <span class="fa fa-caret-down"></span>
            </button>
          </div>
        </div>
        <span class="timestamp" contenteditable=""></span>
        <span class="text" contenteditable=""></span>
        <div class="tools tools-end btn-group">
          <button class="btn btn-success addrow-up edit-only text-nowrap" title="Add row above">
            <span class="fa fa-arrow-turn-up"></span>
          </button>
          <button class="btn btn-success addrow-down edit-only text-nowrap" title="Add row below">
            <span class="fa fa-arrow-turn-down"></span>
          </button>
          <button class="btn btn-danger remrow edit-only text-nowrap" title="Remove row…" disabled="disabled">
            <span class="fa fa-trash"></span>
          </button>
          <button class="btn btn-warning goto text-nowrap" title="Jump to timestamp" disabled="disabled">
            <span class="fa fa-step-forward"></span>
          </button>
        </div>
      </div>
    </div>

    <div id="confirm-delete-template" class="d-none">
      <p>Are you sure you want to remove this row?</p>
      <blockquote class="deleted-line"></blockquote>
      <p>(Hold Shift while clicking the button to skip this prompt)</p>
    </div>

    <div id="restore-backup-template" class="d-none">
      <p>Restore backup?</p>
      <pre class="backup-data"></pre>
    </div>

    <div id="clear-backup-template" class="d-none">
      <p>Discard backup?</p>
      <pre class="backup-data"></pre>
    </div>
  `;
}

/**
 * Sets up the minimal DOM structure required by AudioPlayer's constructor.
 */
export function setupPlayerFixture(): void {
  document.body.innerHTML = `
    <div id="player">
      <div class="state">
        <div class="progress-wrap" title="Seek">
          <div class="progress-indicator">
            <div class="fill">&nbsp;</div>
            <div class="loaded"></div>
            <div class="entry-sticks"></div>
          </div>
          <div class="thumb"></div>
        </div>
        <div class="status">
          <span class="status-position">…</span>
          <span class="status-duration">…</span>
          <span class="status-filetype"></span>
          <span class="status-filename"></span>
        </div>
      </div>
    </div>
    <button id="audiofilebtn" title="Select audio file"></button>
    <button id="playbackbtn" disabled="disabled">
      <span class="fa fa-play"></span>
    </button>
    <button id="stopbtn" disabled="disabled"></button>
    <span id="volumedisp"> 50%</span>
    <button id="volumedown"></button>
    <button id="volumeup"></button>
  `;
}
