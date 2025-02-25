const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

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
  event.reply('notes-updated', notes)
})