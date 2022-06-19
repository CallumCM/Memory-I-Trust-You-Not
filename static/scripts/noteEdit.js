const editor = new Quill('#editor', {
  theme: 'snow',
});

const saved = document.getElementById('saved');
let unsavedEdits = 0;
let savedLast = Date.now();
const currentNote = new Note(
  location.href.split('/').slice(-1),
  editor.root.innerHTML
);

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