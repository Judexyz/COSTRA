const PDFExport = {
  exportProfessionalPDF(title, headers, body, filename) {
    if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
      console.error('jsPDF is not loaded');
      return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'pt', 'a4'); 

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    doc.setFillColor(30, 58, 138); 
    doc.rect(0, 0, pageWidth, 85, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text('COSTRA', 40, 45);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistem Manajemen Cost Control Terpadu', 40, 65);

    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, pageWidth - 40, 45, { align: 'right' });

    doc.setTextColor(30, 41, 59); 
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), 40, 130);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); 
    doc.text(`Total Data: ${body.length} baris`, 40, 150);

    doc.setDrawColor(226, 232, 240); 
    doc.setLineWidth(1.5);
    doc.line(40, 165, pageWidth - 40, 165);

    doc.autoTable({
      startY: 185,
      head: [headers],
      body: body,
      theme: 'striped',
      styles: {
        font: 'helvetica',
        fontSize: 9.5,
        cellPadding: 7,
        textColor: [71, 85, 105], 
        lineColor: [226, 232, 240], 
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [30, 58, 138], 
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] 
      },
      didDrawPage: function (data) {
        
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184); 
        doc.text(`Dokumen ini dihasilkan oleh sistem COSTRA © ${new Date().getFullYear()}`, 40, pageHeight - 30);
        doc.text(`Halaman ${data.pageNumber} dari ${doc.internal.getNumberOfPages()}`, pageWidth - 40, pageHeight - 30, { align: 'right' });
      }
    });

    doc.save(filename);
  }
};
