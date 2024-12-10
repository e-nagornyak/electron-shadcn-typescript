import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { exec } from 'child_process'
import pdfToPrinter from 'pdf-to-printer'

// Custom APIs for renderer
const api = {
  getPrintersNew: () => {
    console.log(pdfToPrinter.getPrinters())
  },
  getPrinters: () =>
    new Promise((resolve, reject) => {
      exec('wmic printer get Name,DeviceID /format:csv', (error, stdout, stderr) => {
        if (error) {
          reject(error)
          return
        }
        if (stderr) {
          reject(new Error(stderr))
          return
        }

        // Парсимо результат у масив об'єктів
        const lines = stdout.split('\n').filter((line) => line.trim() !== '')
        const headers = lines[0].split(',')
        const printers = lines.slice(1).map((line) => {
          const data = line.split(',')
          return {
            Name: data[0].trim(),
            DeviceID: data[1].trim()
          }
        })

        resolve(printers)
      })
    })
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
