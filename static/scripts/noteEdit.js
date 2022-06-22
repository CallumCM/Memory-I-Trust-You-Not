const editorOptions = [
  ['bold', 'italic', 'underline', 'strike'], // toggled buttons
  ['blockquote'],

  [{ 'header': 1 }, { 'header': 2 }], // custom button values
  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
  [{ 'script': 'sub'}, { 'script': 'super' }], // superscript/subscript
  [{ 'indent': '-1'}, { 'indent': '+1' }], // outdent/indent
  [{ 'direction': 'rtl' }],  // text direction

  [{ 'size': ['small', false, 'large', 'huge'] }], // custom dropdown
  [ 'link', 'image', 'video', 'formula' ], // image support
  [{ 'color': [] }, { 'background': [] }], // dropdown with defaults from theme
  [{ 'font': [] }],
  [{ 'align': [] }],

  ['clean'] // remove formatting button
];

const editor = new Quill('#editor', {
  modules: {
    toolbar: editorOptions,
    imageDrop: true
  },
  theme: 'snow',
});

const saved = document.getElementById('saved');
let unsavedEdits = 0;
let savedLast = Date.now();
const currentNote = new Note(
  location.href.split('/').slice(-1),
  editor.root.innerHTML
);

// Hook into our copy function and add QuillJS compatibility
// like mixins but for the web browser
((oldContextCopy) => {
  contextCopy = () => {
    let selection = editor.getSelection();
    if (selection) {
      selection = editor.getText(selection.index, selection.length);
        navigator.clipboard.writeText(selection)
          .catch(err => {
            console.error(err);
          });
    } else {    
      oldContextCopy();
    }
  };
})(contextCopy);

function copyImage(img) {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  canvas.getContext("2d").drawImage(img, 0, 0, img.width, img.height);
  canvas.toBlob((blob) => {
    navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob })
    ]);
  }, "image/png");
}

async function save() {
  saved.innerText = "(Saved)";
  await currentNote.save();
}

editor.on('text-change', async (delta, source) => {
  currentNote.edit(editor.root.innerHTML);
  saved.innerText = "(Unsaved)";
  if (unsavedEdits >= 118 || Date.now() - savedLast > 5000) {
    await save();
    savedLast = Date.now();
    unsavedEdits = 0;
  } else {  
    unsavedEdits++;
  }
});

document.addEventListener('keydown', async e => {
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
    await save();
  }
});