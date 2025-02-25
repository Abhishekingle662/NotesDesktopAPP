const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

let activeNoteId = null; // Add this at the top with other constants

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: true
    }
  })

  win.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()
})

// Handle note operations
ipcMain.on('save-note', (event, note) => {
  const notesPath = path.join(app.getPath('userData'), 'notes.json')
  let notes = []
  
  if (fs.existsSync(notesPath)) {
    notes = JSON.parse(fs.readFileSync(notesPath))
  }
  
  if (note.id) {
    notes = notes.map(n => n.id === note.id ? note : n)
    if (note.id === activeNoteId) {
      event.reply('display-note', note) // Update viewer if active note is edited
    }
  } else {
    note.id = Date.now()
    notes.push(note)
  }
  
  fs.writeFileSync(notesPath, JSON.stringify(notes))
  event.reply('notes-updated', notes)
})

ipcMain.on('get-notes', (event) => {
  const notesPath = path.join(app.getPath('userData'), 'notes.json')
  let notes = []
  
  if (fs.existsSync(notesPath)) {
    notes = JSON.parse(fs.readFileSync(notesPath))
  }
  
  event.reply('notes-updated', notes)
})

ipcMain.on('delete-note', (event, noteId) => {
  const notesPath = path.join(app.getPath('userData'), 'notes.json')
  let notes = JSON.parse(fs.readFileSync(notesPath))
  notes = notes.filter(note => note.id !== noteId)
  fs.writeFileSync(notesPath, JSON.stringify(notes))
  
  if (noteId === activeNoteId) {
    event.reply('note-deleted', noteId) // Notify viewer about deletion
  }
  event.reply('notes-updated', notes)
})

ipcMain.on('view-note', (event, noteId) => {
  const notesPath = path.join(app.getPath('userData'), 'notes.json')
  let notes = JSON.parse(fs.readFileSync(notesPath))
  const note = notes.find(note => note.id === noteId)
  activeNoteId = noteId // Store the active note ID
  event.reply('display-note', note)
})