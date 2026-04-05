import {
  buildCoverLetterDownloadName,
  formatCoverLetterContact,
  formatCoverLetterDate,
  type CoverLetterDraft,
  type CoverLetterSender,
} from '@/lib/cv/shared'

export async function generateCoverLetterDOCX({
  coverLetter,
  sender,
  filename,
}: {
  coverLetter: CoverLetterDraft
  sender: CoverLetterSender
  filename?: string
}) {
  const { Document, Packer, Paragraph, TextRun } = await import('docx')

  const contactLine = formatCoverLetterContact(sender)
  const resolvedFilename = filename || `${buildCoverLetterDownloadName(sender.name || 'generated')}.docx`

  const children = [
    new Paragraph({
      children: [new TextRun({ text: sender.name || 'Your Name', bold: true, size: 30 })],
      spacing: { after: 80 },
    }),
    ...(sender.currentRole
      ? [
          new Paragraph({
            children: [new TextRun({ text: sender.currentRole, size: 22, color: '008F44' })],
            spacing: { after: 80 },
          }),
        ]
      : []),
    ...(contactLine
      ? [
          new Paragraph({
            children: [new TextRun({ text: contactLine, size: 18, color: '666666' })],
            spacing: { after: 220 },
          }),
        ]
      : []),
    new Paragraph({
      children: [new TextRun({ text: formatCoverLetterDate(), size: 20 })],
      spacing: { after: 200 },
    }),
    ...(coverLetter.companyName
      ? [
          new Paragraph({
            children: [new TextRun({ text: coverLetter.companyName, size: 20 })],
            spacing: { after: 60 },
          }),
        ]
      : []),
    ...(coverLetter.roleTitle
      ? [
          new Paragraph({
            children: [new TextRun({ text: coverLetter.roleTitle, size: 20 })],
            spacing: { after: 160 },
          }),
        ]
      : []),
    new Paragraph({
      children: [new TextRun({ text: coverLetter.greeting || 'Dear Hiring Team,', size: 20 })],
      spacing: { after: 160 },
    }),
    new Paragraph({
      children: [new TextRun({ text: coverLetter.openingParagraph, size: 20 })],
      spacing: { after: 160 },
    }),
    ...coverLetter.bodyParagraphs.map(
      paragraph =>
        new Paragraph({
          children: [new TextRun({ text: paragraph, size: 20 })],
          spacing: { after: 160 },
        })
    ),
    new Paragraph({
      children: [new TextRun({ text: coverLetter.closingParagraph, size: 20 })],
      spacing: { after: 160 },
    }),
    new Paragraph({
      children: [new TextRun({ text: coverLetter.signOff || 'Sincerely,', size: 20 })],
      spacing: { after: 220 },
    }),
    new Paragraph({
      children: [new TextRun({ text: sender.name || 'Your Name', size: 20, bold: true })],
    }),
  ]

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 900, right: 900 },
          },
        },
        children,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = resolvedFilename
  link.click()
  URL.revokeObjectURL(url)
}
