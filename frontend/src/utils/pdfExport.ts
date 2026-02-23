import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export const exportToPDF = async (
  elementId: string,
  filename: string,
  title: string
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

    // Create canvas from HTML element
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#0f172a', // Match dark background
      onclone: (clonedDoc) => {
        // Ensure all styles are applied in cloned document
        const clonedElement = clonedDoc.getElementById(elementId)
        if (clonedElement) {
          clonedElement.style.backgroundColor = '#0f172a'
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

    // Add title page
    pdf.setFontSize(20)
    pdf.setTextColor(59, 130, 246) // Blue color
    pdf.text(title, 105, 20, { align: 'center' })
    pdf.setFontSize(12)
    pdf.setTextColor(100, 100, 100)
    pdf.text(
      `Generated on ${new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`,
      105,
      30,
      { align: 'center' }
    )

    // Add content
    pdf.addImage(imgData, 'PNG', 0, 40, imgWidth, imgHeight)
    heightLeft -= pageHeight - 40

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
