import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end   = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

    for (let i = start; i <= end; i++) pages.push(i);

    return (
        <div className="pagination-bar">
            <button
                className="page-btn"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
            >‹ Prev</button>

            {start > 1 && (
                <>
                    <button className="page-btn" onClick={() => onPageChange(1)}>1</button>
                    {start > 2 && <span className="page-ellipsis">…</span>}
                </>
            )}

            {pages.map(p => (
                <button
                    key={p}
                    className={`page-btn${p === currentPage ? ' active' : ''}`}
                    onClick={() => onPageChange(p)}
                >{p}</button>
            ))}

            {end < totalPages && (
                <>
                    {end < totalPages - 1 && <span className="page-ellipsis">…</span>}
                    <button className="page-btn" onClick={() => onPageChange(totalPages)}>{totalPages}</button>
                </>
            )}

            <button
                className="page-btn"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
            >Next ›</button>

            <span className="page-info">Page {currentPage} of {totalPages}</span>
        </div>
    );
};

export default Pagination;
