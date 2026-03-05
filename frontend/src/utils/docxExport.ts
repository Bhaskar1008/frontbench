/**
 * Export resume data to a Word document (.docx) using the docx library.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  convertInchesToTwip,
  type FileChild,
} from 'docx'

function sanitize(text: string | undefined | null): string {
  if (text == null) return ''
  return String(text).trim()
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '2C3E50' } },
  })
}

function bodyParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: 22 })], // 11 pt
    spacing: { after: 120 },
  })
}

function bulletParagraph(text: string): Paragraph {
  return new Paragraph({
    text,
    bullet: { level: 0 },
    spacing: { after: 80 },
  })
}

export async function exportResumeToDocx(
  analysis: any,
  _theme: string,
  _profilePictureUrl: string | null
): Promise<void> {
  if (!analysis) return

  const children: FileChild[] = []

  // Title and role
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: analysis.name || 'Your Name',
          bold: true,
          size: 32, // 16 pt
        }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 80 },
    })
  )
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: [analysis.currentRole, analysis.currentCompany].filter(Boolean).join(' · ') || 'Professional',
          italics: true,
          size: 22,
        }),
      ],
      spacing: { after: 200 },
    })
  )

  if (analysis.summary) {
    children.push(sectionHeading('Summary'))
    children.push(bodyParagraph(sanitize(analysis.summary)))
  }

  if (analysis.experience && analysis.experience.length > 0) {
    children.push(sectionHeading('Experience'))
    for (const exp of analysis.experience) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: sanitize(exp.title), bold: true, size: 24 }),
          ],
          spacing: { before: 160, after: 40 },
        })
      )
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: [exp.company, exp.duration].filter(Boolean).join(' · ') || '',
              size: 20,
              color: '4A5568',
            }),
          ],
          spacing: { after: 80 },
        })
      )
      if (exp.description) {
        const bullets = sanitize(exp.description).split(/\n|\.(?=\s)/).filter(Boolean)
        for (const line of bullets) {
          const t = line.trim()
          if (t) children.push(bulletParagraph(t))
        }
      }
    }
  }

  if (analysis.skills && analysis.skills.length > 0) {
    children.push(sectionHeading('Skills'))
    const skillText = analysis.skills.slice(0, 16).join(' · ')
    children.push(bodyParagraph(skillText))
  }

  if (analysis.education && analysis.education.length > 0) {
    children.push(sectionHeading('Education'))
    for (const edu of analysis.education) {
      const line = [edu.degree, edu.institution, edu.year].filter(Boolean).join(' — ')
      if (line) children.push(bodyParagraph(line))
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.6),
              right: convertInchesToTwip(0.6),
              bottom: convertInchesToTwip(0.6),
              left: convertInchesToTwip(0.6),
            },
          },
        },
        children,
      },
    ],
    title: analysis.name || 'Resume',
    creator: 'FrontBench',
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Resume-${(analysis.name || 'Resume').replace(/\s+/g, '-')}-${Date.now()}.docx`
  a.click()
  URL.revokeObjectURL(url)
}
