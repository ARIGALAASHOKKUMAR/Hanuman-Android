// GenericDataTable.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import React, { useState } from 'react';
import { CSVLink } from 'react-csv';
import DataTable from 'react-data-table-component';

const DataTableComp = ({ data, columns, exportFileName }) => {
  const [searchText, setSearchText] = useState('');

  const customStyles = {
    headCells: {
      style: {
        backgroundColor: 'var(--site-layout-color)',
        marginTop: '10px',
        color: 'white',
        paddingLeft: '-20px',
        paddingRight: '-20px',
      },
    },
    cells: {
      style: {
        paddingLeft: '-20px',
        paddingRight: '-20px',
      },
    },
  };

  const csvExportProps = {
    data: data.map((item, index) => ({
      SNo: index + 1,
      ...columns.reduce((acc, column) => {
        acc[column.name] =
          typeof column.selector === 'function'
            ? column.selector(item)
            : item[column.selector];
        return acc;
      }, {}),
    })),
    headers: columns
      .filter((column) => column.name !== 'SNo' && column.name !== 'EDIT')
      .map((column) => column.name),
    filename: `${exportFileName}.csv`,
    text: 'Export CSV',
  };

  const filteredData = data.filter((item) => {
    const lowerSearchText = searchText.toLowerCase();
    
    return Object.values(item).some((cellValue) => {
      const formattedCellValue = cellValue ? cellValue.toString().toLowerCase() : '';
      return formattedCellValue.includes(lowerSearchText);
    });
  });
  
 


  const exportToPdf = () => {
    const doc = new jsPDF();
    doc.text('', 14, 16);

    const tableData = filteredData.map((item, index) =>
      columns.map((column) => {
        if (column.name === 'SNo') {
          return index + 1;
        } else if (typeof column.selector === 'function') {
          return column.selector(item);
        } else {
          return item[column.selector];
        }
      })
    );

    const tableColumns = columns
      .filter((column) => column.name !== 'EDIT')
      .map((column) => ({ title: column.name, dataKey: column.name }));

    doc.autoTable({
      head: [tableColumns.map((col) => col.title)],
      body: tableData,
    });

    doc.save(`${exportFileName}.pdf`);
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '10px',
        }}
      >
        <div style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Search..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="bgInput"
            style={{ width: '50%' }}
          />
        </div>

        <div style={{ marginLeft: '10px' }}>
          <CSVLink {...csvExportProps} className="btn btn-success">
            <i className="fa fa-file-excel-o" aria-hidden="true"></i> Export CSV
          </CSVLink>
          <button className="btn btn-danger ml-2" onClick={exportToPdf}>
            <i className="fa fa-file-pdf-o" aria-hidden="true"></i> Export PDF
          </button>
        </div>
      </div>

      <DataTable
        title=""
        columns={columns}
        data={filteredData}
        customStyles={customStyles}
        pagination
        paginationPerPage={5}
        paginationRowsPerPageOptions={[5, 10, 20, 30]}
        keyField="id"
        highlightOnHover
        pointerOnHover
        expandableRowsComponent={<div>Additional Information</div>}
        search
      />
    </div>
  );
};

export default DataTableComp;
