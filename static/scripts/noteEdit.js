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

Quill.register('modules/blotFormatter', QuillBlotFormatter.default);

const editor = new Quill('#editor', {
  modules: {
    'toolbar': editorOptions,
    'imageDrop': true,
    'blotFormatter': {}
  },
  theme: 'snow'
});

const saved = document.getElementById('saved');
let unsavedEdits = 0;
let savedLast = Date.now();
const currentNote = new Note(
  location.href.split('/').slice(-1),
  editor.root.innerHTML
);

// Hook into our copy function to add support for the QuillJS editor
((oldContextCopy) => {
  contextCopy = () => {
    const selection = editor.getSelection(true);
    if (selection) {
      const contentDelta = editor.getContents(selection.index, selection.length);
      if (typeof contentDelta.ops[0].insert === 'object' && 'image' in contentDelta.ops[0].insert) {
        const img = document.createElement('img');
        img.src = contentDelta.ops[0].insert.image;
        copyImage(img)
      } else {
        navigator.clipboard.writeText(editor.getText(selection.index, selection.length))
          .catch(err => {
            console.error(err);
          });
      }
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
  savedLast = Date.now();
  unsavedEdits = 0;
  await currentNote.save();
}

editor.on('text-change', async (delta, source) => {
  currentNote.edit(editor.root.innerHTML);
  saved.innerText = "(Unsaved)";
  if (unsavedEdits >= 118 || Date.now() - savedLast > 5000) {
    await save();
  } else {  
    unsavedEdits++;
  }
});

let savedCopy = editor.root.innerHTML;
setTimeout(async () => {
  await save();
}, 3000);

document.getElementById('saved').onclick = async () => {
  await save();
};

document.addEventListener('keydown', async e => {
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
    await save();
  }
});