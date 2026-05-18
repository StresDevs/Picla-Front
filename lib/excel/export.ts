import * as XLSX from 'xlsx'

export interface ExcelSheetInput {
  fileName: string
  sheetName?: string
  headers: string[]
  rows: Array<Array<string | number | null | undefined>>
}

export function exportToExcel(input: ExcelSheetInput) {
  const normalizedRows = input.rows.map((row) => row.map((cell) => (cell ?? '')))
  const worksheet = XLSX.utils.aoa_to_sheet([input.headers, ...normalizedRows])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, input.sheetName || 'Reporte')
  XLSX.writeFile(workbook, `${input.fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`)
}
