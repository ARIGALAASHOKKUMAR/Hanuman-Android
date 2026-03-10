import jsPDF from 'jspdf';
import 'jspdf-autotable';
import React, { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import companylogo from '../images/aplogo.png';
import { toast } from 'react-toastify';
import CustomTooltip from './CustomTooltip';
import { CONTEXT_NAME } from '../components/siteLayout/ContextVariables';
import { numberToWordsWithPrecision } from './CommonFunctions';
const ShowReport = ({ dataSet }) => {

  const [sortedColumn, setSortedColumn] = useState(-1);
  const [sortOrder, setSortOrder] = useState('asc');
  const tableRef = useRef(null);
  let sno = 1;

  const [currentPage, setCurrentPage] = useState(1);
  const { data, headings = [], headings1 = [], headings2 = [], headings3 = [], links = [], aligns = [], totals = [], datatypes = [], displays = [], pdfwidths = [], tablehead, reportgeneratedtime, pagination, search, pdfdownload, exceldownload, printbutton, isSerialNoReq } = dataSet ?? {};
  const totalItems = data ? data.length : 0;
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const totalPages = pagination && pagination === 'true' ? Math.ceil(totalItems / itemsPerPage) : 1;

  const [currentValue, setCurrentValue] = useState(0);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    let startValue = 0;
    const targetValue = data?.length ?? 0;
    const increment = targetValue / 200;
    const duration = 2000;
    const stepTime = duration / 200;

    const timer = setInterval(() => {
      startValue += increment;
      if (startValue >= targetValue) {
        clearInterval(timer);
        setCurrentValue(targetValue);
      } else {
        setCurrentValue(Math.round(startValue));
        setScale(prevScale => (prevScale === 1 ? 1.1 : 1));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [data]);

  const formatNumberWithCommas = (num) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };





  useEffect(() => {
    if (data !== null && data !== undefined && data.length > 0) {
      toast.success(`${data.length} rows fetched`);
    }
    setCurrentPage(1);
  }, [dataSet]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + parseInt(itemsPerPage);
  const slicedData = pagination && pagination === 'true' ? data ? data.slice(startIndex, endIndex) : [] : data;
  const [searchInput, setSearchInput] = useState('');
  const [showFilteredData, setShowFilteredData] = useState(false)
  const searchTable = (inputValue) => {

    if (inputValue === '') {
      //setCurrentPage(1)
      setShowFilteredData(false)
    }
    else {
      setSearchInput(inputValue.toUpperCase());
      setShowFilteredData(true);
    }

  };
  const filteredData = data
    ? data.filter((row) =>
      row.some((cell) =>
        String(cell).toUpperCase().includes(searchInput.toUpperCase())
      )
    )
    : [];


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


  const handleExportCSV = () => {
    const headersTable = document.createElement('table');
    headersTable.innerHTML = tableRef.current.querySelector('thead').outerHTML;
    const ws = XLSX.utils.table_to_sheet(headersTable);
    const excludedIndexes = displays.reduce((acc, value, index) => {
      if (value === 'N' && index !== 0) {
        acc.push(index - 1);
      }
      return acc;
    }, []);

    const dataRows = data.map((row, rowIndex) => {
      const modifiedRow = row
        .filter((_, index) => !excludedIndexes.includes(index))
        .map(item => {
          // Check if the item contains a hyperlink (<a> tag)
          if (typeof item === 'string' && item.toLowerCase().includes('click here'.toLowerCase())) {
            return '-';  // Replace the <a> link with a dash
          }
          return item;
        });
      return [rowIndex + 1, ...modifiedRow];

    });






    XLSX.utils.sheet_add_aoa(ws, dataRows, { origin: -1 });

    const footers = Array.from(tableRef.current.querySelectorAll('tfoot tr')).map((row) =>
      Array.from(row.children).map((cell) => cell.textContent)
    );
    XLSX.utils.sheet_add_aoa(ws, footers, { origin: -1 });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws);
    const timestamp = getFormattedTimestamp();

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const excelFileName = `${CONTEXT_NAME.replace(/[()\s-]/g, '_').toLocaleLowerCase()}_${tablehead.replace(/[()\s-]/g, '_').toLocaleLowerCase()}_${timestamp}.xlsx`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = excelFileName;
    link.click();
  };


   const handleExportPDF = () => {
    if (!tableRef.current) {
      return;
    }
    sno = 1;
    const pdf = new jsPDF('l', 'px', 'legal');
    const timestamp = getFormattedTimestamp();
 
    const excludedIndexes = displays.reduce((acc, value, index) => {
      if (value === 'N' && index !== 0) {
        acc.push(index - 1);
      }
      return acc;
    }, []);
 
    const dataa = data.map((row, rowIndex) => {
      const modifiedRow = row.map((cell, cellIndex) => {
        if (row[2] === "Sub Total") {
          return {
            content: typeof cell === "string" ? cell : formatNumberWithCommas(cell),
            styles: { fillColor: [0, 128, 0], textColor: [255, 255, 255] }
          };
        }
        else if (typeof cell === 'number' && displays[cellIndex + 1] === 'Y' && datatypes[cellIndex + 1] === 'I' && totals[cellIndex + 1] === 'T') {
          return formatNumberWithCommas(cell);
        }
        else {
          return (cell ?? '').toString().replace(/<li>/g, "• ").replace(/<\/li>/g, "\n");
        }
      });
 
 
      const filteredRow = modifiedRow.filter((_, index) => !excludedIndexes.includes(index));
 
      // Replace <a> tags with a dash and apply centering style
      const updatedRow = filteredRow.map(item => {
        if (typeof item === 'string' && item.toLowerCase().includes('click here')) {
          return {
            content: '-',
            styles: { halign: 'center' }
          };
        } else {
          return item;
        }
      });
 
 
      return [row[2] !== "Sub Total"
        ? sno++
        : { content: '', styles: { fillColor: [0, 128, 0], textColor: [255, 255, 255] } },
      ...updatedRow,
      ];
 
    });
 
    const footers = Array.from(tableRef.current.querySelectorAll('tfoot tr')).map((row) =>
      Array.from(row.children).map((cell) => cell.textContent)
    );
 
    const headers = [];
    const headerRows = Array.from(tableRef.current.querySelectorAll('thead tr'));
    headerRows.forEach((row) => {
      const rowHeaders = [];
      row.querySelectorAll('th').forEach((cell) => {
        const colspan = parseInt(cell.getAttribute('colSpan')) || 1;
        const rowspan = parseInt(cell.getAttribute('rowSpan')) || 1;
 
        rowHeaders.push({
          content: cell.textContent.trim(),
          colSpan: colspan,
          rowSpan: rowspan,
          cellHeight: 20,
        });
      });
      headers.push(rowHeaders);
    });
 
    const tableData = [...dataa];
    const footerData = [...footers];
 
    const img = new Image();
    const src = companylogo;
    img.src = src;
    pdf.setTextColor(251, 100, 27);
    pdf.text(tablehead, 30, 20);
 
    // Define column styles
    const alignmentMapping = {
      C: 'center',
      L: 'left',
      R: 'right',
    };
 
    const alignsS = []
    displays.map((each, index) => {
      if (each === "Y") {
        alignsS.push(aligns[index])
      }
    })
 
    const columnStyles = {};
    pdfwidths.forEach((width, index) => {
      const columnName = `${index}`;
      columnStyles[columnName] = {
        cellWidth: parseFloat(width),
        halign: alignmentMapping[alignsS[index]] || 'center', // Map alignments dynamically
        valign: 'middle', // Keep vertical alignment consistent
      };
    });
 
    pdf.autoTable({
      startY: 25,
      showFoot: 'lastPage',
      theme: 'striped',
      head: headers,
      body: tableData,
      foot: footerData.slice(0, -1),
      headStyles: {
        theme: 'striped',
        fillColor: [26, 162, 96],
        lineWidth: 0.50,
        lineColor: [245, 245, 245],
      },
      footStyles: {
        theme: 'striped',
        fillColor: [26, 162, 96],
        lineWidth: 0.50,
        lineColor: [245, 245, 245],
      },
      styles: {
        overflow: 'linebreak',
        fontSize: 11,
        cellPadding: 3,
        overflowColumns: 'linebreak',
        halign: 'center',
        valign: 'middle',
      },
      columnStyles: columnStyles, // Pass column styles here
      didDrawPage: (data) => {
        pdf.setTextColor(255, 105, 0);
        pdf.setTextColor(0);
        const imgWidth = 50;
        const imgHeight = 25;
        pdf.addImage(img, 'PNG', 430, 430, imgWidth, imgHeight);
      },
    });
 
    const lastRow = footerData[footerData.length - 1];
    const startY = pdf.lastAutoTable.finalY;
 
    pdf.autoTable({
      foot: [lastRow],
      startY: startY,
      theme: 'striped',
      footStyles: {
        theme: 'striped',
        fillColor: [26, 162, 96],
        lineWidth: 0.50,
        lineColor: [245, 245, 245],
      },
    });
 
    addFooters(pdf);
    pdf.save(
      `${CONTEXT_NAME.replace(/[()\s-,]/g, '_').toLocaleLowerCase()}_${tablehead
        .replace(/[()\s-,]/g, '_')
        .toLocaleLowerCase()
        .replace(/,/g, '')}_${timestamp}.pdf`
    );
  };
 
 
  function addFooters(doc) {
    const pageCount = doc.internal.getNumberOfPages()
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    for (var i = 1; i <= pageCount; i++) {
      const pageStr = 'Page ' + i + ' of ' + pageCount;
      doc.setPage(i);
      doc.setTextColor(128, 128, 128);
      doc.text(pageStr, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 5,
        {
          align: 'center',
        });

    }
  }


  let a = "left";
  let o = 0;
  const td_color = null;
  const colour = null;
  const tableFoot = null;
  const total_links = null;



  let cols = 0;

  const handleEntriesPerPageChange = (value) => {
    setCurrentPage(1);
    setShowFilteredData(false)
    setItemsPerPage(value === 'All' ? totalItems : value);

  };

  const sortTable = (columnIndex) => {
    const table = document.getElementById('DataTable');
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
      }
      else {
        return valueB.localeCompare(valueA, undefined, { numeric: true, sensitivity: 'base' });
      }
    });

    tbody.innerHTML = '';
    rows.forEach((sortedRow) => tbody.appendChild(sortedRow));
    setSortedColumn(columnIndex);
    setSortOrder(isAscending ? 'desc' : 'asc');
  };



  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Print</title>');
    printWindow.document.write('<style>');
    printWindow.document.write('body { font-family: Arial, sans-serif; margin: 0; padding: 0; }');
    printWindow.document.write('table { width: 100%; border-collapse: collapse; margin-top: 20px; }');
    printWindow.document.write('th, td { border: 1px solid #000; padding: 8px; text-align: center; }');
    printWindow.document.write('th { background-color: #19474d; color: #ffffff; }');
    printWindow.document.write('a { color: orange; text-decoration: none; }');
    printWindow.document.write('a:hover { text-decoration: underline; }');
    printWindow.document.write('.total-row { background-color: #FFF0F5; font-weight: bold; }');
    printWindow.document.write('tbody tr:nth-child(even) { background-color:#c2e4e6;}'); // Light gray for even rows
    printWindow.document.write('tbody tr:nth-child(odd) { background-color: #ffffff; }'); // White for odd rows
    printWindow.document.write('</style>');
    printWindow.document.write('</head><body>');

    printWindow.document.write('<h2 style="text-align: center;">' + tablehead + '</h2>');

    printWindow.document.write('<table>');
    printWindow.document.write('<thead>');

    if (headings3.length > 0) {
      printWindow.document.write('<tr>');
      headings3.forEach((header) => {
        const [colspan, rowspan, heading] = header.split('#');
        printWindow.document.write(`<th colspan="${colspan}" rowspan="${rowspan}">${heading}</th>`);
      });
      printWindow.document.write('</tr>');
    }

    if (headings2.length > 0) {
      printWindow.document.write('<tr>');
      headings2.forEach((header) => {
        const [colspan, rowspan, heading] = header.split('#');
        printWindow.document.write(`<th colspan="${colspan}" rowspan="${rowspan}">${heading}</th>`);
      });
      printWindow.document.write('</tr>');
    }

    if (headings1.length > 0) {
      printWindow.document.write('<tr>');
      headings1.forEach((header) => {
        const [colspan, rowspan, heading] = header.split('#');
        printWindow.document.write(`<th colspan="${colspan}" rowspan="${rowspan}">${heading}</th>`);
      });
      printWindow.document.write('</tr>');
    }

    printWindow.document.write('<tr>');
    headings.forEach((header) => {
      printWindow.document.write('<th>' + header + '</th>');
    });
    printWindow.document.write('</tr>');
    printWindow.document.write('</thead><tbody>');

    data.forEach((row, rowIndex) => {
      printWindow.document.write('<tr>');
      printWindow.document.write('<td>' + (rowIndex + 1) + '</td>');

      row.forEach((cell, colIndex) => {
        // Convert the cell content to a string to handle any type (numbers, objects, etc.)
        let cellContent = String(cell);
        if (displays[colIndex + 1] === 'Y') {
          const l = parseInt(links[colIndex + 1].substring(0, 1));
          if (cellContent.trim().toLowerCase().startsWith("<a")) {
            cellContent = '-';
          }

          // Write the cell data (with or without links)
          printWindow.document.write(
            `<td align="${aligns[colIndex + 1]}">
              ${links[colIndex + 1] === 'N'
              ? cellContent
              : `<a href="${links[colIndex + 1].substring(1)}${row[l - 1]}" 
                   onclick="event.preventDefault(); return false;" 
                   style="cursor: default; text-decoration: none;">${cellContent}</a>`}
            </td>`
          );
        }
      });

      printWindow.document.write('</tr>');
    });


    // Update for total row calculation to prevent NaN
    printWindow.document.write('<tr class="total-row">');
    printWindow.document.write('<td colspan="1">Total</td>');
    totals.forEach((totalType, j) => {
      if (j > 0 && displays[j] === 'Y') {
        if (totalType === 'T') {
          // Safely sum numeric values, defaulting to 0 for invalid values
          const t = data.reduce((acc, row) => {
            const value = parseFloat(row[j - 1]); // Parse the value as a float
            return acc + (isNaN(value) ? 0 : value); // If not valid, add 0
          }, 0);
          printWindow.document.write(
            `<td>
              ${total_links === 'Y' && links[j] !== 'N' ? `<a href="${links[j].substring(1)}total">${t}</a>` : t}
            </td>`
          );
        } else if (totalType === 'C') {
          printWindow.document.write(`<td>${data.length}</td>`);
        } else {
          printWindow.document.write('<td></td>');
        }
      }
    });
    printWindow.document.write('</tr>');

    // Add the report generated timestamp
    printWindow.document.write(`<tr class="total-row">
        <td colspan="${cols}">
            ${CONTEXT_NAME} Report Generated Date and Time: ${reportgeneratedtime}
        </td>
    </tr>`);

    printWindow.document.write('</tbody></table>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };




  const paginationControls = () => {
    const pagesToShow = 3;
    const totalPagesToShow = Math.min(pagesToShow, totalPages);
    const middlePage = Math.ceil(pagesToShow / 2);

    const startPage = Math.max(1, currentPage - middlePage + 1);
    const endPage = Math.min(startPage + totalPagesToShow - 1, totalPages);

    const pages = Array.from({ length: totalPagesToShow }, (_, index) => startPage + index);

    return (
      <nav aria-label="Page navigation">
        <div className="pagination-container">
          Total Pages: {totalPages}
          <ul className="pagination">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <a className="page-link" href="#" aria-label="Previous" onClick={(e) => {
                e.preventDefault();
                handlePageChange(currentPage - 1);
              }}>
                <span aria-hidden="true">Previous</span>
              </a>
            </li>
            {pages.map((page) => (
              <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
                {/* <a className="page-link" onClick={() => handlePageChange(page)}>
                  {page}
                </a> */}
                <a
                  className="page-link"
                  role="button"
                  tabIndex="0"
                  onClick={() => handlePageChange(page)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault(); // Prevent spacebar from scrolling
                      handlePageChange(page);
                    }
                  }}
                  aria-label={`Go to page ${page}`}
                >
                  {page}
                </a>

              </li>
            ))}
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <a className="page-link" href="#" aria-label="Next" onClick={(e) => {
                e.preventDefault();
                handlePageChange(currentPage + 1);
              }}>
                <span aria-hidden="true">Next</span>
              </a>
            </li>
          </ul>
        </div>
      </nav>
    );
  }


  const showEntries = () => {


    return (

      <div className="entries-per-page">
        <span style={{ marginRight: '5px' }}>Show</span>
        <select
          id="entriesPerPage"
          className="form-control d-inline-block"
          style={{ width: '90px', marginRight: '5px' }}
          onChange={(e) => handleEntriesPerPageChange(e.target.value)}
          value={itemsPerPage === totalItems ? 'All' : parseInt(itemsPerPage, 10)}
        >
          {[10, 25, 50, 100, 'All'].map((entries) => (
            <option key={entries} value={entries}>
              {entries === 'All' ? `All(${data && data.length !== undefined && data.length !== null ? data.length : 0})` : entries}
            </option>
          ))}
        </select>
        <span>entries</span>
      </div>



    );
  };




  return (
    <>
      <br></br>

      {data && data.length > 0 ? (
        <span>



          <div className="row" style={{ marginTop: '-25px', marginBottom: '3px' }}>
            <div className="col-xs-12 col-sm-12 col-md-12 col-lg-12">
              <h3 className="popuptitle" id="tablehead" style={{}}>
                <i className="fa fa-file-text-o" aria-hidden="true"></i> {tablehead}

                <span
                  style={{
                    color: '#cec4c452',
                    fontSize: '24px',
                    transition: 'transform 0.1s ease-in-out',
                    transform: `scale(${scale})`,
                  }}
                >
                  &nbsp;{currentValue} rows fetched

                </span>


              </h3>
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '5px',
            marginBottom: '-25px'
          }} >
            <div style={{ flex: 1 }}> {pagination && pagination === 'true' && showEntries()}   </div>
            <div syle={{ flex: 1 }}>

              {exceldownload && exceldownload === 'true' && <button onClick={handleExportCSV} className="btn btn-success">
                <i className="fa fa-file-excel-o" aria-hidden="true"></i> Excel
              </button>
              }
              {pdfdownload && pdfdownload === 'true' && <button className="btn btn-danger ml-2" onClick={handleExportPDF}>
                <i className="fa fa-file-pdf-o" aria-hidden="true"></i> PDF
              </button>
              }
              {printbutton && printbutton === 'true' && <button className="btn btn-primary ml-2" style={{ background: '#306EFF', borderRadius: '5px' }} onClick={handlePrint}>
                <i className="fa fa-print" aria-hidden="true"></i> Print
              </button>
              }
            </div>
            <div style={{ flex: 1, marginLeft: '40px' }}>
              {search && search === 'true' && <input
                type="text"
                id="assignedInput"
                className="form-control bgInput"
                onKeyUp={(e) => searchTable(e.target.value)}

                placeholder="Search..."

              />}
            </div>
          </div>
          <div id="DataTableRawDiv" className="table-responsive" style={{ marginTop: '30px' }}>

            <table ref={tableRef} align="center" border="1" className="table table-condensed table-bordered table-bordered-fd-side table-striped" id="DataTable" >
              <thead style={{ backgroundColor: 'white' }}>
                {headings3 && headings3.length > 0 && (
                  <tr>
                    {headings3.map((head, index) => {
                      const headCol3 = head.split('#');

                      return (
                        <th
                          key={index}
                          style={{
                            textAlign: 'center',
                            backgroundColor: 'red',
                          }}
                          colSpan={headCol3[0]}
                          rowSpan={headCol3[1]}
                        >
                          {headCol3[2]}
                        </th>
                      );
                    })}
                  </tr>
                )}


                {headings2 && headings2.length > 0 && (
                  <tr>
                    {headings2.map((head, index) => {
                      const headCol2 = head.split('#');

                      return (
                        <th
                          key={index}
                          style={{
                            textAlign: 'center',
                            backgroundColor: 'red',
                          }}
                          colSpan={headCol2[0]}
                          rowSpan={headCol2[1]}
                        >
                          {headCol2[2]}
                        </th>
                      );
                    })}
                  </tr>
                )}

                {headings1 && headings1.length > 0 && (
                  <tr>
                    {headings1.map((head, index) => {
                      const headCol1 = head.split('#');

                      return (
                        <th
                          key={index}
                          style={{
                            textAlign: 'center',
                            backgroundColor: 'red',
                          }}
                          colSpan={headCol1[0]}
                          rowSpan={headCol1[1]}
                        >
                          {headCol1[2]}
                        </th>
                      );
                    })}
                  </tr>
                )}




                <tr>
                  {headings && headings.map((item, index) => (
                    <th key={index} align="center">
                      {item}
                    </th>
                  ))}
                </tr>

                <tr>
                  {displays && displays.map((value, index) => {
                    if (value === "Y") {
                      o++;

                      return (
                        <th key={index} align="center">
                          {/* <a data-toggle="tooltip" onClick={() => sortTable(index)} title="Click to sort" style={{ fontSize: '15px', color: '#FFF', cursor: 'pointer' }}>
                            <i className="fa fa-sort" aria-hidden="true"></i>
                          </a> */}
                          <a
                            role="button"
                            tabIndex="0"
                            onClick={() => sortTable(index)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault(); // Prevent scrolling on Space
                                sortTable(index);
                              }
                            }}
                            title="Click to sort"
                            style={{ fontSize: '15px', color: '#FFF', cursor: 'pointer' }}
                            aria-label="Sort table"
                          >
                            <i className="fa fa-sort" aria-hidden="true"></i>
                          </a>

                          {o}
                          {/* <a data-toggle="tooltip" onClick={() => sortTable(index)} title="Click to sort" style={{ fontSize: '15px', color: '#FFF', cursor: 'pointer' }}>
                            <i className="fa fa-sort" aria-hidden="true"></i>
                          </a> */}
                          <a
                            role="button"
                            tabIndex="0"
                            onClick={() => sortTable(index)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') sortTable(index);
                            }}
                            title="Click to sort"
                            style={{ fontSize: '15px', color: '#FFF', cursor: 'pointer' }}
                            aria-label="Sort table"
                          >
                            <i className="fa fa-sort" aria-hidden="true"></i>
                          </a>

                        </th>
                      );
                    }
                    return null;
                  })}
                </tr>
              </thead>
              <tbody>
                {data && !showFilteredData && slicedData.map((row, rowIndex) => {
                  const circleTotalStyles = {
                    backgroundColor: '#026C3D',
                    color: 'white',
                  };

                  const defaultStyles = {};

                  const styles = row[4] === 'Circle Total' || row[2] === 'Sub Total' ? circleTotalStyles : defaultStyles;

                  return (
                    <tr key={rowIndex} style={styles}>
                      <td align="center">{(row[4] !== 'Circle Total' && row[2] !== 'Sub Total' && isSerialNoReq !== 'false') ? sno++ : ''}</td>
                      {row.map((cell, colIndex) => {
                        if (displays[colIndex + 1] === "Y") {
                          if (aligns[colIndex + 1] === "C") {
                            a = "center";
                          } else if (aligns[colIndex + 1] === "R") {
                            a = "right";
                          } else {
                            a = "left";
                          }

                          let color = "";
                          if (td_color !== null) {
                            color = colour[colIndex + 1];
                          }
                          cols = (colIndex + 1) + 1;
                          return (
                            <td key={colIndex} style={{ color: color }} align={a}>
                              {(() => {
                                const link = links[colIndex + 1];
                                const cellTrimmed = cell !== null && (cell.toString().trim());
                                const isPending = cellTrimmed === '<span style=color:red>Pending</span>';
                                const isCircleTotal = row[4] === 'Circle Total';
                                const isSubTotal = row[2] === 'Sub Total';
                                const isZero = cellTrimmed === "0";
                                const dataType = datatypes[colIndex + 1];
                                const isTotal = totals[colIndex + 1];

                                if (link === "N" && dataType === "I" && isTotal === "T" && typeof cell === "number") {
                                  return <><CustomTooltip direction="top" color={row[4] === 'Circle Total' || row[2] === 'Sub Total' ? 'white' : '#353C4E'} title={<div className='telugu2' dangerouslySetInnerHTML={{ __html: numberToWordsWithPrecision(cell) }} />} content={formatNumberWithCommas(cell)} /> </>;
                                }
                                else if (link !== "N" && !isZero && !isPending && !isCircleTotal && !isSubTotal) {
                                  const l = parseInt(link.substring(0, 1));
                                  return (<a href={`${link.substring(1)}${row[l - 1]}`}> <CustomTooltip direction="right" color="#ff7f36" title="Click here to detailed report" content={cell} /> </a>
                                  );
                                }
                                else {
                                  return <><span style={{ fontSize: '19px', color: row[4] === 'Circle Total' || row[2] === 'Sub Total' ? 'white' : '#353C4E' }} dangerouslySetInnerHTML={{ __html: cell }} /></>;
                                }
                              })()}
                            </td>
                          );

                        }

                        return null;
                      })}

                    </tr>
                  );
                })}
                {
                  data && showFilteredData && filteredData.map((row, rowIndex) => {


                    return (
                      <tr key={rowIndex}>
                        <td align="center">{rowIndex + 1}</td>
                        {row.map((cell, colIndex) => {
                          if (displays[colIndex + 1] === "Y") {
                            if (aligns[colIndex + 1] === "C") {
                              a = "center";
                            } else if (aligns[colIndex + 1] === "R") {
                              a = "right";
                            }
                            else {
                              a = "left";
                            }

                            let color = "";
                            if (td_color !== null) {
                              color = colour[colIndex + 1];
                            }
                            cols = (colIndex + 1) + 1;
                            return (
                              <td
                                key={colIndex}
                                style={{ color: color }}
                                align={a}
                              >
                                {links[colIndex + 1] === "N" ? (
                                  <div dangerouslySetInnerHTML={{ __html: cell }} />
                                ) : (
                                  <>
                                    {(() => {
                                      const l = parseInt(links[colIndex + 1].substring(0, 1));
                                      return (
                                        <a
                                          style={{ color: `#fb641b,font-weight:500!, ${color}`, }}
                                          data-toggle="tooltip"
                                          title="Click here to get Detailed Reports"
                                          href={`${links[colIndex + 1].substring(1)}${row[l - 1]}`}
                                        >
                                          <span style={{ fontSize: '22px' }}>{cell}</span>
                                        </a>
                                      );
                                    })()}
                                  </>
                                )}
                              </td>
                            );
                          }

                          return null;
                        })}

                      </tr>
                    );
                  })}

              </tbody>

              <tfoot>
                <tr>
                  <td style={{ fontSize: 'small' }} colSpan="1">
                    Total
                  </td>
                  {data &&
                    totals.map((totalType, j) => {
                      if (j > 0 && displays[j] === 'Y') {
                        if (totalType === 'T') {
                          if (datatypes[j] === 'I') {
                            let t = 0;
                            for (let i = 0; i < data.length; i++) {
                              const row = data[i];
                              if (row[4] !== 'Circle Total' && row[2] !== 'Sub Total' && !isNaN(row[j - 1]) && row[j - 1] !== null && row[j - 1] !== '') {
                                t += parseFloat(row[j - 1]);
                              }

                            }
                            t = parseFloat(t.toFixed(4));
                            const amountWords = numberToWordsWithPrecision(t);
                            const tValue = formatNumberWithCommas(t);

                            return (
                              <td key={j} align="right">
                                {total_links === 'Y' && links[j] !== 'N' ? (
                                  <a style={{ color: 'orange' }} href={`${links[j].substring(1)}total`}>
                                    <span style={{ fontSize: 'small' }}>{t} </span>
                                  </a>
                                ) : (
                                  <>
                                    {(() => {
                                      //const l = parseInt(links[j].substring(0, 1));
                                      return (
                                        <>
                                          <CustomTooltip direction="top" color="white" title={<div className='telugu2' dangerouslySetInnerHTML={{ __html: amountWords }} />} content={tValue} />
                                        </>
                                      );
                                    })()}
                                  </>
                                )}
                              </td>
                            );
                          }
                        }
                        else {
                          return <td key={j} ></td>;
                        }
                      }
                      return null;
                    })}
                </tr>
                <tr>
                  <td colSpan={displays.length}>
                    {CONTEXT_NAME} Report Generated  Date and Time : {reportgeneratedtime}
                  </td>
                </tr>
              </tfoot>

            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', }} >
            <div style={{ flex: 1 }}>   </div>
            <div style={{ marginLeft: '10px', marginTop: '-20px' }}>
              {
                pagination && pagination === 'true' && paginationControls()
              }
            </div>
          </div>
        </span>
      ) :
        (<div className={'failure'} style={{ textAlign: 'center' }}>
          <strong> <i className="fa fa-exclamation-triangle" aria-hidden="true"></i> No Data Found</strong>
        </div>)}

    </>
  )
}
export default ShowReport