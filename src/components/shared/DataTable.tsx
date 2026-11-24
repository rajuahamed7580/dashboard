import React from 'react';
import Loading from './Loading';
import EmptyState from './EmptyState';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  className?: string;
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  caption?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  footer?: React.ReactNode;
}

export default function DataTable<T>({
  columns,
  data,
  rowKey,
  loading = false,
  caption = 'Data table',
  emptyTitle = 'No records found',
  emptyDescription,
  emptyAction,
  footer
}: DataTableProps<T>) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {loading ? (
        <Loading label="Loading records..." />
      ) : data.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      ) : (
        <div
          tabIndex={0}
          role="region"
          aria-label={caption}
          className="table-wrapper"
        >
          <table className="responsive-data-table text-left text-sm text-slate-300">
            <caption className="inclusively-hidden">{caption}</caption>
            <thead className="bg-slate-800/90 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={`px-5 py-3.5 border-b border-slate-800 ${
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                    } ${col.className || ''}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {data.map((row) => (
                <tr key={rowKey(row)} className="hover:bg-slate-800/40 transition-colors">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      data-label={col.header}
                      className={`px-5 py-4 align-middle ${
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      } ${col.className || ''}`}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {footer}
    </div>
  );
}
