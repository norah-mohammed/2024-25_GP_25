import React from 'react';
import './NonUserPage.css';
import logo from './images/only-logo.png'; // Ensure the logo is correctly placed
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShippingFast,
  faUsers,
  faSearch,
  faClipboardList,
  faChartLine,
  faThermometerHalf,
} from '@fortawesome/free-solid-svg-icons';

const NonUserPage = () => {
  return (
    <div className="non-user-container">
      {/* Header Section */}
      <header className="non-user-header">
        <div className="logo-container">
          <img src={logo} alt="Farm To Fork Logo" className="logo" />
        </div>
        <h1>Welcome to the future of food transparency and safety!</h1>
        <p>
          Track every step of your food’s journey with Farm to Fork, where trust meets innovation.
        </p>
      </header>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="feature-container">
          <div className="feature">
            <FontAwesomeIcon icon={faUsers} className="icon" />
            <p>
              <strong>Manufacturers:</strong> Create and list products, manage orders, and ship goods to distributors.
            </p>
          </div>
          <div className="feature">
            <FontAwesomeIcon icon={faUsers} className="icon" />
            <p>
              <strong>Retailers:</strong> Browse available products, place orders, and track shipments.
            </p>
          </div>
          <div className="feature">
            <FontAwesomeIcon icon={faShippingFast} className="icon" />
            <p>
              <strong>Distributors:</strong> Ensure products are transported safely by managing logistics and shipment statuses.
            </p>
          </div>
        </div>
      </section>

      {/* Why Join Section */}
      <section className="why-join">
        <h2>Why Join Farm To Fork?</h2>
        <div className="feature-container">
          <div className="feature">
            <FontAwesomeIcon icon={faChartLine} className="icon" />
            <p>
              <strong>Efficiency:</strong> Streamline your order processing and delivery management in one place.
            </p>
          </div>
          <div className="feature">
            <FontAwesomeIcon icon={faSearch} className="icon" />
            <p>
              <strong>Transparency:</strong> Easily track the status of products at each stage of the supply chain with real-time updates.
            </p>
          </div>
          <div className="feature">
            <FontAwesomeIcon icon={faClipboardList} className="icon" />
            <p>
              <strong>Reliability:</strong> Minimize errors, delays, and issues with our automated tracking and notifications.
            </p>
          </div>
          <div className="feature">
            <FontAwesomeIcon icon={faThermometerHalf} className="icon" />
            <p>
              <strong>Flexibility:</strong> Manage products, orders, and shipments from anywhere with support for different transport needs and schedules.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2024 Farm To Fork. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default NonUserPage;
