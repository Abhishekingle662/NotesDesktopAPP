const { ipcRenderer } = require('electron')

let currentNote = null
let currentlyViewedNoteId = null;
const notesList = document.getElementById('notesList')
const noteContent = document.getElementById('noteContent')
const saveButton = document.getElementById('saveNote')
const cancelButton = document.getElementById('cancelEdit')
const noteViewer = document.getElementById('noteViewer')
const viewerContent = document.getElementById('viewerContent')
const viewerTitle = document.getElementById('viewerTitle')
const noteTitleInput = document.getElementById('noteTitle')

// Load notes when app starts
ipcRenderer.send('get-notes')

// Handle notes updates
ipcRenderer.on('notes-updated', (event, notes) => {
  notesList.innerHTML = ''
  notes.forEach(note => {
    const noteElement = document.createElement('div')
    noteElement.className = 'note-item'
    
    const contentDiv = document.createElement('div')
    contentDiv.className = 'note-content'
    contentDiv.textContent = note.title || 'Untitled Note' // Show title instead of content
    
    const buttonsDiv = document.createElement('div')
    buttonsDiv.className = 'button-group'
    
    // View button
    const viewButton = document.createElement('button')
    viewButton.textContent = 'View'
    viewButton.className = 'button view-button'
    viewButton.onclick = (e) => {
      e.stopPropagation()
      currentlyViewedNoteId = note.id
      ipcRenderer.send('view-note', note.id)
    }
    
    // Edit button
    const editButton = document.createElement('button')
    editButton.textContent = 'Edit'
    editButton.className = 'button edit-button'
    editButton.onclick = (e) => {
      e.stopPropagation()
      currentNote = note
      noteTitleInput.value = note.title || ''
      noteContent.value = note.content
      saveButton.textContent = 'Update Note'
      noteTitleInput.focus()
    }
    
    // Delete button
    const deleteButton = document.createElement('button')
    deleteButton.textContent = 'Delete'
    deleteButton.className = 'button delete-button'
    deleteButton.onclick = (e) => {
      e.stopPropagation()
      if (confirm('Are you sure you want to delete this note?')) {
        ipcRenderer.send('delete-note', note.id)
      }
    }

    buttonsDiv.appendChild(viewButton)
    buttonsDiv.appendChild(editButton)
    buttonsDiv.appendChild(deleteButton)
    noteElement.appendChild(contentDiv)
    noteElement.appendChild(buttonsDiv)
    notesList.appendChild(noteElement)
  })
})

// Save/Update note
saveButton.addEventListener('click', () => {
  if (!noteContent.value.trim()) {
    alert('Note content cannot be empty!')
    return
  }

  const note = {
    id: currentNote ? currentNote.id : null,
    title: noteTitleInput.value.trim() || 'Untitled Note',
    content: noteContent.value,
    timestamp: Date.now()
  }
  
  ipcRenderer.send('save-note', note)
  noteContent.value = ''
  noteTitleInput.value = ''
  currentNote = null
  saveButton.textContent = 'Save Note'
})

// Cancel edit
cancelButton.addEventListener('click', () => {
  noteContent.value = ''
  noteTitleInput.value = ''
  currentNote = null
  saveButton.textContent = 'Save Note'
})

// Add handler for displaying notes
ipcRenderer.on('display-note', (event, note) => {
  if (!note) return;
  currentlyViewedNoteId = note.id
  viewerContent.textContent = note.content
  viewerTitle.textContent = note.title || 'Untitled Note'
  noteViewer.style.display = 'block'
})

// Add handler for deleted notes
ipcRenderer.on('note-deleted', (event, noteId) => {
  if (currentlyViewedNoteId === noteId) {
    noteViewer.style.display = 'none'
    viewerContent.textContent = ''
    currentlyViewedNoteId = null
  }
})