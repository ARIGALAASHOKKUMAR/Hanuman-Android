import jsPDF from "jspdf";
import { toast } from "react-toastify";
import { CONTEXT_NAME } from "./utils";

// import XLSX from 'xlsx';

// // Function to convert a table to Excel
// export const tableToExcel = (tableRef, sheetName = 'Sheet1',tablehead) => {
//   const ws = XLSX.utils.table_to_sheet(tableRef.current);
//   const wb = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(wb, ws, sheetName);
//   const timestamp = getFormattedTimestamp();
//   // Save the Excel file
//   const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
//   const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
//   const excelFileName = `${CONTEXT_NAME}_${tablehead}_${timestamp}.xlsx`;

//   // Create a download link and trigger the download
//   const link = document.createElement('a');
//   link.href = URL.createObjectURL(blob);
//   link.download = excelFileName;
//   link.click();
// }



const handlePageChange = (newPage, setCurrentPage) => {
  setCurrentPage(newPage);
};
const getFormattedTimestamp = () => {
  return new Date()
    .toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
    .replace(/[^\d]/g, '');
};

export const sortTable = (columnIndex, setSortedColumn, setSortOrder, sortedColumn, sortOrder) => {
  const table = document.getElementById('DataTable'); // Assuming your table ID is 'DataTable'
  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.getElementsByTagName('tr'));
  const isAscending = columnIndex === sortedColumn && sortOrder === 'asc';

  rows.sort((rowA, rowB) => {
    const cellA = rowA.getElementsByTagName('td')[columnIndex];
    const cellB = rowB.getElementsByTagName('td')[columnIndex];

    const valueA = cellA ? cellA.textContent.trim() : '';
    const valueB = cellB ? cellB.textContent.trim() : '';

    if (isAscending) {
      return valueA.localeCompare(valueB, undefined, { numeric: true, sensitivity: 'base' });
    } else {
      return valueB.localeCompare(valueA, undefined, { numeric: true, sensitivity: 'base' });
    }
  });

  // Clear existing rows from the tbody
  tbody.innerHTML = '';

  // Append the sorted rows back to the tbody
  rows.forEach((sortedRow) => tbody.appendChild(sortedRow));

  // Update state to reflect the current sorted column and order
  setSortedColumn(columnIndex);
  setSortOrder(isAscending ? 'desc' : 'asc');
};

export const searchTable = (type, inputValue) => {
  const filter = inputValue.toUpperCase();
  const table = document.getElementById(type);
  const tr = table.getElementsByTagName('tr');
  let index = 0;

  for (let i = 1; i < tr.length; i++) {
    const td = tr[i].getElementsByTagName('td')[1];

    if (td) {
      const txtValue = td.textContent || td.innerText;

      if (txtValue.toUpperCase().indexOf(filter) > -1) {
        tr[i].style.display = '';
      } else {
        tr[i].style.display = 'none';
        index = index + 1;
      }
    }
  }

  if (index === tr.length - 1) {
    toast.error("No Data Found")
    // Call your notify function here or handle the "No Data Found" case
    // Example: notify('', 'No Data Found', 'top', 'right', 'fa fa-comments', 'danger', 'animated bounceIn', 'animated bounceOut', '');
  }
};
export const handleExportPDF = (tableRef, data, tablehead, companylogo, pdfwidths) => {
  if (!tableRef.current) {
    return;
  }

  const pdf = new jsPDF('l', 'px', 'legal');
  const timestamp = getFormattedTimestamp();

  const img = new Image();
  const src = companylogo;
  img.src = src;
  pdf.setTextColor(251, 100, 27);
  pdf.text(tablehead, 30, 20);
  const columnStyles = {};
  const dataa = data.map((row, rowIndex) => [rowIndex + 1, ...row]);
  // Extract header data with colspan and rowspan
  const headers = [];
  const headerRows = tableRef.current.querySelectorAll('thead tr');
  headerRows.forEach((row) => {
    const rowHeaders = [];
    row.querySelectorAll('th').forEach((cell) => {
      const colspan = parseInt(cell.getAttribute('colspan')) || 1;
      const rowspan = parseInt(cell.getAttribute('rowspan')) || 1;

      rowHeaders.push({
        content: cell.textContent.trim(),
        colSpan: colspan,
        rowSpan: rowspan,

      });
    });
    headers.push(rowHeaders);
  });
  const footers = Array.from(tableRef.current.querySelectorAll('tfoot tr')).map((row) =>
    Array.from(row.children).map((cell) => cell.textContent)
  );
  pdfwidths.forEach((width, index) => {
    const columnName = `${index}`;

    columnStyles[columnName] = { cellWidth: parseFloat(width) };
  });
  pdf.autoTable({
    head: headers,
    body: dataa,
    foot: footers.slice(0, -1),
    startY: 25,
    showFoot: 'lastPage',
    theme: 'striped',

    headStyles: {
      theme: 'striped',
      fillColor: [51, 102, 204],
      lineWidth: 0.50,
      lineColor: [245, 245, 245],
    },
    footStyles: {
      theme: 'striped',
      fillColor: [51, 102, 204],
      lineWidth: 0.50,
      lineColor: [245, 245, 245],
    },
    styles: {
      overflow: 'linebreak',
      fontSize: 11,
      cellPadding: 2,
      overflowColumns: 'linebreak',
    },
    columnStyles: columnStyles,

    didDrawPage: (data) => {
      pdf.setTextColor(255, 105, 0);
      pdf.setTextColor(0);
      const imgWidth = 200;
      const imgHeight = 25;
      pdf.addImage(img, 'PNG', 520, 430, imgWidth, imgHeight);
    },
  });
  const startY = pdf.lastAutoTable.finalY;
  pdf.autoTable({
    foot: footers.slice(-1),
    startY: startY,
    theme: 'striped',
    footStyles: {
      theme: 'striped',
      fillColor: [51, 102, 204],
      lineWidth: 0.50,
      lineColor: [245, 245, 245],
    },
  });

  addFooters(pdf);
  pdf.save(`${CONTEXT_NAME}_${tablehead.replace(/\s+/g, '_')}_${timestamp}.pdf`);
};



function addFooters(doc) {
  const pageCount = doc.internal.getNumberOfPages()

  // doc.setFont('helvetica', 'italic')
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  for (var i = 1; i <= pageCount; i++) {

    const pageStr = 'Page ' + i + ' of ' + pageCount;



    doc.setPage(i);
    doc.setTextColor(128, 128, 128);
    doc.text(pageStr, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 5, {
      align: 'center',
    });

  }
}

const handleEntriesPerPageChange = (value, setItemsPerPage, totalItems, setCurrentPage) => {

  setItemsPerPage(value === 'All' ? totalItems : value);
  setCurrentPage(1); // Reset to the first page when changing entries per page
};
export const showEntries = (itemsPerPage, totalItems, setItemsPerPage, setCurrentPage) => {


  return (

    <div className="entries-per-page">
      <span style={{ marginRight: '5px' }}>Show</span>
      <select
        id="entriesPerPage"
        className="form-control d-inline-block"
        style={{ width: '75px', marginRight: '5px' }} // Adjust the width as needed
        onChange={(e) => handleEntriesPerPageChange(e.target.value, setItemsPerPage, totalItems, setCurrentPage)}
        value={itemsPerPage}
      >
        {[10, 25, 50, 100, 'All'].map((entries) => (
          <option key={entries} value={entries}>
            {entries}
          </option>
        ))}
      </select>
      <span>entries</span>
    </div>



  );
};
export const handlePrint = (tablehead) => {
  const printWindow = window.open('');
  printWindow.document.write('<html><head><title>Print</title>');
  printWindow.document.write('</head><body>');
  printWindow.document.write('<h2>' + tablehead + '</h2>');
  printWindow.document.write(document.getElementById('DataTableRawDiv').innerHTML);
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  printWindow.print();
};

export const paginationControls = (totalPages, currentPage, setCurrentPage) => {

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav aria-label="Page navigation">
      <div className="pagination-container ">
        <ul className="pagination">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <a className="page-link" href="#" aria-label="Previous" onClick={() => handlePageChange(currentPage - 1, setCurrentPage)}>
              <span aria-hidden="true">Previous</span>
            </a>
          </li>
          {pages.map((page) => (
            <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
              {/* <a className="page-link" onClick={() => handlePageChange(page,setCurrentPage)}>
                  {page}
                </a> */}
              <a
                className="page-link"
                role="button"
                tabIndex="0"
                onClick={() => handlePageChange(page, setCurrentPage)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handlePageChange(page, setCurrentPage);
                  }
                }}
              >
                {page}
              </a>

            </li>
          ))}
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <a className="page-link" href="#" aria-label="Next" onClick={() => handlePageChange(currentPage + 1, setCurrentPage)}>
              <span aria-hidden="true">Next</span>
            </a>
          </li>
        </ul>
      </div>
    </nav>
  )

}     