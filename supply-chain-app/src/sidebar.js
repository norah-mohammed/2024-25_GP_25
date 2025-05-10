import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faHouse, faBox, faClipboardList, faTruck,faCircle } from '@fortawesome/free-solid-svg-icons';
import './sidebar.css';
import Breadcrumb from './Breadcrumb'; // Import the Breadcrumb component
import logo from './images/only-logo.png';
import manufacturerImage from './images/Nestle-Symbol.png';
import retailerImage from './images/carrefour-c.svg';
import distributorImage from './images/DHL-Logo.wine.png';

const Sidebar = ({ role, currentPage, setCurrentPage, invalidTempOrders }) => {
    console.log("Current Page in Sidebar:", currentPage);
    console.log("Invalid Temp Orders in Sidebar:", invalidTempOrders);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const sidebarRef = useRef(null);

    useEffect(() => {
        document.body.classList.toggle('sidebar-closed', !sidebarOpen);
    }, [sidebarOpen]);

   

    const hiddenBreadcrumbPages = ["AddProduct", "viewManufacturers", "manufacturerProduct", "placeOrder"];
    const showBreadcrumb = !hiddenBreadcrumbPages.includes(currentPage);

    useEffect(() => {
        if (currentPage === 'nonUserPage') {
            setSidebarOpen(false);
        }
    }, [currentPage]);

    const toggleSidebar = () => {
        setSidebarOpen((prev) => !prev);
    };

    const isNonUserPage = currentPage === 'nonUserPage';
    if (isNonUserPage) {
        return null;
    }

    const getRoleImage = () => {
        switch (role) {
            case 'manufacturer':
                return manufacturerImage;
            case 'retailer':
                return retailerImage;
            case 'distributor':
                return distributorImage;
            default:
                return null;
        }
    };

    return (
        <>
        {!sidebarOpen && (
    <button className="hamburger-menu-outside" onClick={toggleSidebar}>
      <FontAwesomeIcon icon={faBars} />
    </button>
  )}    

<aside
  ref={sidebarRef}
  className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}
>
{sidebarOpen && (
      <button className="hamburger-menu-inside" onClick={toggleSidebar}>
        <FontAwesomeIcon icon={faBars} />
      </button>
    )}

                <div className="sidebar-header">
                    <div className="logo-container">
                        <img src={logo} alt="Farm To Fork Logo" className="logo" />
                        <span className="sidebar-title">Farm To Fork</span>
                    </div>
                    <hr className="separator" />
                    <div className="role-section">
                        <img
                            src={getRoleImage()}
                            alt={`${role} Logo`}
                            className="role-image"
                        />
                        <p className="role-name">{role === 'manufacturer' ? 'Manufacturer' : role === 'retailer' ? 'Retailer' : 'Distributor'}</p>
                        <p className="role-description">
                            {role === 'manufacturer'
                                ? 'Create and manage your products.'
                                : role === 'retailer'
                                    ? 'Order and track shipments.'
                                    : 'Distribute products efficiently.'}
                        </p>
                    </div>
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
                                {invalidTempOrders && invalidTempOrders.length > 0 && (
                                    <FontAwesomeIcon
                                        icon={faCircle}
                                        style={{
                                            color: 'red',
                                            marginLeft: '5px',
                                            fontSize: '10px',
                                        }}
                                    />
                                )}
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
                            <a
                                href="#retailerOrders"
                                onClick={() => setCurrentPage('retailerOrders')}
                                className={`nav-item ${currentPage === 'retailerOrders' ? 'active' : ''}`}
                            >
                                <FontAwesomeIcon icon={faClipboardList} className="nav-icon" /> Orders
                                {invalidTempOrders && invalidTempOrders.length > 0 && (
                                    <FontAwesomeIcon
                                        icon={faCircle}
                                        style={{
                                            color: 'red',
                                            marginLeft: '5px',
                                            fontSize: '10px',
                                        }}
                                    />
                                )}
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
                                {invalidTempOrders && invalidTempOrders.length > 0 && (
                                    <FontAwesomeIcon
                                        icon={faCircle}
                                        style={{
                                            color: 'red',
                                            marginLeft: '5px',
                                            fontSize: '10px',
                                        }}
                                    />
                                )}
                            </a>
                        </>
                    )}
                </nav>
            </aside>

            <div className="page-content">
                {showBreadcrumb && (
                    <Breadcrumb currentPage={currentPage} setCurrentPage={setCurrentPage} />
                )}
            </div>
        </>
    );
};

export default Sidebar;
