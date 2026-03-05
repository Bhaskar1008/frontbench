import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export const exportToPDF = async (
  elementId: string,
  filename: string,
  _title: string
) => {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error(`Element with id ${elementId} not found`)
    return
  }

  try {
    // Show loading indicator
    const loadingMsg = document.createElement('div')
    loadingMsg.id = 'pdf-loading'
    loadingMsg.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 20px 40px;
      border-radius: 8px;
      z-index: 10000;
      font-size: 16px;
    `
    loadingMsg.textContent = 'Generating PDF...'
    document.body.appendChild(loadingMsg)

    // Create canvas from HTML element – white background so PDF matches resume preview (white card)
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc, clonedElement) => {
        const el = (clonedDoc.getElementById && clonedDoc.getElementById(elementId)) || clonedElement
        if (el && el instanceof HTMLElement) {
          el.style.backgroundColor = '#ffffff'
          el.style.color = '#111827'
          // Ensure all text inside is dark on white for print
          el.querySelectorAll('p, span, li, h1, h2, h3, h4, div').forEach((node) => {
            const htmlEl = node as HTMLElement
            if (htmlEl && htmlEl.style) {
              htmlEl.style.color = '#111827'
              if (htmlEl.style.backgroundColor && htmlEl.style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                htmlEl.style.backgroundColor = '#f3f4f6'
              }
            }
          })
        }
      },
    })

    const imgData = canvas.toDataURL('image/png')
    const imgWidth = 210 // A4 width in mm
    const pageHeight = 297 // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight

    const pdf = new jsPDF('p', 'mm', 'a4')
    let position = 0

    // Resume content with white background (no separate title page)
    pdf.setFillColor(255, 255, 255)
    pdf.rect(0, 0, 210, 297, 'F')
    pdf.addImage(imgData, 'PNG', 0, 10, imgWidth, imgHeight)
    heightLeft -= pageHeight - 10

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    // Remove loading indicator
    document.body.removeChild(loadingMsg)

    // Save PDF
    pdf.save(`${filename}-${new Date().getTime()}.pdf`)
  } catch (error) {
    console.error('Error generating PDF:', error)
    const loadingMsg = document.getElementById('pdf-loading')
    if (loadingMsg) {
      loadingMsg.textContent = 'Error generating PDF. Please try again.'
      loadingMsg.style.background = 'rgba(220, 38, 38, 0.9)'
      setTimeout(() => {
        if (loadingMsg.parentNode) {
          loadingMsg.parentNode.removeChild(loadingMsg)
        }
      }, 3000)
    }
  }
}
