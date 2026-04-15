import { Dialog } from "./dialog";
import { Key } from "./utils/Key";

$(document.body).on("keydown", (e) => {
  if (!Dialog.isOpen() || e.keyCode !== Key.Tab) return;

  const $inputs = Dialog.$dialogContent.find(":input");
  const $focused = $inputs.filter(e.target);
  const idx = $inputs.index($focused);

  if ($focused.length === 0) {
    e.preventDefault();
    $inputs.first().focus();
  } else if (e.shiftKey) {
    if (idx === 0) {
      e.preventDefault();
      Dialog.$dialogButtons.find(":last").focus();
    } else {
      const $parent = $focused.parent();
      if (!$parent.is(Dialog.$dialogButtons)) return;
      if ($parent.children().first().is($focused)) {
        e.preventDefault();
        $inputs.eq($inputs.index($focused) - 1).focus();
      }
    }
  }
});
