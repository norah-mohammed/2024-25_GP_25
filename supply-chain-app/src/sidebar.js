import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faHouse, faBox, faClipboardList, faTruck } from '@fortawesome/free-solid-svg-icons'; // Import faTruck and faBars
import './sidebar.css';
import logo from './images/only-logo.png';

const Sidebar = ({ role, currentPage, setCurrentPage }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true); // Set sidebar to be open by default

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen); // Toggle the sidebar open/close state
    };

    return (
        <>
            {/* Hamburger Menu */}
            <button className="hamburger-menu" onClick={toggleSidebar}>
                <FontAwesomeIcon icon={faBars} />
            </button>

            <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <img src={logo} alt="Farm To Fork" className="logo" />
                    <span>Farm To Fork</span>
                </div>
                <nav className="sidebar-nav">
                    {role === 'manufacturer' && (
                        <>
                            <a
                                href="#home"
                                onClick={() => setCurrentPage('manufacturerHomePage')}
                                className={`nav-item ${currentPage === 'manufacturerHomePage' ? 'active' : ''}`}
                            >
                                <FontAwesomeIcon icon={faHouse} className="nav-icon" /> Home
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
                                href="#home"
                                onClick={() => setCurrentPage('retailerHomePage')}
                                className={`nav-item ${currentPage === 'retailerHomePage' ? 'active' : ''}`}
                            >
                                <FontAwesomeIcon icon={faHouse} className="nav-icon" /> Home
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
                                href="#home"
                                onClick={() => setCurrentPage('distributorHomePage')}
                                className={`nav-item ${currentPage === 'distributorHomePage' ? 'active' : ''}`}
                            >
                                <FontAwesomeIcon icon={faHouse} className="nav-icon" /> Home
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
        </>
    );
};

export default Sidebar;
