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

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize TinyMCE
    tinymce.init({
        selector: '#noteContent',
        height: 400,
        menubar: true,
        base_url: './node_modules/tinymce',
        plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'table', 'help', 'wordcount'
        ],
        toolbar: 'undo redo | formatselect | ' +
            'bold italic backcolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | help',
        content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 14px }'
    }).then(() => {
        console.log('TinyMCE initialized successfully');
    }).catch(err => {
        console.error('TinyMCE initialization failed:', err);
    });
});

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
      tinymce.get('noteContent').setContent(note.content)
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

// Save button handler
saveButton.addEventListener('click', () => {
    console.log('Save button clicked'); // Debug log
    
    // Wait for TinyMCE to be initialized
    if (!tinymce.get('noteContent')) {
        console.error('TinyMCE not initialized');
        return;
    }

    const content = tinymce.get('noteContent').getContent();
    const title = noteTitleInput.value.trim();

    console.log('Content:', content); // Debug log
    console.log('Title:', title); // Debug log

    if (!content.trim()) {
        alert('Note content cannot be empty!');
        return;
    }

    const note = {
        id: currentNote ? currentNote.id : Date.now(),
        title: title || 'Untitled Note',
        content: content,
        timestamp: Date.now()
    };

    console.log('Sending note to main process:', note); // Debug log

    // Send to main process
    ipcRenderer.send('save-note', note);

    // Clear the editor
    tinymce.get('noteContent').setContent('');
    noteTitleInput.value = '';
    currentNote = null;
    saveButton.textContent = 'Save Note';
});

// Cancel edit
cancelButton.addEventListener('click', () => {
    tinymce.get('noteContent').setContent('')
    noteTitleInput.value = ''
    currentNote = null
    saveButton.textContent = 'Save Note'
})

// Add handler for displaying notes
ipcRenderer.on('display-note', (event, note) => {
    if (!note) return;
    currentlyViewedNoteId = note.id
    viewerContent.innerHTML = note.content // Change from textContent to innerHTML
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

// Add error handler
ipcRenderer.on('save-error', (event, errorMessage) => {
    console.error('Save error:', errorMessage);
    alert('Error saving note: ' + errorMessage);
});