const { ipcRenderer } = require('electron')

let currentNote = null
const notesList = document.getElementById('notesList')
const noteContent = document.getElementById('noteContent')
const saveButton = document.getElementById('saveNote')
const cancelButton = document.getElementById('cancelEdit')

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
    contentDiv.textContent = note.content.substring(0, 50) + (note.content.length > 50 ? '...' : '')
    
    const buttonsDiv = document.createElement('div')
    buttonsDiv.className = 'button-group'
    
    // Edit button
    const editButton = document.createElement('button')
    editButton.textContent = 'Edit'
    editButton.className = 'button edit-button'
    editButton.onclick = (e) => {
      e.stopPropagation()
      currentNote = note
      noteContent.value = note.content
      saveButton.textContent = 'Update Note'
      noteContent.focus()
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
    alert('Note cannot be empty!')
    return
  }

  const note = {
    id: currentNote ? currentNote.id : null,
    content: noteContent.value,
    timestamp: Date.now()
  }
  
  ipcRenderer.send('save-note', note)
  noteContent.value = ''
  currentNote = null
  saveButton.textContent = 'Save Note'
})

// Cancel edit
cancelButton.addEventListener('click', () => {
  noteContent.value = ''
  currentNote = null
  saveButton.textContent = 'Save Note'
})