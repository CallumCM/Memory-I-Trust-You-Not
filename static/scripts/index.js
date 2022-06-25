let indexFunctions;
(async () => {
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
    note_element.children[1].innerText = name;
    note_container.insertBefore(note_element, new_note);
  }

  const noteSpecificContextItems = [
    document.getElementById('copy-note-name'),
    document.getElementById('delete-note'),
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
  
  document.addEventListener('contextopen', (e) => {
    let isOnNote;
    let items = Array.from(document.elementsFromPoint(e.detail.x, e.detail.y));
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
    updatePageSpecificContextItems()
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
  
    await Note.create(new_note_name.value);

    note_element = note_template.cloneNode(true);
    note_element.children[1].innerText = new_note_name.value;
    note_element.onclick = () => {
      location.replace('/note/'+new_note_name.value);
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
      location.replace('/note/'+note.children[1].innerText);
    };
  });
  
  function copyNoteName() {
    if (currentlyHoveredNote) {
      navigator.clipboard.writeText(currentlyHoveredNote.children[1].innerText)
        .catch(err => {
          console.error(err);
        });
    }
  }
  
  async function deleteNote() {
    if (currentlyHoveredNote) {
      await (new Note(currentlyHoveredNote.children[1].innerText)).delete();
      currentlyHoveredNote.remove();
    }
  }
  Array.from(document.getElementsByClassName('delete-note'))
    .map(delete_button => {
    delete_button.onclick = async e => {
      e.stopImmediatePropagation();
      if (confirm("Delete this note?"))
        await deleteNote();
    };
  });

  return {copyNoteName: copyNoteName, deleteNote: deleteNote}
})().then(_indexFunctions => {
  indexFunctions = _indexFunctions;
});