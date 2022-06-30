 const editorOptions = [
  ['bold', 'italic', 'underline', 'strike'],
  ['blockquote'],

  [{ 'header': 1 }, { 'header': 2 }],
  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
  [{ 'script': 'sub'}, { 'script': 'super' }],
  [{ 'indent': '-1'}, { 'indent': '+1' }],
  [{ 'direction': 'rtl' }],

  [{ 'size': ['small', false, 'large', 'huge'] }],
  [ 'link', 'image', 'video'],
  [{ 'color': [] }, { 'background': [] }],
  [{ 'font': [] }],
  [{ 'align': [] }],

  ['clean']
];

Quill.register('modules/blotFormatter', QuillBlotFormatter.default);
Quill.register("modules/imageCompressor", imageCompressor);

const editor = new Quill('#editor', {
  modules: {
    'toolbar': editorOptions,
    'blotFormatter': {},
    'imageCompressor': {
      quality: 0.9,
      maxWidth: 1080,
      maxHeight: 810,
      imageType: 'image/webp',
      insertIntoEditor: (url, blob) => {
        const formData = new FormData();
        formData.append("file", blob);
        fetch("/image", {method: "POST", body: formData})
          .then(response => response.text())
          .then(result => {
            const range = editor.getSelection();
            editor.insertEmbed(range.index, "image", `${result}`, "user");
          })
          .catch(error => {
            console.error("Error:", error);
          });
      }
    }
  },
  theme: 'snow'
});

editor.on("text-change", async (delta, oldDelta, source) => {
  currentNote.edit(editor.root.innerHTML);
  saved.innerText = "(Unsaved)";
  if (unsavedEdits >= 118 || Date.now() - savedLast > 5000) {
    await save();
  } else {  
    unsavedEdits++;
  }
  
  if (source === "user") {

    // Image deletion
    const currrentContents = editor.getContents();
    const diff = currrentContents.diff(oldDelta);
    let isDeletingImage;
    let op;

    for (let i = 0; i < diff.ops.length; i++) {
      op = diff.ops[i];
      if (typeof op.insert === 'object' && Object.keys(op.insert).includes('image')) {
        isDeletingImage = i;
        break;
      }
    }
    if (isDeletingImage) {
      if (confirm("Permanently delete this image?")) {
        const imageUUID = diff.ops[isDeletingImage].insert.image.split('/').slice(-1);
        apiRequest('/image', {'image_uuid': imageUUID}, 'DELETE');
      } else {
        editor.history.undo();
      }
    }
  }
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
  if (savedCopy != editor.root.innerHTML) {
    savedCopy = editor.root.innerHTML;
    saved.innerText = "(Saved)";
    savedLast = Date.now();
    unsavedEdits = 0;
    await currentNote.save();
  }
}

let savedCopy = editor.root.innerHTML;
setInterval(async () => {
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

let selectedImage;
const pageSpecificContextItems = [
  document.getElementById('save-image'),
];
function updatePageSpecificContextItems() {
  pageSpecificContextItems.map(contextItem => {
    const selection = editor.getSelection(true);
    if (selection) {
      const contentDelta = editor.getContents(selection.index, selection.length);

      try {
        if ('image' in contentDelta.ops[0].insert) {
          selectedImage = contentDelta.ops[0].insert.image;
        }
      } catch {}
    }
    if (selectedImage) {
      contextItem.style.display = 'block';
    } else {
      contextItem.style.display = 'none';
    }
  });
}

function saveImage() {
  window.open(selectedImage+'?format=png', '_blank');
}

document.addEventListener('contextopen', updatePageSpecificContextItems);