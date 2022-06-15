document.addEventListener('click', hideContextMenu)
document.addEventListener('contextmenu', openContextMenu);
document.addEventListener('mouseup', recordSelected);
let clipboardText = "";
let contextOpen = false;

function hideContextMenu() {
  document.dispatchEvent(new Event('contextMenuHook'));
}

document.addEventListener('contextMenuHook', () => {
  document.dispatchEvent(new Event('contextMenuHideOkay'));
});

document.addEventListener('contextMenuHideOkay', () => {
  document.getElementById(
    "context-menu").style.display = "none";

  contextOpen = false;
});

function openContextMenu(e) {
  recordSelected();
  e.preventDefault();
  let menu = document
    .getElementById("context-menu");
  menu.style.display = 'block';
  menu.style.left = e.pageX + "px";
  menu.style.top = e.pageY + "px";
  contextOpen = true;
}

function recordSelected() {
  if(!contextOpen) {
    let selection = ""
    if (window.getSelection) {
      selection = window.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
      selection = document.selection.createRange().text;
    }
    if(selection != "") {
      clipboardText = selection;
    }
  }
}

function contextCopy() {
  navigator.clipboard.writeText(clipboardText)
    .catch(err => {
      console.log(err);
    });
}