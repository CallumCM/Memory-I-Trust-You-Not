let indexFunctions;

(async () => {
  const NOTE_TITLE_INDEX = 2;
  
  const notes = await Note.list();
  let currentlyHoveredNote;
  const note_container = document.getElementById('notes');
  
  const note_template = document.getElementById('note-template');
  note_template.id = "";
  
  const new_note = document.getElementById('new-note');
  let note;
  let note_element;
  for (let name of notes) {
    note_element = note_template.cloneNode(true);
    note_element.children[NOTE_TITLE_INDEX].innerText = decodeURIComponent(name);
    note_container.insertBefore(note_element, new_note);
  }

  let mouseX, mouseY = 0;
  function mousemove(e){
    mouseX = e.pageX;
    mouseY = e.pageY;
  }
  window.addEventListener('mousemove', mousemove);

  const noteSpecificContextItems = [
    document.getElementById('copy-note-name'),
    document.getElementById('delete-note'),
    document.getElementById('rename-note'),
  ];
  function updatePageSpecificContextItems() {
    noteSpecificContextItems.map(contextItem => {
      if (currentlyHoveredNote) {
        contextItem.style.display = 'block';
      } else {
        contextItem.style.display = 'none';
      }
    });
  }

  function getHoveredNote() {
    let isOnNote;
    let items = Array.from(document.elementsFromPoint(mouseX, mouseY));
    for (let index = 0; index < items.length; index++) {
      if (items[index].className == 'note') {
        isOnNote = index;
        break;
      }
    }
    if (isOnNote === undefined) {
      currentlyHoveredNote = null;
    } else {
      currentlyHoveredNote = items[isOnNote];
    }
  }
  
  document.addEventListener('contextopen', (e) => {
    getHoveredNote();
    updatePageSpecificContextItems();
  });
  
  const modal = document.getElementById("new-note-modal");
  const open_modal = document.getElementById("new-note");
  const close_modal = document.getElementsByClassName("close")[0];
  
  open_modal.addEventListener('click', (e) => {
    modal.classList.add('active');
  });
  close_modal.addEventListener('click', (e) => {
    modal.classList.remove('active');
  });
  
  const new_note_name = document.getElementById("new-note-modal-name");
  const create_note = document.getElementById("new-note-modal-create");
  create_note.onclick = async () => {
    modal.classList.remove('active');
    
    await Note.create(encodeURIComponent(new_note_name.value));

    note_element = note_template.cloneNode(true);
    note_element.children[NOTE_TITLE_INDEX].innerText = new_note_name.value;
    note_element.onclick = () => {
      location.href = '/note/'+encodeURIComponent(new_note_name.value);
    };
    note_container.insertBefore(note_element, new_note);
  };
  
  window.addEventListener('click', (e) => {
    if (e.target == modal) {
      modal.classList.remove('active');
    }
  });
  
  Array.from(document.getElementsByClassName('note')).slice(1).map(note => {
    note.onclick = () => {
      location.href = '/note/'+encodeURIComponent(note.children[NOTE_TITLE_INDEX].innerText);
    };
  });
  
  function copyNoteName() {
    if (currentlyHoveredNote) {
      navigator.clipboard.writeText(currentlyHoveredNote.children[NOTE_TITLE_INDEX].innerText)
        .catch(err => {
          console.error(err);
        });
    }
  }
  
  async function deleteNote() {
    if (currentlyHoveredNote) {
      await (new Note(encodeURIComponent(
        currentlyHoveredNote
        .children[NOTE_TITLE_INDEX].innerText))).delete();
      currentlyHoveredNote.remove();
    }
  }

  async function renameNote() {
    if (currentlyHoveredNote) {
      let newName = prompt('What should your note be called?')
      if (newName) {
        currentlyHoveredNote.children[NOTE_TITLE_INDEX].innerText = await (new Note(
          encodeURIComponent(
            currentlyHoveredNote
            .children[NOTE_TITLE_INDEX].innerText))).rename(
          );
      }
    }
  }

  async function renameNoteButton(e) {
    e.stopImmediatePropagation();
    await renameNote();
  }
  
  async function deleteNoteButton(e) {
    e.stopImmediatePropagation();
    if (confirm("Delete this note?")) {
      getHoveredNote();
      await deleteNote();
    }
  }

  return {copyNoteName: copyNoteName, deleteNote: deleteNoteButton, renameNote: renameNoteButton}
})().then(_indexFunctions => {
  indexFunctions = _indexFunctions;
});