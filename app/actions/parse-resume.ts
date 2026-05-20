'use server'

import { PDFParse } from 'pdf-parse'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export async function parseResume(formData: FormData): Promise<string> {
  const file = formData.get('file') as File | null
  if (!file || file.size === 0) throw new Error('No file selected.')
  if (file.size > MAX_FILE_SIZE) throw new Error('File exceeds 10 MB limit.')

  const buffer = Buffer.from(await file.arrayBuffer())
  const parser = new PDFParse({ data: buffer })
  const result = await parser.getText()

  const text = result.text.trim()
  if (!text) {
    throw new Error(
      'No text extracted — the PDF may be scanned or image-based. Try copy-pasting your resume text instead.'
    )
  }

  return text
}
