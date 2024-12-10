import { app, contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { exec } from 'child_process'
import pdfToPrinter from 'pdf-to-printer'
import path from 'path'
import fs from 'fs'
import axios from 'axios'

const basePath = process.env.NODE_ENV === 'development' ? __dirname : process.resourcesPath

const downloadFile = async (url, outputPath) => {
  const writer = fs.createWriteStream(outputPath)
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  })

  response.data.pipe(writer)

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
  })
}

// Custom APIs for renderer
const api = {
  getPrintersNew: () => {
    console.log(pdfToPrinter.getPrinters())
  },
  sendToPrinter: async () => {
    const filePath = path.join(app.getPath('userData'), 'temp_downloaded_file.pdf')
    const pdfUrl = 'http://37.27.176.200:8000/media/labels/inpost_1893672465.pdf'

    try {
      console.info(`Received request to download and print: ${pdfUrl}`)

      await downloadFile(pdfUrl, filePath)
      console.info(`File downloaded successfully: ${filePath}`)

      const defaultPrinterName = 'bla'
      console.info(`defaultPrinterName: ${defaultPrinterName}`)

      const options = {
        printer: defaultPrinterName,
        sumatraPdfPath: path.join(basePath, 'SumatraPDF-3.4.6-32.exe'),
        scale: 'noscale',
        paperSize: '6',
        win32: [
          '-print-settings "noscale"',
          '-print-settings "center"',
          '-orientation portrait',
          '-paper-size A6',
          '-margin-top 0',
          '-margin-right 0',
          '-margin-bottom 0',
          '-margin-left 0'
        ]
      }
      console.log('print options', options)

      await pdfToPrinter.print(filePath, options)
      console.info('The file was successfully sent for printing.')

      setTimeout(() => {
        fs.unlinkSync(filePath)
        console.info('Temporary file deleted.')
      }, 500)
    } catch (error: any) {
      console.error(`Error processing file: ${error.message}`)
    }
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
        // const headers = lines[0].split(',')
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
