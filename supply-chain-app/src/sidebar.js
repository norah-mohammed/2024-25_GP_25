import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faHouse, faBox, faClipboardList, faTruck } from '@fortawesome/free-solid-svg-icons';
import './sidebar.css';
import Breadcrumb from './Breadcrumb'; // Import the Breadcrumb component
import logo from './images/only-logo.png';

const Sidebar = ({ role, currentPage, setCurrentPage }) => {
    console.log("Current Page in Sidebar:", currentPage);

    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        // Add or remove a class on the <body> based on sidebar state
        document.body.classList.toggle('sidebar-closed', !sidebarOpen);
    }, [sidebarOpen]);

    // Handle breadcrumb visibility
    const hiddenBreadcrumbPages = ["AddProduct", "viewManufacturers", "manufacturerProduct", "placeOrder"];
    const showBreadcrumb = !hiddenBreadcrumbPages.includes(currentPage);

    // Control sidebar based on the current page
    useEffect(() => {
        if (currentPage === 'nonUserPage') {
            setSidebarOpen(false); // Automatically close the sidebar for non-user pages
        }
    }, [currentPage]);

    const toggleSidebar = () => {
        setSidebarOpen((prev) => !prev);
    };

    const isNonUserPage = currentPage === 'nonUserPage';
    if (isNonUserPage) {
        return null; // Don't render the sidebar for non-user pages
    }

    return (
        <>
            {/* Hamburger Menu */}
            <button className="hamburger-menu" onClick={toggleSidebar}>
                <FontAwesomeIcon icon={faBars} />
            </button>

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <img src={logo} alt="Farm To Fork" className="logo" />
                    <span>Farm To Fork</span>
                </div>
                <nav className="sidebar-nav">
                    {role === 'manufacturer' && (
                        <>
                            <a
                                href="#dashboard"
                                onClick={() => setCurrentPage('manufacturerHomePage')}
                                className={`nav-item ${currentPage === 'manufacturerHomePage' ? 'active' : ''}`}
                            >
                                <FontAwesomeIcon icon={faHouse} className="nav-icon" /> Dashboard
                            </a>
                            <a
                                href="#products"
                                onClick={() => setCurrentPage('manufacturer')}
                                className={`nav-item ${currentPage === 'manufacturer' ? 'active' : ''}`}
                            >
                                <FontAwesomeIcon icon={faBox} className="nav-icon" /> Products
                            </a>
                            <a
                                href="#orders"
                                onClick={() => setCurrentPage('ordersPage')}
                                className={`nav-item ${currentPage === 'ordersPage' ? 'active' : ''}`}
                            >
                                <FontAwesomeIcon icon={faClipboardList} className="nav-icon" /> Orders
                            </a>
                            <a
                                href="#distributors"
                                onClick={() => setCurrentPage('manufacturerDistributorsPage')}
                                className={`nav-item ${currentPage === 'manufacturerDistributorsPage' ? 'active' : ''}`}
                            >
                                <FontAwesomeIcon icon={faTruck} className="nav-icon" /> Distributors
                            </a>
                        </>
                    )}
                    {role === 'retailer' && (
                        <>
                            <a
                                href="#dashboard"
                                onClick={() => setCurrentPage('retailerHomePage')}
                                className={`nav-item ${currentPage === 'retailerHomePage' ? 'active' : ''}`}
                            >
                                <FontAwesomeIcon icon={faHouse} className="nav-icon" /> Dashboard
                            </a>
                            <a
                                href="#viewManufacturers"
                                onClick={() => setCurrentPage('viewManufacturers')}
                                className={`nav-item ${currentPage === 'viewManufacturers' ? 'active' : ''}`}
                            >
                                <FontAwesomeIcon icon={faClipboardList} className="nav-icon" /> View Manufacturers
                            </a>
                        </>
                    )}
                    {role === 'distributor' && (
                        <>
                            <a
                                href="#dashboard"
                                onClick={() => setCurrentPage('distributorHomePage')}
                                className={`nav-item ${currentPage === 'distributorHomePage' ? 'active' : ''}`}
                            >
                                <FontAwesomeIcon icon={faHouse} className="nav-icon" /> Dashboard
                            </a>
                            <a
                                href="#orders"
                                onClick={() => setCurrentPage('distributorOrdersPage')}
                                className={`nav-item ${currentPage === 'distributorOrdersPage' ? 'active' : ''}`}
                            >
                                <FontAwesomeIcon icon={faClipboardList} className="nav-icon" /> Orders
                            </a>
                        </>
                    )}
                </nav>
            </aside>

            {/* Breadcrumb */}
            <div className="page-content">
                {showBreadcrumb && (
                    <Breadcrumb currentPage={currentPage} setCurrentPage={setCurrentPage} />
                )}
            </div>
        </>
    );
};

export default Sidebar;
